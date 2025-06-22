import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

// Entidades relacionadas con pagos y clientes
import { Pago } from 'pagos/pagos.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { DetallePago } from 'pagos/detalle-pago/detalle-pago.entity';
import { Membresia } from 'membresias/membresia.entity';
import { TipoMembresia } from 'paquete-3-control-comercial/membresias/Tipos/tipo_membresia.entity';
import { BitacoraModule } from 'paquete-1-usuarios-accesos/bitacora/bitacora.module';

//comprobantePago
import { PagosModule } from 'pagos/pagos.module';

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
    BitacoraModule,
    PagosModule,
  ],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
