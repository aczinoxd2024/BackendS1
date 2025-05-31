import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoPersona } from './tipo-persona.entity';
import { TipoPersonaService } from './tipo-persona.service';
import { TipoPersonaController } from './tipo-persona.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoPersona])],
  controllers: [TipoPersonaController],
  providers: [TipoPersonaService],
})
export class TipoPersonaModule {}
