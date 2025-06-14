import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoInventario } from './estado-inventario.entity';
import { EstadoInventarioService } from './estado-inventario.service';
import { EstadoInventarioController } from './estado-inventario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoInventario])],
  controllers: [EstadoInventarioController],
  providers: [EstadoInventarioService],
  exports: [EstadoInventarioService],
})
export class EstadoInventarioModule {}
