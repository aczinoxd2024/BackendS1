import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioUso } from './inventario-uso.entity';
import { InventarioUsoService } from './inventario-uso.service';
import { InventarioUsoController } from './inventario-uso.controller';
import { Inventario } from '../inventario/inventario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventarioUso, Inventario])],
  providers: [InventarioUsoService],
  controllers: [InventarioUsoController],
})
export class InventarioUsoModule {}