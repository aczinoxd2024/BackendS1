import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './asistencia.entity';
import { AsistenciaService } from './asistencia.service';
import { AsistenciaController } from './asistencia.controller';
import { PersonaTipo } from 'paquete-1-usuarios-accesos/persona-tipo/persona-tipo.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { HorarioTrabajo } from './horario-trabajo.entity';
import { DiaSemana } from './dia-semana.entity';
import { HoraLaboral } from './hora-laboral.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asistencia,
      PersonaTipo,
      Persona,
      HorarioTrabajo, // ✅ nuevo
      DiaSemana, // ✅ nuevo
      HoraLaboral, // ✅ nuevo
    ]),
  ],
  providers: [AsistenciaService],
  controllers: [AsistenciaController],
  exports: [TypeOrmModule], // Por si se usa en otro módulo como el de personal
})
export class AsistenciaModule {}
