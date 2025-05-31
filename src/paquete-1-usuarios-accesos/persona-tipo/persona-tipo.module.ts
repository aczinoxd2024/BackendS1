import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonaTipo } from './persona-tipo.entity';
import { PersonaTipoService } from './persona-tipo.service';
import { PersonaTipoController } from './persona-tipo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PersonaTipo])],
  controllers: [PersonaTipoController],
  providers: [PersonaTipoService],
})
export class PersonaTipoModule {}
