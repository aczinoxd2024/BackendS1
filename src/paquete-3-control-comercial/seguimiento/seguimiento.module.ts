import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguimientoCliente } from './seguimiento.entity';
import { SeguimientoService } from './seguimiento.service';
import { SeguimientoController } from './seguimiento.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SeguimientoCliente])],
  providers: [SeguimientoService],
  controllers: [SeguimientoController],
})
export class SeguimientoModule {}
