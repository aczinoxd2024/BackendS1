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
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Pago) private pagoRepository: Repository<Pago>,
    @InjectRepository(Usuario) private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Cliente) private clienteRepository: Repository<Cliente>,
    @InjectRepository(DetallePago)
    private detallePagoRepository: Repository<DetallePago>,
    @InjectRepository(Membresia)
    private membresiaRepository: Repository<Membresia>,
    @InjectRepository(TipoMembresia)
    private tipoMembresiaRepository: Repository<TipoMembresia>,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
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
      success_url: `${this.configService.get<string>('FRONTEND_URL')}/pagos/success`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/pagos/cancel`,
    });

    if (!session.url) {
      throw new Error('Stripe session URL está nulo');
    }

    return { url: session.url };
  }

  constructEvent(payload: Buffer, sig: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, sig, secret);
  }

  async handleEvent(event: Stripe.Event) {
    console.log('📩 Evento recibido desde Stripe:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      console.log('📦 Session completa:', JSON.stringify(session, null, 2));

      const email = session.metadata?.email;
      const amount = session.amount_total;
      const descripcion = session.metadata?.descripcion;
      const date = new Date();

      console.log('📧 Email:', email);
      console.log('💰 Monto (centavos):', amount);
      console.log('📝 Descripción:', descripcion);

      if (!email || !amount || !descripcion) {
        console.log('❌ Datos incompletos. Abortando guardado.');
        return;
      }

      const usuario = await this.usuarioRepository.findOne({
        where: { correo: email },
        relations: ['idPersona'],
      });

      console.log('🧑 Usuario encontrado:', usuario);

      if (!usuario || !usuario.idPersona?.CI) {
        console.log('❌ No se encontró usuario o CI.');
        return;
      }

      const cliente = await this.clienteRepository.findOne({
        where: { CI: usuario.idPersona.CI },
      });

      console.log('🧾 Cliente encontrado:', cliente);

      if (!cliente) {
        console.log('❌ Cliente no encontrado con ese CI.');
        return;
      }

      const nuevoPago = this.pagoRepository.create({
        Fecha: date,
        Monto: amount / 100,
        MetodoPago: 2,
        CIPersona: usuario.idPersona.CI,
      });

      const pagoGuardado = await this.pagoRepository.save(nuevoPago);
      console.log('💾 Pago guardado:', pagoGuardado);

      const tipo = await this.tipoMembresiaRepository.findOne({
        where: { NombreTipo: descripcion },
      });

      console.log('🔎 Tipo de membresía encontrado:', tipo);

      if (!tipo) {
        console.log(`❌ Tipo de membresía no encontrada: "${descripcion}"`);
        return;
      }

      const membresia = await this.membresiaRepository.findOne({
        where: { TipoMembresiaID: tipo.ID },
      });

      console.log('🏷 Membresía encontrada:', membresia);

      if (!membresia) {
        console.log(
          `❌ No se encontró membresía con TipoMembresiaID = ${tipo.ID}`,
        );
        return;
      }

      const nuevoDetalle = this.detallePagoRepository.create({
        IDPago: pagoGuardado.NroPago,
        IDMembresia: membresia.IDMembresia,
        MontoTotal: amount / 100,
        IDPromo: null,
      });

      const detalleGuardado =
        await this.detallePagoRepository.save(nuevoDetalle);
      console.log('📄 Detalle de pago guardado:', detalleGuardado);

      cliente.IDEstado = 1;
      const clienteActualizado = await this.clienteRepository.save(cliente);
      console.log('🟢 Estado del cliente actualizado:', clienteActualizado);
    } else {
      console.log(`⚠️ Tipo de evento no manejado: ${event.type}`);
    }
  }

  async obtenerPagosPorCliente(ci: string) {
    return this.pagoRepository.find({
      where: { CIPersona: ci },
      order: { Fecha: 'DESC' },
    });
  }
}
