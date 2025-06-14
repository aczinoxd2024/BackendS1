import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { RawBodyRequest } from './stripe/raw-body-request.interface';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // ✅ Middleware unificado para Stripe Webhook y el resto del backend
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/stripe/webhook') {
      express.raw({ type: 'application/json' })(req, res, () => {
        (req as RawBodyRequest).rawBody = req.body as Buffer;
        next();
      });
    } else {
      express.json()(req, res, next);
    }
  });

  // ✅ Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ CORS para frontend
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://web-production-d581.up.railway.app', // 👈 AGREGAR ESTE
      'http://web-production-d581.up.railway.app', // 👈 OPCIONAL
      'https://backends1-production.up.railway.app',
      'http://backends1-production.up.railway.app',
      'https://proyectosis120252.netlify.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  console.log(`🚀 Backend en ejecución → http://localhost:${port}/api`);
}
bootstrap();
