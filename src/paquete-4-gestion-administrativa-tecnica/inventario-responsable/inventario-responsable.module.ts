import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioResponsable } from './inventario-responsable.entity';
import { InventarioResponsableService } from './inventario-responsable.service';
import { InventarioResponsableController } from './inventario-responsable.controller';
import { Inventario } from '../inventario/inventario.entity';
import { Personal } from 'paquete-2-servicios-gimnasio/personal/personal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventarioResponsable, Inventario, Personal])],
  providers: [InventarioResponsableService],
  controllers: [InventarioResponsableController],
})
export class InventarioResponsableModule {}
