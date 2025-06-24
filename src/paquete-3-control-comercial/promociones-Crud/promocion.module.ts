import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promocion } from './promocion.entity';
import { PromocionService } from './promocion.service';
import { PromocionController } from './promocion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Promocion])],
  providers: [PromocionService],
  controllers: [PromocionController],
  exports: [TypeOrmModule, PromocionService],
})
export class PromocionModule {}
