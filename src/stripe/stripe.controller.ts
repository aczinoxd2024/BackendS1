import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Response } from 'express';
import { Request as ExpressRequest } from 'express';
import Stripe from 'stripe';

// ✅ Interface extendida para req con rawBody y user (usado por Stripe y Auth)
interface RawBodyRequest extends ExpressRequest {
  rawBody: Buffer;
  user?: { ci: string };
}

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  @Post('checkout')
  async checkout(
    @Body() body: { amount: number; description: string; email: string },
  ) {
    console.log('📦 Checkout iniciado:', body);
    return this.stripeService.createCheckoutSession(body);
  }

  @Post('webhook')
  async handleStripeWebhook(@Req() req: RawBodyRequest, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    const rawBody = req.rawBody;

    console.log('📥 Webhook recibido en /stripe/webhook');
    console.log('📦 typeof rawBody:', typeof rawBody);
    console.log('📦 Buffer.isBuffer:', Buffer.isBuffer(rawBody));
    console.log('📦 Header [stripe-signature]:', sig);

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEvent(
        rawBody,
        sig as string,
        webhookSecret!,
      );
      console.log('✅ Firma válida. Tipo de evento:', event.type);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Verificación de firma fallida:', errorMessage);
      return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }

    try {
      await this.stripeService.handleEvent(event);
      console.log('✅ Evento procesado correctamente.');
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ Error al procesar el evento:', err);
      return res
        .status(500)
        .json({ error: 'Error interno al procesar el webhook' });
    }
  }

  @Get('mis-pagos')
  @Roles('cliente')
  getPagosPorCliente(@Req() req: RawBodyRequest) {
    const ci = req.user?.ci;

    if (!ci) {
      console.error('❌ No se pudo obtener el CI del usuario autenticado.');
      throw new Error('CI de usuario no disponible.');
    }

    console.log('📥 Solicitando pagos para CI:', ci);
    return this.stripeService.obtenerPagosPorCliente(ci);
  }
}
