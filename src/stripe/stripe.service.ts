import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Pago } from 'src/pagos/pagos.entity';
import { Usuario } from 'src/usuarios/usuario.entity';
import { Cliente } from 'src/clientes/cliente.entity';
import { DetallePago } from 'src/pagos/detalle-pago/detalle-pago.entity';
import { Membresia } from 'src/membresias/menbresia.entity';
import { TipoMembresia } from 'src/membresias/Tipos/menbresia.entity';
import { Bitacora } from 'src/bitacora/bitacora.entity';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Bitacora)
    private readonly bitacoraRepository: Repository<Bitacora>,
    @InjectRepository(Pago) private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(DetallePago)
    private readonly detallePagoRepository: Repository<DetallePago>,
    @InjectRepository(Membresia)
    private readonly membresiaRepository: Repository<Membresia>,
    @InjectRepository(TipoMembresia)
    private readonly tipoMembresiaRepository: Repository<TipoMembresia>,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  async createCheckoutSession(data: {
    amount: number;
    description: string;
    email: string;
  }): Promise<{ url: string }> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: data.email,
      metadata: {
        email: data.email,
        descripcion: data.description,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: data.description,
            },
            unit_amount: data.amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${this.configService.getOrThrow<string>('FRONTEND_URL')}/pagos/success`,
      cancel_url: `${this.configService.getOrThrow<string>('FRONTEND_URL')}/pagos/cancel`,
    });

    if (!session.url) {
      throw new Error('La URL de la sesión de Stripe es nula');
    }

    return { url: session.url };
  }

  constructEvent(payload: Buffer, sig: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, sig, secret);
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    console.log('📩 Evento recibido desde Stripe:', event.type);

    if (event.type !== 'checkout.session.completed') {
      console.log(`⚠️ Evento no manejado: ${event.type}`);
      return;
    }

    const session = event.data.object;
    const email = session.metadata?.email ?? null;
    const descripcion = session.metadata?.descripcion ?? null;
    const amount = session.amount_total ?? 0;
    const paymentIntent = session.payment_intent as string;

    if (!email || !descripcion || !amount) {
      console.log('❌ Faltan datos necesarios del evento. Abortando guardado.');
      return;
    }

    const pagoExistente = await this.pagoRepository.findOne({
      where: { StripeEventId: event.id },
    });

    if (pagoExistente) {
      console.log('⚠️ Este evento ya fue procesado. Abortando.');
      return;
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { correo: email },
      relations: ['idPersona'],
    });

    if (!usuario || !usuario.idPersona?.CI) {
      console.log('❌ Usuario o CI no encontrado.');
      return;
    }

    const cliente = await this.clienteRepository.findOne({
      where: { CI: usuario.idPersona.CI },
    });

    if (!cliente) {
      console.log('❌ Cliente no encontrado con ese CI.');
      return;
    }

    const fechaHoraBolivia = new Date();
    fechaHoraBolivia.setHours(fechaHoraBolivia.getHours() - 4);

    const nuevoPago = this.pagoRepository.create({
      Fecha: fechaHoraBolivia,
      Monto: amount / 100,
      MetodoPago: 2,
      CIPersona: usuario.idPersona.CI,
      StripeEventId: event.id,
      StripePaymentIntentId: paymentIntent,
    });

    const pagoGuardado = await this.pagoRepository.save(nuevoPago);

    const tipo = await this.tipoMembresiaRepository.findOne({
      where: { NombreTipo: descripcion },
    });

    if (!tipo) {
      console.log(`❌ Tipo de membresía "${descripcion}" no encontrada.`);
      return;
    }

    // 🔍 Buscar la última membresía del cliente
    const ultimaMembresia = await this.membresiaRepository.findOne({
      where: { CICliente: cliente.CI },
      order: { FechaFin: 'DESC' },
    });
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Limpiar hora para evitar errores de comparación

    let fechaInicio: Date;
    if (ultimaMembresia && new Date(ultimaMembresia.FechaFin) >= hoy) {
      fechaInicio = new Date(ultimaMembresia.FechaFin);
      fechaInicio.setDate(fechaInicio.getDate() + 1); // día siguiente a FechaFin
    } else {
      fechaInicio = new Date(); // hoy
    }

    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaInicio.getDate() + tipo.DuracionDias);

    // ✅ Crear nueva membresía vinculada al cliente
    const nuevaMembresia = this.membresiaRepository.create({
      FechaInicio: fechaInicio,
      FechaFin: fechaFin,
      PlataformaWeb: 'Web',
      TipoMembresiaID: tipo.ID,
      CICliente: cliente.CI,
    });

    await this.membresiaRepository.save(nuevaMembresia);

    // 🧾 Crear y guardar el detalle del pago vinculado a la nueva membresía
    const detalle = this.detallePagoRepository.create({
      IDPago: pagoGuardado.NroPago,
      IDMembresia: nuevaMembresia.IDMembresia,
      MontoTotal: amount / 100,
      IDPromo: null,
    });
    await this.detallePagoRepository.save(detalle);

    // ✅ Activar cliente si no lo estaba
    cliente.IDEstado = 1;
    await this.clienteRepository.save(cliente);

    // 📝 Registrar renovación o adquisición en bitácora
    const mensajeAccion = ultimaMembresia
      ? `Renovó su membresía. Nueva vigencia: del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()} por tipo "${tipo.NombreTipo}"`
      : `Adquirió su primera membresía del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()} por tipo "${tipo.NombreTipo}"`;

    await this.bitacoraRepository.save({
      idUsuario: usuario.id,
      accion: `Cliente CI ${usuario.id} realizó un pago con Stripe de $${(amount / 100).toFixed(2)}. ${mensajeAccion}.`,
      tablaAfectada: 'membresia / pago / detalle_pago',
      ipMaquina: 'web-stripe',
    });

    cliente.IDEstado = 1;
    await this.clienteRepository.save(cliente);

    // 📝 Registrar en Bitácora
    await this.bitacoraRepository.save({
      idUsuario: usuario.id,
      accion: `Cliente CI ${usuario.id} realizó un pago con Stripe de $${(amount / 100).toFixed(2)} por la membresía "${descripcion}".`,
      tablaAfectada: 'pago / detalle_pago',
      ipMaquina: 'web-stripe',
    });
    console.log('📝 Registro en bitácora guardado.');
  }

  async obtenerPagosPorCliente(ci: string): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { CIPersona: ci },
      order: { Fecha: 'DESC' },
    });
  }
}
