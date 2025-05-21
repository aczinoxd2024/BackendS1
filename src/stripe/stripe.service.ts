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

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
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

    if (!email || !descripcion || !amount) {
      console.log('❌ Faltan datos necesarios del evento. Abortando guardado.');
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

    const nuevoPago = this.pagoRepository.create({
      Fecha: new Date(),
      Monto: amount / 100,
      MetodoPago: 2,
      CIPersona: usuario.idPersona.CI,
    });

    const pagoGuardado = await this.pagoRepository.save(nuevoPago);
    console.log('💾 Pago guardado:', pagoGuardado);

    const tipo = await this.tipoMembresiaRepository.findOne({
      where: { NombreTipo: descripcion },
    });

    if (!tipo) {
      console.log(`❌ Tipo de membresía "${descripcion}" no encontrada.`);
      return;
    }

    const membresia = await this.membresiaRepository.findOne({
      where: { TipoMembresiaID: tipo.ID },
    });

    if (!membresia) {
      console.log(
        `❌ Membresía no encontrada con TipoMembresiaID = ${tipo.ID}`,
      );
      return;
    }

    const detalle = this.detallePagoRepository.create({
      IDPago: pagoGuardado.NroPago,
      IDMembresia: membresia.IDMembresia,
      MontoTotal: amount / 100,
      IDPromo: null,
    });

    await this.detallePagoRepository.save(detalle);
    console.log('📄 Detalle de pago guardado.');

    cliente.IDEstado = 1;
    await this.clienteRepository.save(cliente);
    console.log('🟢 Estado del cliente actualizado a ACTIVO.');
  }

  async obtenerPagosPorCliente(ci: string): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { CIPersona: ci },
      order: { Fecha: 'DESC' },
    });
  }
}
