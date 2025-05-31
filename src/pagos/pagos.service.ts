import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Pago } from './pagos.entity';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { Membresia } from 'src/membresias/menbresia.entity';
import { Cliente } from 'src/paquete-1-usuarios-accesos/clientes/cliente.entity';
import { TipoMembresia } from 'src/membresias/Tipos/menbresia.entity';
import { Persona } from 'src/paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from 'src/paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Clase } from '../clases/clase.entity';

import { RegistroPagoDto } from './registro-pago/registro-pago.dto';
import { MailerService } from '@nestjs-modules/mailer';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

//(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
(pdfMake as any).vfs = (pdfFonts as any).vfs;

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

    private readonly mailerService: MailerService,
  ) {}

  //  Método original de registrar pago (sin tocar)
  async generarComprobantePDF(nroPago: number): Promise<Buffer> {
    console.log('🔎 Buscando detalle con IDPago:', nroPago);

    const pago = await this.pagosRepository.findOne({
      where: { NroPago: nroPago },
    });

    if (!pago) throw new NotFoundException('Pago no encontrado');

    const detalle = await this.detallePagoRepository.findOne({
      where: { IDPago: nroPago },
      relations: ['membresia', 'clase'],
    });

    if (!detalle) {
      const lista = await this.detallePagoRepository.find();
      console.error('❌ Detalle de pago no encontrado. Lista actual:', lista);
      throw new NotFoundException('Detalle de pago no encontrado');
    }

    console.log('🧾 Detalle encontrado para el comprobante:', detalle);

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

    // método de pago
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

    // Calcular fechas
    const fechaInicio = new Date(pago.Fecha);
    const fechaFin = new Date(pago.Fecha);
    fechaFin.setMonth(fechaFin.getMonth() + 1);

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

    // ✅ Determinar método de pago en texto
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

    // ✅ Fecha formateada
    const fechaPago = new Date(pago.Fecha).toLocaleDateString();

    await this.mailerService.sendMail({
      to: usuario.correo,
      subject: 'Tu comprobante de pago - GoFit GYM',
      text: `Hola ${persona?.Nombre},

Gracias por tu compra realizada el ${fechaPago} mediante ${metodoNombre}.

Adjuntamos el comprobante de tu pago con número #${pago.NroPago} en formato PDF.

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

  //forma manual recepcion
  /* async registrarPago(data: {
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

    const tipo = await this.tipoMembresiaRepository.findOneBy({
      ID: tipoMembresiaId,
    });
    if (!tipo) throw new NotFoundException('Tipo de membresía no encontrado');

    const hoy = new Date();
    const fechaFin = new Date(hoy);
    fechaFin.setDate(hoy.getDate() + tipo.DuracionDias);

    const nuevaMembresia = this.membresiaRepository.create({
      FechaInicio: hoy,
      FechaFin: fechaFin,
      PlataformaWeb: 'Presencial',
      TipoMembresiaID: tipo.ID,
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
      IDClase: tipo.ID === 2 || tipo.ID === 3 ? (idClase ?? null) : null,
      MontoTotal: monto,
      IDPromo: null,
    });
    await this.detallePagoRepository.save(detalle);

    // Bitácora
    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Registró manualmente un pago de $${monto.toFixed(2)} para CI ${ci} con membresía ${tipo.NombreTipo}.`,
      tablaAfectada: 'pago / membresía / detalle_pago',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
      IDPago: nuevoPago.NroPago,
    });

    return {
      mensaje: 'Pago registrado correctamente',
      nroPago: nuevoPago.NroPago,
    };
  }*/
}
