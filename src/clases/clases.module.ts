import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importamos TypeOrmModule
import { ClasesController } from './clases.controller';
import { ClasesService } from './clases.service';
import { Clase } from './clase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clase])], // Configuramos el repositorio
  controllers: [ClasesController],
  providers: [ClasesService],
})
export class ClasesModule {}
