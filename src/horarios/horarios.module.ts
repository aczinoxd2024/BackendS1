import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horario } from './horario.entity';
import { HorariosService } from './horarios.service';
import { HorariosController } from './horarios.controller';
import { DiaSemana } from '../dia-semana/dia-semana.entity'; // ✅ IMPORTAR

@Module({
  imports: [TypeOrmModule.forFeature([Horario, DiaSemana])], // ✅ REGISTRAR
  controllers: [HorariosController],
  providers: [HorariosService],
})
export class HorariosModule {}
