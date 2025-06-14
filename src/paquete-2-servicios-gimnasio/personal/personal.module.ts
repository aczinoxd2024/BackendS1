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
import { AsistenciaPersonal } from './asistencia_personal.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Personal,
      Persona,
      HorarioTrabajo,
      HoraLaboral,
      Asistencia,
      Usuario,
      Bitacora, // ✅ AÑADIDO AQUÍ
      AsistenciaPersonal,
    ]),
  ],

  providers: [PersonalService],
  controllers: [PersonalController],
  exports: [TypeOrmModule],
})
export class PersonalModule {}
