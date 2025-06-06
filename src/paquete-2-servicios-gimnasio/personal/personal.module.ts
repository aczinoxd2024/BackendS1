import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Personal } from './personal.entity';
import { PersonalService } from './personal.service';
import { PersonalController } from './personal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Personal])],
  providers: [PersonalService],
  controllers: [PersonalController],
  exports: [TypeOrmModule],
})
export class PersonalModule {}
