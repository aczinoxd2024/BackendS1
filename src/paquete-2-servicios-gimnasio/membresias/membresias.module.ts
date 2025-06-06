import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membresia } from './menbresia.entity';
import { MembresiasService } from './membresias.service';
import { MembresiasController } from './membresias.controller';

// ✅ Importar correctamente desde la carpeta Tipos

import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { TipoMembresiaModule } from './Tipos/tipo-menbresia.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membresia, Cliente]),
    TipoMembresiaModule, // ✅ YA FUNCIONAL
  ],
  controllers: [MembresiasController],
  providers: [MembresiasService],
})
export class MembresiasModule {}
