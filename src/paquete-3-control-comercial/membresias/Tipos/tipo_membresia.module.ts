import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoMembresia } from './tipo_membresia.entity';
import { TipoMembresiaService } from './tipo_membresia.service';
import { TipoMembresiaController } from './tipo_membresia.controller';
import { BitacoraModule } from 'paquete-1-usuarios-accesos/bitacora/bitacora.module';
import { Promocion } from '../../promociones-Crud/promocion.entity';
import { PromocionModule } from '../../promociones-Crud/promocion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TipoMembresia]),
    BitacoraModule,
    Promocion,
    PromocionModule,
  ],

  controllers: [TipoMembresiaController],
  providers: [TipoMembresiaService],
  exports: [TypeOrmModule],
})
export class TipoMembresiaModule {}
