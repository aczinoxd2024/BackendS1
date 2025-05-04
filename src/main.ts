import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para producción y desarrollo
  app.enableCors({
    origin: [
      'http://localhost:4200', // Frontend local
      'https://backends1-production.up.railway.app', // Backend Railway (HTTPS)
      'http://backends1-production.up.railway.app', // Backend Railway (HTTP) por si acaso
      'https://tudominio.com', // (opcional para futuro dominio real del frontend)
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Prefijo global para API (mejora estructura)
  app.setGlobalPrefix('api');

  // Validación global para proteger datos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Solo permite propiedades definidas en DTOs
      forbidNonWhitelisted: true, // Rechaza propiedades no definidas
      transform: true, // Transforma payloads automáticamente
    }),
  );

  // Escuchar en puerto dinámico (Railway / Localhost)
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend en ejecución en el puerto ${port}`);
}
bootstrap();
