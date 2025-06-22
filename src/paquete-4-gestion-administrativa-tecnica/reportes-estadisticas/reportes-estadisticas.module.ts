import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesEstadisticasController } from './reportes-estadisticas.controller';
import { ReportesEstadisticasService } from './reportes-estadisticas.service';

import { Pago } from 'pagos/pagos.entity';

import { Personal } from 'paquete-2-servicios-gimnasio/personal/personal.entity';
import { AsistenciaPersonal } from 'paquete-2-servicios-gimnasio/personal/asistencia_personal.entity';
import { Clase } from 'paquete-2-servicios-gimnasio/clases/clase.entity';
import { Reserva } from 'paquete-2-servicios-gimnasio/reservas/reserva.entity';
import { Membresia } from 'membresias/membresia.entity';
import { TipoMembresia } from 'membresias/Tipos/tipo_membresia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membresia, TipoMembresia, Pago, Personal,
      AsistenciaPersonal, Clase, Reserva])],
  controllers: [ReportesEstadisticasController],
  providers: [ReportesEstadisticasService],
})
export class ReportesEstadisticasModule {}