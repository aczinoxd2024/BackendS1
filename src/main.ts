import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Validación global: protege y transforma los datos recibidos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Solo permite propiedades definidas en DTOs
      forbidNonWhitelisted: true, // Rechaza propiedades no definidas
      transform: true, // Transforma datos automáticamente al tipo esperado
    }),
  );

  // Habilitar CORS para permitir acceso desde frontend en local, producción y futuros dominios
  app.enableCors({
    origin: [
      'http://localhost:4200', // Frontend local
      'https://backends1-production.up.railway.app', // Backend en producción (HTTPS)
      'http://backends1-production.up.railway.app', // Backend en producción (HTTP)
      'https://tudominio.com', // Futuro dominio real (opcional)
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Asignar puerto dinámico para producción o 3000 por defecto en local
  const port: number = parseInt(process.env.PORT as string, 10) || 3000;
  await app.listen(port);

  console.log(`🚀 Backend en ejecución → http://localhost:${port}/api`);
}
bootstrap();
