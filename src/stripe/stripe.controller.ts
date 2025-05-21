import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Roles } from 'src/auth/roles/roles.decorator';

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
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    const rawBody = (req as any).rawBody || req.body; // ⚠️ se asegura de usar rawBody asignado en main.ts

    console.log('🧾 Tipo de rawBody:', typeof rawBody);
    console.log('🧾 rawBody presente?', !!rawBody);
    console.log('🧾 Header [stripe-signature]:', sig);

    let event;

    try {
      event = this.stripeService.constructEvent(
        rawBody,
        sig as string,
        webhookSecret!,
      );
      console.log('✅ Evento verificado:', event.type);
    } catch (err: any) {
      console.error('❌ Verificación fallida:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await this.stripeService.handleEvent(event);
    return res.status(200).json({ received: true });
  }

  @Get('mis-pagos')
  @Roles('cliente')
  getPagosPorCliente(@Req() req: Request) {
    const ci = (req.user as any)?.ci;
    console.log('📥 Solicitando pagos para CI:', ci);
    return this.stripeService.obtenerPagosPorCliente(ci);
  }
}
