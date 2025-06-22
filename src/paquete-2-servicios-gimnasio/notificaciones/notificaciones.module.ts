import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesService } from './notificaciones.service';
import { Membresia } from 'paquete-2-servicios-gimnasio/membresias/menbresia.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { TipoMembresia } from 'paquete-2-servicios-gimnasio/membresias/Tipos/tipo_menbresia.entity';
import { NotificacionesController } from './notificaciones.controller';

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
