import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Habilitar CORS (Permitir tanto producción como desarrollo)
  app.enableCors({
    origin: [
      'http://localhost:4200', // Angular local
      'http://backends1-production.up.railway.app', // BACKEND Railway
      'https://backends1-production.up.railway.app', // Railway con HTTPS
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ✅ Prefijo global para organización de rutas
  app.setGlobalPrefix('api');

  // ✅ Validación global (opcional pero recomendado)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ Puerto dinámico para Railway o 3000 local
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
