import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

// Entidades relacionadas con pagos y clientes
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
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
