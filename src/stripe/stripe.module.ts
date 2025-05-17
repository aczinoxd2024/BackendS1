import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Pago } from 'src/pagos/pagos.entity';
import { Usuario } from 'src/usuarios/usuario.entity';
import { Cliente } from 'src/clientes/cliente.entity';

import { DetallePago } from 'src/pagos/detalle-pago/detalle-pago.entity';
import { Membresia } from 'src/membresias/menbresia.entity';
import { TipoMembresia } from 'src/membresias/Tipos/menbresia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pago,
      Usuario,
      Cliente,
      DetallePago,
      Membresia,
      TipoMembresia,
    ]),
  ],
  providers: [StripeService],
  controllers: [StripeController],
})
export class StripeModule {}
