import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Body } from '@nestjs/common';
import * as express from 'express';
import { RawBodyRequest } from './stripe/raw-body-request.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // ✅ Middleware de Stripe Webhook: express.raw + rawBody manual
  app.use(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    (req, _res, next) => {
      (req as RawBodyRequest).rawBody = req.Body as Buffer;
      next();
    },
  );

  // ✅ Resto del backend usa JSON normal
  app.use(express.json());

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
      'http://backends1-production.up.railway.app',
      'https://proyectosis12025.netlify.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  console.log(`🚀 Backend en ejecución → http://localhost:${port}/api`);
}
bootstrap();
