import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // ✅ Webhook Stripe: capturamos rawBody correctamente
  app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

  // Middleware para guardar rawBody en request (para Stripe)
  app.use(
    '/api/stripe/webhook',
    (req: Request, res: Response, next: NextFunction) => {
      (req as any).rawBody = req.body; // 👈 aquí es Buffer, está bien
      next();
    },
  );

  // ✅ JSON parser para todo lo demás
  app.use(bodyParser.json());

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
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

  const port: number = parseInt(process.env.PORT as string, 10) || 3000;
  await app.listen(port);
  console.log(`🚀 Backend en ejecución → http://localhost:${port}/api`);
}
bootstrap();
