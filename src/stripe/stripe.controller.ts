import { Body, Controller, Get, Post } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import { Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RawBodyRequest } from '@nestjs/common/interfaces';
import { Roles } from 'src/auth/roles/roles.decorator';

///////////////////////////////////////////////
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
    return this.stripeService.createCheckoutSession(body);
  }

  @Post('webhook')
  async handleStripeWebhook(
    @Req() request: any, // <-- usamos any para que funcione sí o sí
    @Res() response: Response,
  ) {
    const sig = request.headers['stripe-signature'];
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    console.log(' Tipo de rawBody:', typeof request.RawBodyRequest);
    console.log(' rawBody existe?', !!request.rawBody);
    let event;

    try {
      event = this.stripeService.constructEvent(
        request.rawBody,
        sig as string,
        webhookSecret!,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    await this.stripeService.handleEvent(event);
    return response.status(200).json({ received: true });
  }
  @Get('mis-pagos')
  @Roles('cliente')
  getPagosPorCliente(@Req() req: Request) {
    const ci = (req.user as any)?.ci;
    return this.stripeService.obtenerPagosPorCliente(ci);
  }
}
