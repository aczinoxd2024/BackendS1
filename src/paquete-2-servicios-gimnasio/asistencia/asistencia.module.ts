import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './asistencia.entity';
import { AsistenciaService } from './asistencia.service';
import { AsistenciaController } from './asistencia.controller';
import { PersonaTipo } from 'paquete-1-usuarios-accesos/persona-tipo/persona-tipo.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Asistencia, PersonaTipo,Persona])],
  providers: [AsistenciaService],
  controllers: [AsistenciaController],
})
export class AsistenciaModule {}