import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './pagos.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago])],
  exports: [TypeOrmModule], // 👈 Esto es MUY IMPORTANTE para que otros módulos lo puedan usar (ej: ClientesModule)
})
export class PagoModule {}
