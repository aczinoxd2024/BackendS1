import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MembresiasService } from './membresias.service';
import { MembresiasController } from './membresias.controller';
import { Membresia } from './menbresia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membresia])],
  providers: [MembresiasService],
  controllers: [MembresiasController],
})
export class MembresiasModule {}
