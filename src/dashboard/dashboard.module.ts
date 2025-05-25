import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { ClienteController } from './cliente.controller';
import { InstructorController } from './instructor.controller';
import { RecepcionistaController } from './recepcionista.controller';
import { Personal } from '../personal/personal.entity'; // ✅ entidad necesaria

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Personal]) // ✅ registra el repositorio aquí
  ],
  controllers: [
    AdminController,
    ClienteController,
    InstructorController,
    RecepcionistaController,
  ],
})
export class DashboardModule {}
