import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { rawBodyMiddleware } from './common/middleware/raw-body.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ Webhook de Stripe — requiere rawBody y middleware personalizado
  app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
  app.use(rawBodyMiddleware); // ✅ asigna rawBody para verificación
  app.use(bodyParser.json()); // ✅ para todas las demás rutas normales

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
