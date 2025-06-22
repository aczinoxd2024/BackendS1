import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membresia } from './membresia.entity';
import { MembresiasService } from './membresias.service';
import { MembresiasController } from './membresias.controller';

// ✅ Importar correctamente desde la carpeta Tipos

import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { TipoMembresiaModule } from './Tipos/tipo_membresia.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membresia, Cliente]),
    TipoMembresiaModule, // ✅ YA FUNCIONAL
  ],
  controllers: [MembresiasController,],
  providers: [MembresiasService],
   exports: [TypeOrmModule],
})
export class MembresiasModule {}
