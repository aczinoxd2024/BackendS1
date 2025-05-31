import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Pago } from 'pagos/pagos.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { DetallePago } from 'pagos/detalle-pago/detalle-pago.entity';
import { Membresia } from 'membresias/menbresia.entity';
import { TipoMembresia } from 'membresias/Tipos/menbresia.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';

import { PagosService } from 'pagos/pagos.service';

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
    private readonly pagosService: PagosService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  async createCheckoutSession(data: {
    amount: number;
    description: string;
    email: string;
    idClase?: number; // Para Gold o Disciplina
  }): Promise<{ url: string }> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: data.email,
      metadata: {
        email: data.email,
        descripcion: data.description,
        idClase: data.idClase?.toString() || '',
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
      success_url: `${this.configService.getOrThrow<string>('FRONTEND_URL')}/pagos/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.getOrThrow<string>('FRONTEND_URL')}/pagos/cancel`,
    });

    if (!session.url) {
      throw new Error('La URL de la sesión de Stripe es nula');
    }

    return { url: session.url };
  }
  //////////////////////////////////////////////////////////////
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
    const idClase = session.metadata?.idClase
      ? parseInt(session.metadata.idClase)
      : null;
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

    const esDisciplina = tipo.ID === 3;

    // Crear membresía para disciplina también
    if (esDisciplina) {
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setDate(fechaInicio.getDate() + tipo.DuracionDias);

      const nuevaDisciplina = this.membresiaRepository.create({
        FechaInicio: fechaInicio,
        FechaFin: fechaFin,
        PlataformaWeb: 'Web',
        TipoMembresiaID: tipo.ID,
        CICliente: cliente.CI,
      });

      await this.membresiaRepository.save(nuevaDisciplina);

      //mensaje para asegurarme de que hay un idClase
      console.log('Clase asignada:', idClase);
      const detalleDisciplina = this.detallePagoRepository.create({
        IDPago: pagoGuardado.NroPago,
        IDMembresia: nuevaDisciplina.IDMembresia,
        IDClase: idClase,
        MontoTotal: amount / 100,
        IDPromo: null,
      });

      //para probar si se esta guardando disciplina en pagos:
      //await this.detallePagoRepository.save(detalleDisciplina);
      const guardado = await this.detallePagoRepository.save(detalleDisciplina);
      console.log('🧾 Detalle de disciplina guardado:', guardado);

      await this.bitacoraRepository.save({
        idUsuario: usuario.id,
        accion: `Cliente adquirió disciplina "${descripcion}" del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()}`,
        tablaAfectada: 'membresia / detalle_pago',
        ipMaquina: 'web-stripe',
        IDPago: pagoGuardado.NroPago,
      });

      await this.pagosService.enviarComprobantePorCorreo(pagoGuardado.NroPago);
      console.log('📧 Comprobante enviado para disciplina.');
      return;
    }

    const ultimaMembresia = await this.membresiaRepository.findOne({
      where: { CICliente: cliente.CI },
      order: { FechaFin: 'DESC' },
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let fechaInicio: Date;
    let fechaFin: Date;
    const mismaMembresia = ultimaMembresia?.TipoMembresiaID === tipo.ID;

    if (
      ultimaMembresia &&
      mismaMembresia &&
      new Date(ultimaMembresia.FechaFin) >= hoy
    ) {
      fechaInicio = new Date(ultimaMembresia.FechaInicio);
      fechaFin = new Date(ultimaMembresia.FechaFin);
      fechaFin.setDate(fechaFin.getDate() + tipo.DuracionDias);
    } else {
      fechaInicio = new Date();
      fechaFin = new Date();
      fechaFin.setDate(fechaInicio.getDate() + tipo.DuracionDias);
    }

    const nuevaMembresia = this.membresiaRepository.create({
      FechaInicio: fechaInicio,
      FechaFin: fechaFin,
      PlataformaWeb: 'Web',
      TipoMembresiaID: tipo.ID,
      CICliente: cliente.CI,
    });

    await this.membresiaRepository.save(nuevaMembresia);

    const detalle = this.detallePagoRepository.create({
      IDPago: pagoGuardado.NroPago,
      IDMembresia: nuevaMembresia.IDMembresia,
      IDClase: tipo.ID === 2 ? idClase : null, // Solo Gold incluye clase
      //IDClase: tipo.ID === 2 || tipo.ID === 3 ? idClase : null,
      MontoTotal: amount / 100,
      IDPromo: null,
    });

    await this.detallePagoRepository.save(detalle);
    console.log('🧾 Detalle guardado para pago', pagoGuardado.NroPago);

    cliente.IDEstado = 1;
    await this.clienteRepository.save(cliente);

    const mensajeAccion = ultimaMembresia
      ? mismaMembresia
        ? `Renovó su membresía "${tipo.NombreTipo}". Nueva vigencia: del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()}`
        : `Cambiaron su membresía a "${tipo.NombreTipo}". Nueva vigencia: del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()}`
      : `Adquirió su primera membresía del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()} por tipo "${tipo.NombreTipo}"`;

    await this.bitacoraRepository.save({
      idUsuario: usuario.id,
      accion: `Cliente CI ${usuario.id} realizó un pago de $${(amount / 100).toFixed(2)}. ${mensajeAccion}`,
      tablaAfectada: 'membresia / pago / detalle_pago',
      ipMaquina: 'web-stripe',
      IDPago: pagoGuardado.NroPago,
    });

    await this.pagosService.enviarComprobantePorCorreo(pagoGuardado.NroPago);
    console.log('📧 Comprobante generado y enviado por pagosService.');
  }

  async obtenerPagosPorCliente(ci: string): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { CIPersona: ci },
      order: { Fecha: 'DESC' },
    });
  }

  //SE ANADIO ESTA FUNCION PARA OBTENER INFO DEL PAGO PARA LUEGO GENERAR EL COMPROBANTE DESDE FRONT
  async obtenerInfoPagoDesdeSession(
    sessionId: string,
  ): Promise<{ nroPago: number; correo: string }> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    const paymentIntentId = session.payment_intent as string;

    const pago = await this.pagoRepository.findOne({
      where: { StripePaymentIntentId: paymentIntentId },
    });

    if (!pago) {
      throw new Error('No se encontró el pago asociado a este session_id');
    }

    // ✅ Buscar correo real
    const usuario = await this.usuarioRepository.findOne({
      where: { idPersona: { CI: pago.CIPersona } },
    });

    return {
      nroPago: pago.NroPago,
      correo: usuario?.correo ?? 'correo no encontrado',
    };
  }
}
