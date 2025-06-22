import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
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

    // --- LOG: Inicio del método con datos de entrada ---
    console.log('=== Inicia registrarPago ===');
    console.log('Datos recibidos para CI:', ci);
    console.log('Monto:', monto, 'MetodoPago ID:', metodoPago);
    console.log('Tipo Membresía ID solicitado:', tipoMembresiaId);
    console.log('ID Usuario:', idUsuario, 'IP:', ip);

    const persona = await this.personaRepository.findOneBy({ CI: ci });
    if (!persona) throw new NotFoundException('Persona no encontrada');
    console.log('Persona encontrada:', persona.Nombre, persona.Apellido);

    const cliente = await this.clienteRepository.findOneBy({ CI: ci });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    console.log('Cliente encontrado para CI:', cliente.CI);

    const tipoNuevo = await this.tipoMembresiaRepository.findOneBy({
      ID: tipoMembresiaId,
    });
    if (!tipoNuevo)
      throw new NotFoundException('Tipo de membresía no encontrado');
    console.log(
      'Tipo de membresía solicitado (nuevo):',
      tipoNuevo.NombreTipo,
      'ID:',
      tipoNuevo.ID,
    );

    const hoy = new Date();
    // ✅ DESCOMENTA ESTA LÍNEA para normalizar 'hoy' al inicio del día
    hoy.setHours(0, 0, 0, 0);
    console.log(
      'Fecha y hora actual (hoy, normalizada):',
      hoy.toLocaleString('es-BO'),
    );

    // ✅ REFINAMIENTO CLAVE: Buscar la membresía activa EXISTENTE del MISMO TIPO
    const membresiaActivaMismoTipo = await this.membresiaRepository.findOne({
      where: {
        CICliente: ci,
        TipoMembresiaID: tipoNuevo.ID, // <-- Filtra por el TipoID aquí
        FechaFin: MoreThanOrEqual(hoy), // <-- La comparación se hará con hoy normalizado
      },
      order: { FechaFin: 'DESC' }, // Obtener la más reciente de ese tipo
    });

    // ✅ REFINAMIENTO CLAVE: También buscar la membresía activa más reciente de CUALQUIER TIPO
    // Esto es para la lógica de "cambio de tipo" donde la nueva membresía empieza DESPUÉS de la actual
    const ultimaMembresiaActivaCualquierTipo =
      await this.membresiaRepository.findOne({
        where: { CICliente: ci, FechaFin: MoreThanOrEqual(hoy) }, // <-- La comparación se hará con hoy normalizado
        order: { FechaFin: 'DESC' },
      });

    // --- LOG: Resultados de la búsqueda de membresías ---
    if (membresiaActivaMismoTipo) {
      console.log('Membresía activa del MISMO TIPO encontrada:', {
        IDMembresia: membresiaActivaMismoTipo.IDMembresia,
        FechaFin: membresiaActivaMismoTipo.FechaFin,
        TipoMembresiaID: membresiaActivaMismoTipo.TipoMembresiaID,
      });
    } else {
      console.log('NO se encontró membresía activa del mismo tipo.');
    }

    if (ultimaMembresiaActivaCualquierTipo) {
      console.log('Última membresía activa (CUALQUIER tipo) encontrada:', {
        IDMembresia: ultimaMembresiaActivaCualquierTipo.IDMembresia,
        FechaFin: ultimaMembresiaActivaCualquierTipo.FechaFin,
        TipoMembresiaID: ultimaMembresiaActivaCualquierTipo.TipoMembresiaID,
      });
    } else {
      console.log('NO se encontró ninguna membresía activa de ningún tipo.');
    }

    let fechaInicioMembresia: Date;
    let fechaFinMembresia: Date;
    let membresiaARegistrar: Membresia;
    let tipoAccionMembresia: 'extension' | 'nueva' | 'cambio_tipo';

    if (membresiaActivaMismoTipo) {
      // Caso 1: Extensión de la misma membresía activa
      console.log(
        '>>> CASO 1: Ejecutando lógica de EXTENSIÓN de la misma membresía.',
      );
      fechaInicioMembresia = membresiaActivaMismoTipo.FechaFin; // Inicia el día que termina la actual
      fechaFinMembresia = new Date(fechaInicioMembresia);
      fechaFinMembresia.setDate(
        fechaFinMembresia.getDate() + tipoNuevo.DuracionDias,
      );

      membresiaActivaMismoTipo.FechaFin = fechaFinMembresia;
      await this.membresiaRepository.save(membresiaActivaMismoTipo);
      membresiaARegistrar = membresiaActivaMismoTipo; // Referencia a la entidad actualizada
      tipoAccionMembresia = 'extension';
      console.log(
        'Membresía existente (ID:',
        membresiaActivaMismoTipo.IDMembresia,
        ') actualizada. Nueva FechaFin:',
        membresiaActivaMismoTipo.FechaFin.toLocaleDateString(),
      );
    } else if (ultimaMembresiaActivaCualquierTipo) {
      // Hay una membresía activa, pero no del mismo tipo (o ya venció si era del mismo tipo)
      // Caso 2: Cambio de tipo de membresía activa (la nueva inicia después de que termine la actual)
      console.log(
        '>>> CASO 2: Ejecutando lógica de CAMBIO DE TIPO de membresía.',
      );
      fechaInicioMembresia = ultimaMembresiaActivaCualquierTipo.FechaFin; // Inicia el día que termina la actual
      fechaFinMembresia = new Date(fechaInicioMembresia);
      fechaFinMembresia.setDate(
        fechaFinMembresia.getDate() + tipoNuevo.DuracionDias,
      );

      membresiaARegistrar = this.membresiaRepository.create({
        FechaInicio: fechaInicioMembresia,
        FechaFin: fechaFinMembresia,
        PlataformaWeb: 'Presencial', // Asumimos presencial para registrarPago
        TipoMembresiaID: tipoNuevo.ID,
        CICliente: ci,
      });
      await this.membresiaRepository.save(membresiaARegistrar);
      tipoAccionMembresia = 'cambio_tipo';
      console.log(
        'Nueva membresía (por cambio de tipo) creada. ID:',
        membresiaARegistrar.IDMembresia,
      );
      console.log(
        'Fechas de nueva membresía:',
        fechaInicioMembresia.toLocaleDateString(),
        ' - ',
        fechaFinMembresia.toLocaleDateString(),
      );
    } else {
      // Caso 3: Nueva membresía (no hay activa de ningún tipo o ya venció completamente)
      console.log(
        '>>> CASO 3: Ejecutando lógica de NUEVA membresía (no hay activa o vencida).',
      );
      fechaInicioMembresia = hoy;
      fechaFinMembresia = new Date(fechaInicioMembresia);
      fechaFinMembresia.setDate(
        fechaFinMembresia.getDate() + tipoNuevo.DuracionDias,
      );

      membresiaARegistrar = this.membresiaRepository.create({
        FechaInicio: fechaInicioMembresia,
        FechaFin: fechaFinMembresia,
        PlataformaWeb: 'Presencial', // Asumimos presencial para registrarPago
        TipoMembresiaID: tipoNuevo.ID,
        CICliente: ci,
      });
      await this.membresiaRepository.save(membresiaARegistrar);
      tipoAccionMembresia = 'nueva';
      console.log(
        'Nueva membresía creada. ID:',
        membresiaARegistrar.IDMembresia,
      );
      console.log(
        'Fechas de nueva membresía:',
        fechaInicioMembresia.toLocaleDateString(),
        ' - ',
        fechaFinMembresia.toLocaleDateString(),
      );
    }

    console.log('Tipo de acción de membresía final:', tipoAccionMembresia);
    console.log(
      'ID de la membresía que se usará para el detalle de pago:',
      membresiaARegistrar.IDMembresia,
    );

    // SIEMPRE crear el registro de pago y detalle de pago
    const nuevoPago = this.pagosRepository.create({
      Fecha: hoy,
      Monto: monto,
      MetodoPago: metodoPago,
      CIPersona: ci,
    });
    await this.pagosRepository.save(nuevoPago);
    console.log(
      'Pago creado. NroPago:',
      nuevoPago.NroPago,
      'Monto:',
      nuevoPago.Monto,
    );

    const detalle = this.detallePagoRepository.create({
      IDPago: nuevoPago.NroPago,
      IDMembresia: membresiaARegistrar.IDMembresia, // Usa la membresía que se actualizó/creó
      IDClase:
        tipoNuevo.ID === 2 || tipoNuevo.ID === 3 ? (idClase ?? null) : null,
      MontoTotal: monto,
      IDPromo: null,
    });
    await this.detallePagoRepository.save(detalle);
    console.log(
      'Detalle de pago creado para IDPago:',
      detalle.IDPago,
      'IDMembresia:',
      detalle.IDMembresia,
    );

    let mensajeRespuesta = '';
    if (tipoAccionMembresia === 'extension') {
      mensajeRespuesta = `Se ha extendido tu membresía de tipo "${tipoNuevo.NombreTipo}" hasta el ${fechaFinMembresia.toLocaleDateString('es-BO')}.`;
    } else if (tipoAccionMembresia === 'cambio_tipo') {
      mensajeRespuesta = `Tu nueva membresía (cambio de tipo a "${tipoNuevo.NombreTipo}") comenzará el ${fechaInicioMembresia.toLocaleDateString('es-BO')} y finalizará el ${fechaFinMembresia.toLocaleDateString('es-BO')}.`;
    } else {
      // 'nueva'
      mensajeRespuesta = `Tu nueva membresía de tipo "${tipoNuevo.NombreTipo}" ha comenzado hoy (${fechaInicioMembresia.toLocaleDateString('es-BO')}) y finalizará el ${fechaFinMembresia.toLocaleDateString('es-BO')}.`;
    }

    // Registro en Bitácora
    let accionBitacora = '';
    if (tipoAccionMembresia === 'extension') {
      accionBitacora = `Extendió membresía ${tipoNuevo.NombreTipo} de CI ${ci}. Nuevo fin: ${fechaFinMembresia.toLocaleDateString('es-BO')}.`;
    } else {
      accionBitacora = `Registró pago de $${monto.toFixed(2)} para CI ${ci} con ${tipoAccionMembresia} membresía ${tipoNuevo.NombreTipo}.`;
    }

    await this.bitacoraRepository.save({
      idUsuario,
      accion: accionBitacora,
      tablaAfectada: 'pago / membresía / detalle_pago',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
      IDPago: nuevoPago.NroPago,
    });
    console.log('Bitácora registrada. Acción:', accionBitacora);

    // --- LOG: Fin del método con respuesta ---
    console.log('=== Fin registrarPago ===');
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
