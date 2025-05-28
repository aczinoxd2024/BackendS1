import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Pago } from './pagos.entity';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { Membresia } from '../membresias/menbresia.entity';
import { Cliente } from '../clientes/cliente.entity';
import { TipoMembresia } from '../membresias/Tipos/menbresia.entity';
import { Persona } from '../personas/persona.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Clase } from '../clases/clase.entity';

import { RegistroPagoDto } from './registro-pago/registro-pago.dto';
import { MailerService } from '@nestjs-modules/mailer';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

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

  // ✅ Método original de registrar pago (sin tocar)
  async registrarPago(data: RegistroPagoDto) {
    const { ciCliente, idMembresia, monto, metodoPagoId } = data;

    //validar cliente
    const cliente = await this.clienteRepository.findOneBy({ CI: ciCliente });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    //validar membresia
    const membresia = await this.membresiaRepository.findOneBy({
      IDMembresia: idMembresia,
    });
    if (!membresia) throw new NotFoundException('Membresía no encontrada');

    //crear pago
    const pago = this.pagosRepository.create({
      Fecha: new Date(),
      Monto: monto,
      MetodoPago: metodoPagoId,
      CIPersona: ciCliente,
    });
    const pagoGuardado = await this.pagosRepository.save(pago);

    //crear detalle pago
    const detallePago = this.detallePagoRepository.create({
      IDPago: pagoGuardado.NroPago,
      IDMembresia: idMembresia,
      MontoTotal: monto,
      IDPromo: null,
    });
    await this.detallePagoRepository.save(detallePago);

    return {
      mensaje: 'Pago registrado con éxito',
      pagoId: pagoGuardado.NroPago,
      cliente: ciCliente,
      membresia: idMembresia,
      montoPagado: monto,
      fecha: pagoGuardado.Fecha,
    };
  }

  //generar comprobante pago
  async generarComprobantePDF(nroPago: number): Promise<Buffer> {
    const pago = await this.pagosRepository.findOne({
      where: { NroPago: nroPago },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    const detalle = await this.detallePagoRepository.findOne({
      where: { IDPago: nroPago },
    });
    if (!detalle) throw new NotFoundException('Detalle de pago no encontrado');

    const persona = await this.personaRepository.findOne({
      where: { CI: pago.CIPersona },
    });
    if (!persona) throw new NotFoundException('Persona no encontrada');

    const usuario = await this.usuarioRepository.findOne({
      where: { idPersona: { CI: persona.CI } },
    });

    const membresia = detalle.IDMembresia
      ? await this.membresiaRepository.findOne({
          where: { IDMembresia: detalle.IDMembresia },
        })
      : null;

    const tipo = membresia?.TipoMembresiaID
      ? await this.tipoMembresiaRepository.findOne({
          where: { ID: membresia.TipoMembresiaID },
        })
      : null;

    const clase = detalle.IDClase
      ? await this.claseRepository.findOne({
          where: { IDClase: detalle.IDClase },
        })
      : null;

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
        { text: `Monto Pagado: $${Number(pago.Monto).toFixed(2)} USD` },
        { text: `Método de Pago: ${pago.MetodoPago}` },
        { text: `Número de Comprobante: #${pago.NroPago}` },
        '\n',
        { text: '🧾 Detalles:' },
        { text: `Membresía: ${tipo?.NombreTipo ?? 'Sin membresía'}` },
        { text: `Plataforma: ${membresia?.PlataformaWeb ?? 'N/A'}` },
        {
          text: `Vigencia: ${membresia ? new Date(membresia.FechaInicio).toLocaleDateString() : 'N/A'} a ${membresia ? new Date(membresia.FechaFin).toLocaleDateString() : 'N/A'}`,
        },
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

    return new Promise((resolve, reject) => {
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

    await this.mailerService.sendMail({
      to: usuario.correo,
      subject: 'Tu comprobante de pago - GoFit GYM',
      text: 'Gracias por tu compra. Adjuntamos el comprobante de tu pago.',
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
}
