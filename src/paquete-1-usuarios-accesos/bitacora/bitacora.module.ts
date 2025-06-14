import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraService } from './bitacora.service';
import { Bitacora } from './bitacora.entity';
import { BitacoraController } from './bitacora.controller';
import { JwtModule } from '@nestjs/jwt'; //inventar

@Module({
  imports: [TypeOrmModule.forFeature([Bitacora]), JwtModule.register({})],
  controllers: [BitacoraController],
  providers: [BitacoraService],
  exports: [BitacoraService, TypeOrmModule],
})
export class BitacoraModule {}
