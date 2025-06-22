import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesService } from './notificaciones.service';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { NotificacionesController } from './notificaciones.controller';
import { Membresia } from 'membresias/membresia.entity';
import { TipoMembresia } from 'membresias/Tipos/tipo_membresia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Membresia,
      Cliente,
      Persona,
      Usuario,
      TipoMembresia,
    ]),
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
