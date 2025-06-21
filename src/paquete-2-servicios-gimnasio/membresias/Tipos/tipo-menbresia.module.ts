import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoMembresia } from './tipo_menbresia.entity';
import { TipoMembresiaController } from './tipo-menbresia.controller';
import { TipoMembresiaService } from './tipo-menbresia.service';
@Module({
  imports: [TypeOrmModule.forFeature([TipoMembresia])],

  controllers: [TipoMembresiaController], // ✅ AÑADIR ESTO para exponer la ruta
  providers: [TipoMembresiaService], // ✅ AÑADIR ESTO para usar el servicio
  exports: [TipoMembresiaService, TypeOrmModule],
})
export class TipoMembresiaModule {}
