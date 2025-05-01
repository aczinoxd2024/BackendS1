import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraService } from './bitacora.service';
import { Bitacora } from './bitacora.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bitacora])],
  providers: [BitacoraService],
  exports: [BitacoraService], // 👈 Para usarlo en otros módulos
})
export class BitacoraModule {}
