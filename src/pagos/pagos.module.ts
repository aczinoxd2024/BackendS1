import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './pagos.entity';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { Membresia } from 'membresias/menbresia.entity';
import { TipoMembresia } from 'paquete-2-servicios-gimnasio/membresias/Tipos/tipo_menbresia.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Clase } from 'clases/clase.entity';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';

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
      Bitacora,
    ]),
  ],
  providers: [PagosService],
  controllers: [PagosController],
  exports: [PagosService, TypeOrmModule], // ✅ ahora sí expone el repo de Pago
})
export class PagosModule {}
