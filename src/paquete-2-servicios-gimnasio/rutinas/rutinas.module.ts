import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutinasService } from './rutinas.service';
import { RutinasController } from './rutinas.controller';

import { Rutina } from './entidades/rutina.entity';
import { DetalleRutina } from './entidades/detalle-rutina.entity';
import { Ejercicio } from './entidades/ejercicio.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { DiaSemana } from 'dia-semana/dia-semana.entity';
import { ClienteRutina } from './entidades/cliente-rutina.entity';
import { GrupoMuscular } from './entidades/grupo-muscular.entity';
import { BitacoraModule } from 'paquete-1-usuarios-accesos/bitacora/bitacora.module';
import { Clase } from 'paquete-2-servicios-gimnasio/clases/clase.entity'; // 👈 AÑADIDO

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rutina,
      DetalleRutina,
      Ejercicio,
      Cliente,
      DiaSemana,
      ClienteRutina,
      GrupoMuscular,
      Clase // 👈 AÑADIDO PARA QUE EL ClaseRepository FUNCIONE
    ]),
    BitacoraModule
  ],
  controllers: [RutinasController],
  providers: [RutinasService],
  exports: [RutinasService],
})
export class RutinasModule {}
