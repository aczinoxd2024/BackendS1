import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesEstadisticasController } from './reportes-estadisticas.controller';
import { ReportesEstadisticasService } from './reportes-estadisticas.service';
import { Membresia } from 'paquete-2-servicios-gimnasio/membresias/menbresia.entity';
import { TipoMembresia } from 'paquete-2-servicios-gimnasio/membresias/Tipos/menbresia.entity';
import { Pago } from 'pagos/pagos.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Membresia,
      TipoMembresia, 
      Pago,
    ]),
  ],
  controllers: [ReportesEstadisticasController],
  providers: [ReportesEstadisticasService],
})
export class ReportesEstadisticasModule {}

