import { Module } from '@nestjs/common';
import { PromocionesService } from './promociones.service';
import { PromocionesController } from './promociones.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    MailerModule, // Para enviar correos
    TypeOrmModule.forFeature([]), // Por si luego deseas usar repositorios
  ],
  controllers: [PromocionesController],
  providers: [PromocionesService],
})
export class PromocionesModule {}
