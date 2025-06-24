import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { Pago } from './pagos.entity';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { Membresia } from 'membresias/membresia.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { TipoMembresia } from 'paquete-3-control-comercial/membresias/Tipos/tipo_membresia.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Clase } from 'paquete-2-servicios-gimnasio/clases/clase.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';
import { MailerService } from '@nestjs-modules/mailer';
// ✅ Importación de pdfmake y asignación de fuentes VFS
import pdfMake from '../utils/pdf.config';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,

    @InjectRepository(DetallePago)
    private detallePagoRepository: Repository<DetallePago>,

    @InjectRepository(Membresia)
    private membresiaRepository: Repository<Membresia>,

    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,

    @InjectRepository(TipoMembresia)
    private tipoMembresiaRepository: Repository<TipoMembresia>,

    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,

    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,

    @InjectRepository(Clase)
    private claseRepository: Repository<Clase>,
    @InjectRepository(Bitacora)
    private bitacoraRepository: Repository<Bitacora>,

    private readonly mailerService: MailerService,
  ) {}

  async generarComprobantePDF(nroPago: number): Promise<Buffer> {
    const pago = await this.pagosRepository.findOne({
      where: { NroPago: nroPago },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    const detalles = await this.detallePagoRepository.find({
      where: { IDPago: nroPago },
      relations: ['membresia', 'clase'],
    });
    if (!detalles || detalles.length === 0)
      throw new NotFoundException('Detalle de pago no encontrado');

    const detalle = detalles[0];
    const persona = await this.personaRepository.findOne({
      where: { CI: pago.CIPersona },
    });
    if (!persona) throw new NotFoundException('Persona no encontrada');

    const usuario = await this.usuarioRepository.findOne({
      where: { idPersona: { CI: persona.CI } },
    });
    const membresia = detalle.membresia;
    const tipo = membresia?.TipoMembresiaID
      ? await this.tipoMembresiaRepository.findOne({
          where: { ID: membresia.TipoMembresiaID },
        })
      : null;
    const clase = detalle.clase;

    let metodoNombre = 'Desconocido';
    switch (pago.MetodoPago) {
      case 1:
        metodoNombre = 'Efectivo';
        break;
      case 2:
        metodoNombre = 'Tarjeta';
        break;
      case 3:
        metodoNombre = 'Transferencia';
        break;
      case 4:
        metodoNombre = 'Pago en Línea';
        break;
      default:
        metodoNombre = 'Otro';
    }

    const membresiasPrevias = await this.membresiaRepository.find({
      where: { CICliente: pago.CIPersona },
      order: { FechaFin: 'DESC' },
    });

    let tipoAccion = 'Nueva membresía';
    const membresiasAnteriores = membresiasPrevias.filter(
      (m) =>
        m.IDMembresia !== membresia?.IDMembresia &&
        new Date(m.FechaFin) >= new Date(membresia.FechaInicio),
    );

    if (membresiasAnteriores.length > 0) {
      const ultimaMembresia = membresiasAnteriores[0];
      const mismaFecha =
        new Date(ultimaMembresia.FechaFin).toDateString() ===
        new Date(membresia.FechaInicio).toDateString();

      if (
        ultimaMembresia.TipoMembresiaID === membresia.TipoMembresiaID &&
        mismaFecha
      ) {
        tipoAccion = 'Extensión de membresía';
      } else if (
        ultimaMembresia.TipoMembresiaID !== membresia.TipoMembresiaID &&
        mismaFecha
      ) {
        tipoAccion = 'Cambio de tipo de membresía';
      }
    }

    const fechaInicio = new Date(membresia.FechaInicio);
    const fechaFin = new Date(membresia.FechaFin);

    const docDefinition: TDocumentDefinitions = {
      content: [
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              text: '🏋️‍ Comprobante de Pago',
              style: 'header',
            },
            { width: '*', text: '' },
          ],
        },
        { text: 'GoFit GYM', style: 'subheader', alignment: 'center' },
        { text: '\n' },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Nombre del Cliente:', bold: true },
                `${persona.Nombre} ${persona.Apellido}`,
              ],
              [{ text: 'CI:', bold: true }, `${persona.CI}`],
              [{ text: 'Correo:', bold: true }, `${usuario?.correo ?? 'N/D'}`],
              [
                { text: 'Fecha del Pago:', bold: true },
                `${new Date(pago.Fecha).toLocaleDateString('es-BO')}`,
              ],
              [
                { text: 'Monto Pagado:', bold: true },
                `${(+pago.Monto).toFixed(2)} BOB`,
              ],
              [{ text: 'Método de Pago:', bold: true }, `${metodoNombre}`],
              [{ text: 'N° Comprobante:', bold: true }, `#${pago.NroPago}`],
              [
                { text: 'Tipo de Acción:', bold: true },
                tipoAccion === 'Cambio de tipo de membresía'
                  ? 'Cambio de tipo (Básica → Gold, etc.)'
                  : tipoAccion,
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },
        { text: '\n\n' },
        { text: '📋 Detalles de Membresía', style: 'sectionHeader' },
        {
          ul: [
            `Membresía: ${tipo?.NombreTipo ?? 'Sin membresía'}`,
            `Plataforma: ${membresia?.PlataformaWeb ?? 'N/A'}`,
            `Duración: ${tipo?.DuracionDias ?? '-'} días`,
            `Fecha Inicio: ${fechaInicio.toLocaleDateString('es-BO')}`,
            `Fecha Fin: ${fechaFin.toLocaleDateString('es-BO')}`,
            `Clase incluida: ${clase?.Nombre ?? 'Ninguna'}`,
          ],
        },
        { text: '\n\n' },
        {
          text: 'Gracias por tu confianza.\nEste documento es una constancia válida de tu transacción.\nNos vemos en GoFit GYM 💪',
          style: 'footer',
          alignment: 'center',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        sectionHeader: {
          fontSize: 13,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        footer: {
          fontSize: 10,
          italics: true,
          color: 'gray',
        },
      },
    };

    return new Promise((resolve) => {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    });
  }

  // ✅ enviarComprobantePorCorreo (con mejoras de fecha de membresía)
  async enviarComprobantePorCorreo(nroPago: number): Promise<void> {
    const pdfBuffer = await this.generarComprobantePDF(nroPago);

    const pago = await this.pagosRepository.findOne({
      where: { NroPago: nroPago },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    const persona = await this.personaRepository.findOne({
      where: { CI: pago.CIPersona },
    });
    const usuario = await this.usuarioRepository.findOne({
      where: { idPersona: { CI: persona?.CI } },
    });

    if (!usuario || !usuario.correo) {
      throw new InternalServerErrorException(
        'No se encontró el correo del usuario.',
      );
    }

    // Método de pago
    let metodoNombre = 'Desconocido';
    switch (pago.MetodoPago) {
      case 1:
        metodoNombre = 'Efectivo';
        break;
      case 2:
        metodoNombre = 'Tarjeta';
        break;
      case 3:
        metodoNombre = 'Transferencia';
        break;
      case 4:
        metodoNombre = 'Pago en Línea';
        break;
      default:
        metodoNombre = 'Otro';
    }

    // Fecha formateada
    const fechaPago = new Date(pago.Fecha).toLocaleDateString();

    // 🔍 Buscar membresía asociada
    const detalles = await this.detallePagoRepository.find({
      where: { IDPago: nroPago },
      relations: ['membresia', 'membresia.tipo'],
    });
    let tipoAccion = 'Nueva membresía';
    const membresiaActual = detalles[0]?.membresia;

    if (membresiaActual?.CICliente) {
      const membresiasPrevias = await this.membresiaRepository.find({
        where: { CICliente: membresiaActual.CICliente },
        order: { FechaFin: 'DESC' },
      });

      const anteriores = membresiasPrevias.filter(
        (m) => m.IDMembresia !== membresiaActual.IDMembresia,
      );

      if (anteriores.length > 0) {
        const ultima = anteriores[0];
        const fechaFinUltima = new Date(ultima.FechaFin);
        const fechaInicioNueva = new Date(membresiaActual.FechaInicio);

        const diferenciaDias = Math.floor(
          (fechaInicioNueva.getTime() - fechaFinUltima.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (diferenciaDias === 1) {
          if (ultima.TipoMembresiaID === membresiaActual.TipoMembresiaID) {
            tipoAccion = 'Extensión de membresía';
          } else {
            tipoAccion = 'Cambio de tipo de membresía';
          }
        } else {
          tipoAccion = 'Nueva membresía';
        }
      }
    }

    // 🔢 Cálculo de fechas nueva membresía
    const hoy = new Date();

    let nuevaFechaInicio: Date;
    let nuevaFechaFin: Date;

    if (
      membresiaActual &&
      membresiaActual.FechaFin >= hoy &&
      membresiaActual.TipoMembresiaID ===
        detalles[0]?.membresia?.TipoMembresiaID
    ) {
      // 🟡 Extensión
      nuevaFechaInicio = new Date(membresiaActual.FechaFin);
      nuevaFechaFin = new Date(nuevaFechaInicio);
      nuevaFechaFin.setDate(
        nuevaFechaFin.getDate() +
          (detalles[0]?.membresia?.tipo?.DuracionDias || 0),
      );
    } else {
      // 🔵 Nueva o cambio de tipo
      nuevaFechaInicio =
        membresiaActual && membresiaActual.FechaFin >= hoy
          ? new Date(membresiaActual.FechaFin)
          : hoy;

      nuevaFechaFin = new Date(nuevaFechaInicio);
      nuevaFechaFin.setDate(
        nuevaFechaFin.getDate() +
          (detalles[0]?.membresia?.tipo?.DuracionDias || 0),
      );
    }

    await this.mailerService.sendMail({
      to: usuario.correo,
      subject: 'Tu comprobante de pago - GoFit GYM',
      text: `Hola ${persona?.Nombre},

Gracias por tu ${tipoAccion.toLowerCase()} realizada el ${fechaPago} mediante ${metodoNombre}.

🧾 Número de comprobante: #${pago.NroPago}
📅 Fecha actual de vencimiento: ${membresiaActual?.FechaFin ? new Date(membresiaActual.FechaFin).toLocaleDateString('es-BO') : 'No definida'}
🔜 Nueva membresía activa desde: ${nuevaFechaInicio.toLocaleDateString('es-BO')}
🏁 Nueva membresía válida hasta: ${nuevaFechaFin.toLocaleDateString('es-BO')}

Adjuntamos el comprobante de tu pago en formato PDF.

¡Gracias por formar parte de GoFit GYM!
`,
      attachments: [
        {
          filename: `comprobante_pago_${nroPago}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  //obtener comprobante por ci en recepcion
  async obtenerPagosPorCI(ci: string): Promise<Pago[]> {
    return this.pagosRepository.find({
      where: { CIPersona: ci },
      relations: [
        'detalles',
        'detalles.membresia',
        'detalles.membresia.tipo',
        'detalles.clase',
      ],
      order: { Fecha: 'DESC' },
    });
  }

  // ✅ MÉTODO registrarPago REFORMULADO
  async registrarPago(data: {
    ci: string;
    monto: number;
    metodoPago: number;
    tipoMembresiaId: number;
    idClase?: number | null;
    idUsuario: string;
    ip: string;
  }) {
    const { ci, monto, metodoPago, tipoMembresiaId, idClase, idUsuario, ip } =
      data;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const persona = await this.personaRepository.findOneBy({ CI: ci });
    if (!persona) throw new NotFoundException('Persona no encontrada');

    const cliente = await this.clienteRepository.findOneBy({ CI: ci });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const tipoNuevo = await this.tipoMembresiaRepository.findOneBy({
      ID: tipoMembresiaId,
    });
    if (!tipoNuevo)
      throw new NotFoundException('Tipo de membresía no encontrado');

    // 🛑 Evitar múltiples extensiones el mismo día
    const membresiaActivaMismoTipo = await this.membresiaRepository.findOne({
      where: {
        CICliente: ci,
        TipoMembresiaID: tipoNuevo.ID,
        FechaFin: MoreThanOrEqual(hoy),
      },
      order: { FechaFin: 'DESC' },
    });

    const yaExtendidoHoy =
      membresiaActivaMismoTipo &&
      new Date(
        membresiaActivaMismoTipo.updatedAt || membresiaActivaMismoTipo.FechaFin,
      ).toDateString() === hoy.toDateString();

    // 🛑 Evitar múltiples compras de la misma membresía el mismo día
    const conflictoHoy = await this.membresiaRepository.findOne({
      where: {
        CICliente: ci,
        TipoMembresiaID: tipoNuevo.ID,
        FechaInicio: hoy,
      },
    });
    if (conflictoHoy) {
      throw new ConflictException(
        'Ya tienes una membresía de este tipo registrada hoy.',
      );
    }

    // 🧠 Buscar última membresía activa (de cualquier tipo)
    const ultimaActiva = await this.membresiaRepository.findOne({
      where: { CICliente: ci, FechaFin: MoreThanOrEqual(hoy) },
      order: { FechaFin: 'DESC' },
    });

    let fechaInicio: Date;
    let fechaFin: Date;
    let membresiaARegistrar: Membresia;
    let tipoAccion: 'extension' | 'nueva' | 'cambio_tipo';

    if (membresiaActivaMismoTipo && !yaExtendidoHoy) {
      // ✅ Extensión
      fechaInicio = membresiaActivaMismoTipo.FechaFin;
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + tipoNuevo.DuracionDias);

      membresiaActivaMismoTipo.FechaFin = fechaFin;
      await this.membresiaRepository.save(membresiaActivaMismoTipo);
      membresiaARegistrar = membresiaActivaMismoTipo;
      tipoAccion = 'extension';
    } else if (ultimaActiva) {
      // ✅ Cambio de tipo (después de la actual)
      fechaInicio = new Date(ultimaActiva.FechaFin);
      fechaInicio.setDate(fechaInicio.getDate() + 1);
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + tipoNuevo.DuracionDias);

      membresiaARegistrar = this.membresiaRepository.create({
        FechaInicio: fechaInicio,
        FechaFin: fechaFin,
        PlataformaWeb: 'Web',
        TipoMembresiaID: tipoNuevo.ID,
        CICliente: ci,
      });
      await this.membresiaRepository.save(membresiaARegistrar);
      tipoAccion = 'cambio_tipo';
    } else {
      // ✅ Primera membresía
      fechaInicio = hoy;
      fechaFin = new Date(hoy);
      fechaFin.setDate(fechaFin.getDate() + tipoNuevo.DuracionDias);

      membresiaARegistrar = this.membresiaRepository.create({
        FechaInicio: fechaInicio,
        FechaFin: fechaFin,
        PlataformaWeb: 'Web',
        TipoMembresiaID: tipoNuevo.ID,
        CICliente: ci,
      });
      await this.membresiaRepository.save(membresiaARegistrar);
      tipoAccion = 'nueva';
    }

   // 💳 Crear pago
const nuevoPago = this.pagosRepository.create({
  Fecha: new Date(),
  Monto: monto,
  MetodoPago: metodoPago,
  CIPersona: ci,
});
await this.pagosRepository.save(nuevoPago);

// ✅ Guardar detalle de pago incluyendo IDClase si corresponde
const detalle = this.detallePagoRepository.create({
  IDPago: nuevoPago.NroPago,
  IDMembresia: membresiaARegistrar.IDMembresia,
  IDClase: idClase ?? null, // 🔁 Cambio aquí: ahora siempre se guarda si viene
  MontoTotal: monto,
  IDPromo: null,
});
await this.detallePagoRepository.save(detalle);

    // 📝 Bitácora
    const accionBitacora =
      tipoAccion === 'extension'
        ? `Extendió membresía ${tipoNuevo.NombreTipo} para CI ${ci}.`
        : `Registró pago de membresía (${tipoAccion}) ${tipoNuevo.NombreTipo} para CI ${ci}.`;

    await this.bitacoraRepository.save({
      idUsuario,
      accion: accionBitacora,
      tablaAfectada: 'pago / membresía / detalle_pago',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
      IDPago: nuevoPago.NroPago,
    });

    // ✅ Respuesta
    const mensajeRespuesta =
      tipoAccion === 'extension'
        ? `Se ha extendido tu membresía hasta el ${fechaFin.toLocaleDateString('es-BO')}.`
        : tipoAccion === 'cambio_tipo'
          ? `Tu nueva membresía (cambio de tipo) comenzará el ${fechaInicio.toLocaleDateString('es-BO')} y finalizará el ${fechaFin.toLocaleDateString('es-BO')}.`
          : `Tu nueva membresía ha comenzado hoy y finalizará el ${fechaFin.toLocaleDateString('es-BO')}.`;

    return {
      mensaje: mensajeRespuesta,
      nroPago: nuevoPago.NroPago,
    };
  }

  async previsualizarCambioMembresia(
    ci: string,
    tipoNuevoID: number,
  ): Promise<{
    mensaje: string;
    accion: 'extender' | 'nueva' | 'cambio_tipo';
  }> {
    const persona = await this.personaRepository.findOneBy({ CI: ci });
    if (!persona) throw new NotFoundException('Persona no encontrada');

    const cliente = await this.clienteRepository.findOneBy({ CI: ci });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const tipoNuevo = await this.tipoMembresiaRepository.findOne({
      where: { ID: tipoNuevoID },
    });
    if (!tipoNuevo)
      throw new NotFoundException('Tipo de membresía no encontrado');

    const hoy = new Date();
    // Ajustar 'hoy' para que solo compare fechas, no horas
    hoy.setHours(0, 0, 0, 0);

    const membresiaActual = await this.membresiaRepository.findOne({
      where: { CICliente: ci, FechaFin: MoreThanOrEqual(hoy) }, // Buscar solo las que terminan hoy o después
      order: { FechaFin: 'DESC' }, // La más reciente activa
      relations: ['tipo'], // ✅ Cargar la relación 'tipo' para acceder a NombreTipo
    });

    if (membresiaActual) {
      if (membresiaActual.TipoMembresiaID === tipoNuevoID) {
        // Es el mismo tipo de membresía y está activa
        const nuevaFechaFin = new Date(membresiaActual.FechaFin);
        nuevaFechaFin.setDate(nuevaFechaFin.getDate() + tipoNuevo.DuracionDias);
        return {
          mensaje: `Tienes una membresía activa del mismo tipo ("${tipoNuevo.NombreTipo}"). Se extenderá hasta el ${nuevaFechaFin.toLocaleDateString()}.`,
          accion: 'extender',
        };
      } else {
        // Hay una membresía activa pero de tipo diferente
        const nuevaFechaInicio = new Date(membresiaActual.FechaFin); // La nueva membresía comenzará al terminar la actual
        nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() + 1); // Un día después de que termine la anterior

        const nuevaFechaFin = new Date(nuevaFechaInicio);
        nuevaFechaFin.setDate(nuevaFechaFin.getDate() + tipoNuevo.DuracionDias);
        return {
          // Corrección aquí: usar membresiaActual.tipo?.NombreTipo para el tipo actual
          mensaje: `Tienes una membresía activa de tipo "${membresiaActual.tipo?.NombreTipo}". Tu nueva membresía de tipo "${tipoNuevo.NombreTipo}" comenzará el ${nuevaFechaInicio.toLocaleDateString()} y finalizará el ${nuevaFechaFin.toLocaleDateString()}.`,
          accion: 'cambio_tipo',
        };
      }
    }

    // No hay membresía activa o ya venció
    const fechaInicio = hoy;
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + tipoNuevo.DuracionDias);

    return {
      mensaje: `Tu nueva membresía de tipo "${tipoNuevo.NombreTipo}" comenzará hoy (${fechaInicio.toLocaleDateString()}) y finalizará el ${fechaFin.toLocaleDateString()}.`,
      accion: 'nueva',
    };
  }
}
