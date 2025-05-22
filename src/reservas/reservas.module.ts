import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

import { Reserva } from './reserva.entity';
import { Clase } from '../clases/clase.entity';
import { Cliente } from '../clientes/cliente.entity';
import { EstadoReserva } from '../estado-reserva/estado-reserva.entity';
import { Horario } from '../horarios/horario.entity';
import { Bitacora } from '../bitacora/bitacora.entity';

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
  ],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
