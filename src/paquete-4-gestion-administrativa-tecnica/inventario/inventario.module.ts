import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './inventario.entity';
import { EstadoInventario } from '../estado-inventario/estado-inventario.entity';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { BitacoraModule } from 'paquete-1-usuarios-accesos/bitacora/bitacora.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario, EstadoInventario]),
    BitacoraModule, // 👈 agrégalo aquí
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
