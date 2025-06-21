import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Pago } from './pagos.entity';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { Membresia } from 'membresias/menbresia.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { TipoMembresia } from 'paquete-2-servicios-gimnasio/membresias/Tipos/tipo_menbresia.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Clase } from 'paquete-2-servicios-gimnasio/clases/clase.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';
import { MailerService } from '@nestjs-modules/mailer';
// ✅ Importación de pdfmake y asignación de fuentes VFS
import pdfMake from '../utils/pdf.config';

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

  //  Método original de registrar pago (sin tocar)
  async generarComprobantePDF(nroPago: number): Promise<Buffer> {
    const pago = await this.pagosRepository.findOne({
      where: { NroPago: nroPago },
    });

    if (!pago) throw new NotFoundException('Pago no encontrado');

    const detalles = await this.detallePagoRepository.find({
      where: { IDPago: nroPago },
      relations: ['membresia', 'clase'],
    });

    if (!detalles || detalles.length === 0) {
      throw new NotFoundException('Detalle de pago no encontrado');
    }

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

    // Determinar si fue extensión o nueva membresía
    const membresiasPrevias = await this.membresiaRepository.find({
      where: { CICliente: pago.CIPersona },
      order: { FechaFin: 'DESC' },
    });

    let tipoAccion = 'Nueva membresía';

    // Verificamos si hay otra membresía anterior a esta
    if (membresiasPrevias.length > 1) {
      const ultimaMembresia = membresiasPrevias[1]; // la anterior a la actual

      if (
        ultimaMembresia.TipoMembresiaID === membresia.TipoMembresiaID &&
        new Date(ultimaMembresia.FechaFin) >= new Date(membresia.FechaInicio)
      ) {
        tipoAccion = 'Extensión de membresía';
      } else if (
        ultimaMembresia.TipoMembresiaID !== membresia.TipoMembresiaID &&
        new Date(ultimaMembresia.FechaFin) >= new Date(membresia.FechaInicio)
      ) {
        tipoAccion = 'Cambio de tipo de membresía';
      }
    }

    const fechaInicio = new Date(membresia.FechaInicio);
    const fechaFin = new Date(membresia.FechaFin);

    const docDefinition = {
      content: [
        { text: '🏋️‍ Comprobante de Pago - GoFit GYM', style: 'header' },
        '\n',
        { text: `Cliente: ${persona.Nombre} ${persona.Apellido}` },
        { text: `CI: ${persona.CI}` },
        { text: `Correo: ${usuario?.correo ?? 'N/D'}` },
        {
          text: `Fecha del Pago: ${new Date(pago.Fecha).toLocaleDateString()}`,
        },
        { text: `Monto Pagado: $${(+pago.Monto).toFixed(2)} USD` },
        { text: `Método de Pago: ${metodoNombre}` },
        { text: `Número de Comprobante: #${pago.NroPago}` },
        {
          text: `Tipo de acción: ${tipoAccion === 'Cambio de tipo de membresía' ? 'Cambio de tipo (Básica → Gold, etc.)' : tipoAccion}`,
        },

        '\n',
        { text: '🧾 Detalles:' },
        { text: `Membresía: ${tipo?.NombreTipo ?? 'Sin membresía'}` },
        { text: `Plataforma: ${membresia?.PlataformaWeb ?? 'N/A'}` },
        { text: `Duración: ${tipo?.DuracionDias ?? '-'} días` },
        { text: `Fecha Inicio: ${fechaInicio.toLocaleDateString()}` },
        { text: `Fecha Fin: ${fechaFin.toLocaleDateString()}` },
        { text: `Clase incluida: ${clase?.Nombre ?? 'Ninguna'}` },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center' as const,
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

  // ✅ enviarComprobantePorCorreo (sin cambios, pero por consistencia)
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
      relations: ['membresia'],
    });

    const membresiaActual = detalles[0]?.membresia;

    let tipoAccion = 'Nueva membresía';
    const membresiasPrevias = await this.membresiaRepository.find({
      where: { CICliente: pago.CIPersona },
      order: { FechaFin: 'DESC' },
    });

    if (membresiasPrevias.length > 1) {
      const ultimaMembresia = membresiasPrevias[1];

      if (
        ultimaMembresia.TipoMembresiaID === membresiaActual.TipoMembresiaID &&
        new Date(ultimaMembresia.FechaFin) >=
          new Date(membresiaActual.FechaInicio)
      ) {
        tipoAccion = 'Extensión de membresía';
      } else if (
        ultimaMembresia.TipoMembresiaID !== membresiaActual.TipoMembresiaID &&
        new Date(ultimaMembresia.FechaFin) >=
          new Date(membresiaActual.FechaInicio)
      ) {
        tipoAccion = 'Cambio de tipo de membresía';
      }
    }

    // 📩 Enviar correo
    await this.mailerService.sendMail({
      to: usuario.correo,
      subject: 'Tu comprobante de pago - GoFit GYM',
      text: `Hola ${persona?.Nombre},

Gracias por tu ${tipoAccion.toLowerCase()} realizada el ${fechaPago} mediante ${metodoNombre}.

Adjuntamos el comprobante de tu pago con número #${pago.NroPago} en formato PDF.

Tipo de acción: ${tipoAccion}

¡Gracias por formar parte de GoFit GYM!`,
      attachments: [
        {
          filename: `comprobante_pago_${nroPago}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`📩 Comprobante enviado a ${usuario.correo}`);
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

    const persona = await this.personaRepository.findOneBy({ CI: ci });
    if (!persona) throw new NotFoundException('Persona no encontrada');

    const cliente = await this.clienteRepository.findOneBy({ CI: ci });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const tipoNuevo = await this.tipoMembresiaRepository.findOneBy({
      ID: tipoMembresiaId,
    });
    if (!tipoNuevo)
      throw new NotFoundException('Tipo de membresía no encontrado');

    const hoy = new Date();

    // Buscar membresía actual activa
    const membresiaActual = await this.membresiaRepository.findOne({
      where: { CICliente: ci },
      order: { FechaFin: 'DESC' },
    });

    let fechaInicio: Date;
    let fechaFin: Date;
    let mensaje = '';

    if (
      membresiaActual &&
      membresiaActual.FechaFin >= hoy &&
      membresiaActual.TipoMembresiaID === tipoNuevo.ID
    ) {
      // 🔁 Misma membresía activa → extender duración
      fechaInicio = membresiaActual.FechaFin;
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + tipoNuevo.DuracionDias);

      membresiaActual.FechaFin = fechaFin;
      await this.membresiaRepository.save(membresiaActual);

      mensaje = `Se ha extendido tu membresía hasta el ${fechaFin.toLocaleDateString()}.`;

      // Bitácora
      await this.bitacoraRepository.save({
        idUsuario,
        accion: `Extendió membresía ${tipoNuevo.NombreTipo} de CI ${ci}.`,
        tablaAfectada: 'membresia',
        ipMaquina: ip === '::1' ? 'localhost' : ip,
      });

      return { mensaje, extendida: true };
    }

    // 📅 Nueva membresía: diferente tipo o ya vencida
    fechaInicio =
      membresiaActual && membresiaActual.FechaFin >= hoy
        ? new Date(membresiaActual.FechaFin)
        : hoy;

    fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + tipoNuevo.DuracionDias);

    const nuevaMembresia = this.membresiaRepository.create({
      FechaInicio: fechaInicio,
      FechaFin: fechaFin,
      PlataformaWeb: 'Presencial',
      TipoMembresiaID: tipoNuevo.ID,
      CICliente: ci,
    });
    await this.membresiaRepository.save(nuevaMembresia);

    const nuevoPago = this.pagosRepository.create({
      Fecha: hoy,
      Monto: monto,
      MetodoPago: metodoPago,
      CIPersona: ci,
    });
    await this.pagosRepository.save(nuevoPago);

    const detalle = this.detallePagoRepository.create({
      IDPago: nuevoPago.NroPago,
      IDMembresia: nuevaMembresia.IDMembresia,
      IDClase:
        tipoNuevo.ID === 2 || tipoNuevo.ID === 3 ? (idClase ?? null) : null,
      MontoTotal: monto,
      IDPromo: null,
    });
    await this.detallePagoRepository.save(detalle);
    console.log('✔️ bien');
    mensaje =
      membresiaActual && membresiaActual.FechaFin >= hoy
        ? `Tu nueva membresía comenzará el ${fechaInicio.toLocaleDateString()} después de finalizar la actual.`
        : `Tu nueva membresía ha comenzado hoy (${fechaInicio.toLocaleDateString()}).`;

    // Bitácora
    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Registró pago de $${monto.toFixed(2)} para CI ${ci} con nueva membresía ${tipoNuevo.NombreTipo}.`,
      tablaAfectada: 'pago / membresía / detalle_pago',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
      IDPago: nuevoPago.NroPago,
    });

    return {
      mensaje,
      nroPago: nuevoPago.NroPago,
    };
  }
  async previsualizarCambioMembresia(
    ci: string,
    tipoNuevoID: number,
  ): Promise<{ mensaje: string; accion: 'extender' | 'nueva' }> {
    const cliente = await this.clienteRepository.findOne({ where: { CI: ci } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const tipoNuevo = await this.tipoMembresiaRepository.findOne({
      where: { ID: tipoNuevoID },
    });
    if (!tipoNuevo)
      throw new NotFoundException('Tipo de membresía no encontrado');

    const hoy = new Date();

    // Buscar membresía activa actual
    const membresiaActual = await this.membresiaRepository.findOne({
      where: { CICliente: ci },
      order: { FechaFin: 'DESC' },
    });

    if (
      membresiaActual &&
      membresiaActual.FechaFin >= hoy &&
      membresiaActual.TipoMembresiaID === tipoNuevoID
    ) {
      // Misma membresía activa → extensión
      const nuevaFechaFin = new Date(membresiaActual.FechaFin);
      nuevaFechaFin.setDate(nuevaFechaFin.getDate() + tipoNuevo.DuracionDias);

      return {
        mensaje: `Tienes una membresía activa del mismo tipo. Se extenderá hasta el ${nuevaFechaFin.toLocaleDateString()}.`,
        accion: 'extender',
      };
    }

    // Cambio de tipo o nueva membresía
    const fechaInicio =
      membresiaActual && membresiaActual.FechaFin >= hoy
        ? new Date(membresiaActual.FechaFin)
        : hoy;

    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + tipoNuevo.DuracionDias);

    return {
      mensaje: `Tu nueva membresía comenzará el ${fechaInicio.toLocaleDateString()} y finalizará el ${fechaFin.toLocaleDateString()}.`,
      accion: 'nueva',
    };
  }
}
