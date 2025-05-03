import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './cliente.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';

// 🔥 IMPORTAR módulos necesarios
import { PersonasModule } from '../personas/personas.module';
// 👈 ✅ ESTE FALTABA
import { Usuario } from '../usuarios/usuario.entity';
import { UsuarioPerfil } from '../usuarios/usuario-perfil.entity';
import { Perfil } from '../usuarios/perfil.entity';
import { Bitacora } from '../bitacora/bitacora.entity';
import { Membresia } from '../membresias/menbresia.entity';
import { TipoMembresiaModule } from 'src/membresias/Tipos/tipo-menbresia.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente,
      Usuario,
      UsuarioPerfil,
      Perfil,
      Bitacora,
      Membresia,
    ]),
    PersonasModule, // ✅ Ya estaba
    TipoMembresiaModule, // ✅ 🔥🔥🔥 ESTE ES EL QUE FALTABA
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
