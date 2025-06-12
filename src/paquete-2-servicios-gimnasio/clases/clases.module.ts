import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasesService } from './clases.service';
import { ClasesController } from './clases.controller';
import { Clase } from './clase.entity';
import { Sala } from 'salas/sala.entity';
import { ClaseInstructor } from './clase-instructor.entity';
import { BitacoraModule } from 'paquete-1-usuarios-accesos/bitacora/bitacora.module';
import { Personal } from '../personal/personal.entity';
import { Horario } from '../horarios/horario.entity';
import { DiaSemana } from '../dia-semana/dia-semana.entity';
import { Rutina } from '../rutinas/entidades/rutina.entity'; // 👈 importar Rutina

@Module({
  imports: [
    TypeOrmModule.forFeature([Clase, Sala, ClaseInstructor, Personal, Horario, DiaSemana, Rutina,]),
    BitacoraModule,
  ],

  controllers: [ClasesController],
  providers: [ClasesService],
  exports: [TypeOrmModule.forFeature([Clase])], // ✅ exportar explícitamente el repositorio de Clase
})
export class ClasesModule {}
