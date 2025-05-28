import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './pagos.entity';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { Membresia } from 'src/membresias/menbresia.entity';
import { TipoMembresia } from 'src/membresias/Tipos/menbresia.entity';
import { Persona } from 'src/personas/persona.entity';
import { Usuario } from 'src/usuarios/usuario.entity';
import { Cliente } from 'src/clientes/cliente.entity';
import { Clase } from 'src/clases/clase.entity';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pago,
      DetallePago,
      Membresia,
      TipoMembresia,
      Persona,
      Usuario,
      Cliente,
      Clase,
    ]),
  ],
  providers: [PagosService],
  controllers: [PagosController],
  exports: [PagosService, TypeOrmModule], // ✅ ahora sí expone el repo de Pago
})
export class PagosModule {}
