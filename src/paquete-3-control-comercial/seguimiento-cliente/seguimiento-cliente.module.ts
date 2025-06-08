import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguimientoCliente } from './seguimiento-cliente.entity';
import { SeguimientoClienteService } from './seguimiento-cliente.service';
import { SeguimientoClienteController } from './seguimiento-cliente.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SeguimientoCliente])],
  providers: [SeguimientoClienteService],
  controllers: [SeguimientoClienteController],
})
export class SeguimientoClienteModule {}