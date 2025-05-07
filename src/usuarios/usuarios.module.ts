import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './usuario.entity';
import { Perfil } from './perfil.entity';
import { UsuarioPerfil } from './usuario-perfil.entity';
import { BitacoraModule } from 'src/bitacora/bitacora.module'; // ✅ Importar BitacoraModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Perfil, UsuarioPerfil]),
    BitacoraModule, // ✅ Agregar BitacoraModule aquí para poder inyectar BitacoraService
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
