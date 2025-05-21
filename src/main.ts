import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { RawBodyRequest } from './stripe/raw-body-request.interface';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Middleware para Stripe Webhook con tipado correcto
  app.use(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    (req: Request, _res: Response, next: NextFunction) => {
      (req as RawBodyRequest).rawBody = req.body as Buffer;
      next();
    },
  );

  // Middleware condicional: evitar express.json() en rutas de Webhook
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.includes('/stripe/webhook')) {
      return next();
    }
    return express.json()(req, res, next);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://backends1-production.up.railway.app',
      'https://proyectosis12025.netlify.app',
    ],
    credentials: true,
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  console.log(`🚀 Backend en ejecución → http://localhost:${port}/api`);
}
bootstrap();
