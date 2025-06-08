import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Personal } from './personal.entity';
import { PersonalService } from './personal.service';
import { PersonalController } from './personal.controller';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { HorarioTrabajo } from 'paquete-2-servicios-gimnasio/asistencia/horario-trabajo.entity';
import { HoraLaboral } from 'paquete-2-servicios-gimnasio/asistencia/hora-laboral.entity';
import { Asistencia } from 'paquete-2-servicios-gimnasio/asistencia/asistencia.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity'; // ✅ IMPORTACIÓN

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Personal,
      Persona,
      HorarioTrabajo,
      HoraLaboral,
      Asistencia,
      Bitacora, // ✅ AÑADIDO AQUÍ
    ]),
  ],
  providers: [PersonalService],
  controllers: [PersonalController],
  exports: [TypeOrmModule],
})
export class PersonalModule {}
