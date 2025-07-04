import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { Response } from 'express';
import { Request as ExpressRequest } from 'express';
import Stripe from 'stripe';

// ✅ Interface extendida
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
    @Body()
    body: {
      amount: number;
      description: string;
      email: string;
      idClase?: number;
    },
  ) {
    console.log('📦 Datos recibidos en /stripe/checkout:', body);
    return this.stripeService.createCheckoutSession(body);
  }
@Post('checkout-renovacion')
async checkoutRenovacion(@Body() data: {
  ci: string;
  tipoMembresiaId: number;
  correo: string;
}) {
  return this.stripeService.checkoutRenovacion(data);
}


  @Post('webhook')
  async handleStripeWebhook(@Req() req: RawBodyRequest, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    const rawBody = req.rawBody;

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEvent(
        rawBody,
        sig as string,
        secret!,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    try {
      await this.stripeService.handleEvent(event);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('Error al manejar el evento:', err);
      return res
        .status(500)
        .json({ error: 'Error interno al procesar el evento' });
    }
  }

  @Get('mis-pagos')
  @Roles('cliente')
  getPagosPorCliente(@Req() req: RawBodyRequest) {
    const ci = req.user?.ci;
    if (!ci) throw new Error('CI no encontrado');
    return this.stripeService.obtenerPagosPorCliente(ci);
  }

  //SE ANADIO ESTA FUNCION PARA OBTENER INFO DEL PAGO PARA LUEGO GENERAR EL COMPROBANTE DESDE FRONT
  @Get('success-info')
  async getSuccessInfo(@Query('session_id') sessionId: string) {
    if (!sessionId) {
      throw new Error('Falta session_id');
    }
    return this.stripeService.obtenerInfoPagoDesdeSession(sessionId);
  }
}
