import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaSemana } from './dia-semana.entity';
import { DiaSemanaService } from './dia-semana.service';
import { DiaSemanaController } from './dia-semana.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiaSemana])],
  controllers: [DiaSemanaController],
  providers: [DiaSemanaService],
  exports: [TypeOrmModule],
})
export class DiaSemanaModule {}

