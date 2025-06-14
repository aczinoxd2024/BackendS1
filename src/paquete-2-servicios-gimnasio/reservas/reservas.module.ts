import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { UsuariosModule } from 'paquete-1-usuarios-accesos/usuarios/usuarios.module'; 
import { Reserva } from './reserva.entity';
import { Clase } from '../clases/clase.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { EstadoReserva } from '../estado-reserva/estado-reserva.entity';
import { Horario } from '../horarios/horario.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reserva,
      Clase,
      Cliente,
      EstadoReserva,
      Horario,
      Bitacora,
    ]),
    UsuariosModule
  ],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
