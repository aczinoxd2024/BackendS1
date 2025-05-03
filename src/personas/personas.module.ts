import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
import { Persona } from './persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Persona])], // 👈 ✅ Registrando Persona para Repository
  providers: [PersonasService],
  controllers: [PersonasController],
  exports: [TypeOrmModule], // 👈 ✅ Exportando para que otros módulos puedan usar PersonaRepository
})
export class PersonasModule {}
