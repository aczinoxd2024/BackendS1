import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasesService } from './clases.service';
import { ClasesController } from './clases.controller';
import { Clase } from './clase.entity';
import { Sala } from 'src/salas/sala.entity';
import { ClaseInstructor } from './clase-instructor.entity';
import { BitacoraModule } from '../bitacora/bitacora.module';


@Module({
  imports: [TypeOrmModule.forFeature([Clase, Sala, ClaseInstructor]), BitacoraModule,],
  
  controllers: [ClasesController],
  providers: [ClasesService],
  exports: [TypeOrmModule.forFeature([Clase])] // ✅ exportar explícitamente el repositorio de Clase
})
export class ClasesModule {}
