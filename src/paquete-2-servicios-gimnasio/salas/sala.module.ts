import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sala } from './sala.entity';
import { SalaService } from './sala.service';
import { SalaController } from './sala.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sala])],
  providers: [SalaService],
  controllers: [SalaController],
  exports: [SalaService],
})
export class SalaModule {}
