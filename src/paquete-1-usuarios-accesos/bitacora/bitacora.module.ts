import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraService } from './bitacora.service';
import { Bitacora } from './bitacora.entity';
import { BitacoraController } from './bitacora.controller';


@Module({
  imports: [TypeOrmModule.forFeature([Bitacora])],
  controllers: [BitacoraController],
  providers: [BitacoraService],
  exports: [BitacoraService, TypeOrmModule],
})
export class BitacoraModule {}
