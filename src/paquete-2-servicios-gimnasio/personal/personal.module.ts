import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Personal } from './personal.entity';
import { PersonalService } from './personal.service';
import { PersonalController } from './personal.controller';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { HorarioTrabajo } from 'paquete-2-servicios-gimnasio/asistencia/horario-trabajo.entity';
import { HoraLaboral } from 'paquete-2-servicios-gimnasio/asistencia/hora-laboral.entity';
import { Asistencia } from 'paquete-2-servicios-gimnasio/asistencia/asistencia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Personal,
      Persona, // 👈 requerido por el constructor
      HorarioTrabajo, // 👈 requerido por el constructor
      HoraLaboral, // 👈 requerido por el constructor
      Asistencia, // 👈 requerido por el constructor
    ]),
  ],
  providers: [PersonalService],
  controllers: [PersonalController],
  exports: [TypeOrmModule],
})
export class PersonalModule {}
