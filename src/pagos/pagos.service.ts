import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './pagos.entity';
import { Membresia } from '../membresias/menbresia.entity';
import { Cliente } from '../clientes/cliente.entity';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { RegistroPagoDto } from './registro-pago/registro-pago.dto';

import { TipoMembresia } from 'src/membresias/Tipos/menbresia.entity';
import { Persona } from 'src/personas/persona.entity';
import { Usuario } from 'src/usuarios/usuario.entity';

import { MailerService } from '@nestjs-modules/mailer';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = pdfFonts as any;

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

    private readonly mailerService: MailerService,
  ) {}

  async registrarPago(data: RegistroPagoDto) {
    const { ciCliente, idMembresia, monto, metodoPagoId } = data;

    // 1️⃣ Validar Cliente
    const cliente = await this.clienteRepository.findOneBy({ CI: ciCliente });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // 2️⃣ Validar Membresía
    const membresia = await this.membresiaRepository.findOneBy({
      IDMembresia: idMembresia,
    });
    if (!membresia) {
      throw new NotFoundException('Membresía no encontrada');
    }

    // 3️⃣ Crear Pago
    const pago = this.pagosRepository.create({
      Fecha: new Date(),
      Monto: monto,
      MetodoPago: metodoPagoId,
      CIPersona: ciCliente,
    });

    const pagoGuardado = await this.pagosRepository.save(pago);

    // 4️⃣ Crear Detalle Pago
    const detallePago = this.detallePagoRepository.create({
      IDPago: pagoGuardado.NroPago,
      IDMembresia: idMembresia,
      MontoTotal: monto,
      IDPromo: null, // No se está usando promociones en este flujo
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

  // Puedes agregar otros métodos como findAll, findByCliente, etc. si lo deseas en el futuro.

  //logica para generar comprobantes pdf
  async generarComprobantePDF(nroPago: number): Promise<Buffer> {
    const pago = await this.pagosRepository.findOne({
      where: { NroPago: nroPago },
    });
    const detalle = await this.detallePagoRepository.findOne({
      where: { IDPago: nroPago },
    });

    const cliente = await this.clienteRepository.findOne({
      where: { CI: pago?.CIPersona },
    });

    const persona = await this.personaRepository.findOne({
      where: { CI: pago?.CIPersona },
    });

    const membresia = await this.membresiaRepository.findOne({
      where: { IDMembresia: detalle?.IDMembresia },
    });

    const tipo = await this.tipoMembresiaRepository.findOne({
      where: { ID: membresia?.TipoMembresiaID },
    });

    if (!pago || !detalle || !cliente || !persona || !membresia || !tipo) {
      throw new Error(
        '❌ No se pudieron obtener todos los datos necesarios del comprobante',
      );
    }

    const docDefinition = {
      content: [
        { text: '🏋️‍ Comprobante de Pago - GoFit GYM', style: 'header' },
        '\n',
        { text: `Cliente: ${persona.Nombre} ${persona.Apellido}` },
        { text: `CI: ${persona.CI}` },
        {
          text: `Fecha del Pago: ${new Date(pago.Fecha).toLocaleDateString()}`,
        },
        { text: `Monto Pagado: $${pago.Monto.toFixed(2)} USD` },
        { text: `Membresía: ${tipo.NombreTipo}` },
        { text: `Plataforma: ${membresia.PlataformaWeb}` },
        { text: `Método de Pago: Tarjeta (Stripe)` },
        { text: `Número de Comprobante: #${pago.NroPago}` },
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

  //logica para enviar comprobantes por correo

  async enviarComprobantePorCorreo(nroPago: number): Promise<void> {
    // Obtener comprobante PDF
    const pdfBuffer = await this.generarComprobantePDF(nroPago);

    // Obtener pago y cliente
    const pago = await this.pagosRepository.findOne({
      where: { NroPago: nroPago },
    });
    const persona = await this.personaRepository.findOne({
      where: { CI: pago?.CIPersona },
    });
    const usuario = await this.usuarioRepository.findOne({
      where: { idPersona: { CI: persona?.CI } },
    });

    if (!usuario || !usuario.correo) {
      throw new Error(
        '❌ No se encontró correo del usuario para enviar el comprobante.',
      );
    }

    // Enviar correo con comprobante adjunto
    await this.mailerService.sendMail({
      to: usuario.correo,
      subject: 'Comprobante de pago - GoFit GYM',
      text: 'Adjunto se encuentra el comprobante de tu pago.',
      attachments: [
        {
          filename: `comprobante_pago_${nroPago}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`📩 Comprobante enviado al correo: ${usuario.correo}`);
  }
}
