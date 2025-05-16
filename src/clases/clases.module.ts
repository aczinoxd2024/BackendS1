import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasesService } from './clases.service';
import { ClasesController } from './clases.controller';
import { Clase } from './clase.entity';
import { Sala } from 'src/salas/sala.entity';
import { ClaseInstructor } from './clase-instructor.entity'; // ✅

@Module({
  imports: [TypeOrmModule.forFeature([Clase, Sala, ClaseInstructor])], // ✅
  controllers: [ClasesController],
  providers: [ClasesService],
  exports: [TypeOrmModule], // (opcional si compartís entidades con otros módulos)
})
export class ClasesModule {}
