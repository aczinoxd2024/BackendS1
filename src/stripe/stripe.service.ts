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
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
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
  //agregue "!" para forzar a que sea no nulo ya que daba problemas.

  async createCheckoutSession(data: {
    amount: number;
    description: string;
    email: string;
  }): Promise<{ url: string }> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: data.email, // sigue siendo útil si el cliente ya existe en Stripe
      metadata: {
        email: data.email, // 👈 garantizamos que llegue siempre
        descripcion: data.description, // 👈 útil para buscar membresía luego
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: data.description,
            },
            unit_amount: data.amount * 100, // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get<string>('FRONTEND_URL')}/pagos/success`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/pagos/cancel`,
    });

    if (!session.url) {
      throw new Error('Stripe session URL esta nulo');
    }

    return { url: session.url };
  }

  // Método para construir el evento de webhook
  constructEvent(payload: Buffer, sig: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, sig, secret);
  }

  // Método para manejar eventos de Stripe
  async handleEvent(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const email = session.metadata?.email;
      const amount = session.amount_total;
      const date = new Date();

      // Aquí podes buscar el CI de la persona si ya tienes el email mapeado
      // En este ejemplo, solo imprimo el pago
      //console.log(`💰 Pago recibido: ${email} - ${amount / 100} USD`);
      //console.log(`💰 Pago recibido: ${email} - ${(amount ?? 0) / 100} USD`);
      console.log('🎉 Webhook recibido: pago completado');
      console.log(`📧 Email del cliente: ${email}`);
      console.log(`💰 Monto pagado: ${amount ? amount / 100 : 0} USD`);
      console.log(`📅 Fecha del pago: ${date}`);

      if (!email || !amount) {
        console.log('❌ Email o monto inválido. No se guarda el pago.');
        return;
      }

      // Buscar usuario por correo e incluir relación con Persona
      const usuario = await this.usuarioRepository.findOne({
        where: { correo: email },
        relations: ['idPersona'], // ⚠️ Muy importante para que venga el CI
      });

      if (!usuario || !usuario.idPersona || !usuario.idPersona.CI) {
        console.log('⚠️ No se encontró el CI asociado al correo del usuario.');
        return;
      }
      // Buscar el cliente por CI
      const cliente = await this.clienteRepository.findOne({
        where: { CI: usuario.idPersona.CI },
      });

      //redundante pero puede servir para verificaciones
      if (!cliente) {
        console.log('⚠️ Cliente no encontrado con el CI vinculado al usuario.');
        return;
      }

      // Guardar pago
      const nuevoPago = this.pagoRepository.create({
        Fecha: date,
        Monto: amount / 100,
        MetodoPago: 2,
        CIPersona: usuario.idPersona.CI,
      });

      await this.pagoRepository.save(nuevoPago);
      console.log('✅ Pago guardado exitosamente en la base de datos.');

      // para buscar tipo de membresia
      const descripcion = session.metadata?.descripcion;

      // 1. Buscar el tipo de membresía por nombre
      const tipo = await this.tipoMembresiaRepository.findOne({
        where: { NombreTipo: descripcion },
      });

      if (!tipo) {
        console.log(
          `❌ No se encontró tipo de membresía con NombreTipo = "${descripcion}"`,
        );
        return;
      }

      // 2. Buscar la membresía con ese tipo (usando FK TipoMembresiaID)
      const membresia = await this.membresiaRepository.findOne({
        where: { TipoMembresiaID: tipo.ID },
      });

      if (!membresia) {
        console.log(
          `❌ No se encontró membresía con TipoMembresiaID = ${tipo.ID}`,
        );
        return;
      }
      // Crear detalle del pago
      const nuevoDetalle = this.detallePagoRepository.create({
        IDPago: nuevoPago.NroPago,
        IDMembresia: membresia.IDMembresia,
        MontoTotal: amount / 100,
        IDPromo: null, // para manejar promociones después
      });

      await this.detallePagoRepository.save(nuevoDetalle);
      console.log('🧾 Detalle del pago guardado correctamente.');

      // ✅ Actualizar estado del cliente a ACTIVO (1)
      cliente.IDEstado = 1;
      await this.clienteRepository.save(cliente);
      console.log('🟢 Estado del cliente actualizado a ACTIVO');
    } else {
      console.log(`⚠️ Webhook recibido, tipo no manejado: ${event.type}`);
    }
  }
  async obtenerPagosPorCliente(ci: string) {
    return this.pagoRepository.find({
      where: { CIPersona: ci },
      order: { Fecha: 'DESC' },
    });
  }
}
