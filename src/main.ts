import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // ✅ STRIPE WEBHOOK — usar express.raw Y asignar manualmente rawBody
  app.use(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
      req.rawBody = req.body; // ⚠️ necesario para firma de Stripe
      next();
    },
  );

  // ✅ Todas las demás rutas usan JSON normal
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

  const port: number = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  console.log(`🚀 Backend en ejecución → http://localhost:${port}/api`);
}
bootstrap();
