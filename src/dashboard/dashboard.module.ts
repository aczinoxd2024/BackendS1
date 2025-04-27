import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // 🔥 importa el JwtModule
import { AdminController } from './admin.controller';
import { ClienteController } from './cliente.controller';
import { InstructorController } from './instructor.controller';
import { RecepcionistaController } from './recepcionista.controller';

@Module({
  imports: [JwtModule.register({})], // 🔥 registra JwtModule aquí
  controllers: [
    AdminController,
    ClienteController,
    InstructorController,
    RecepcionistaController,
  ],
})
export class DashboardModule {}
