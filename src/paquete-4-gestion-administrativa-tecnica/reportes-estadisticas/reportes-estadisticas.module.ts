import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesEstadisticasController } from './reportes-estadisticas.controller';
import { ReportesEstadisticasService } from './reportes-estadisticas.service';
import { Membresia } from 'paquete-3-control-comercial/membresias/membresia.entity';
import { Pago } from 'pagos/pagos.entity';
import { TipoMembresia } from 'paquete-3-control-comercial/membresias/Tipos/tipo_membresia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membresia, TipoMembresia, Pago])],
  controllers: [ReportesEstadisticasController],
  providers: [ReportesEstadisticasService],
})
export class ReportesEstadisticasModule {}
