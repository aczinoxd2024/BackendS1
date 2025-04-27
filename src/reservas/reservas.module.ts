import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { Reserva } from './reserva.entity'; // Asegúrate de que esta importación esté correcta
import { Persona } from '../personas/persona.entity'; // Importa la entidad Persona

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Persona])], // Aseguramos que Persona también esté registrada
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
