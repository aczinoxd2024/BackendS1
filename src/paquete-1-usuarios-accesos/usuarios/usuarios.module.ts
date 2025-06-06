import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './usuario.entity';
import { Perfil } from './perfil.entity';
import { UsuarioPerfil } from './usuario-perfil.entity';
import { BitacoraModule } from 'paquete-1-usuarios-accesos/bitacora/bitacora.module'; // ✅ Importar BitacoraModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Perfil, UsuarioPerfil]),
    BitacoraModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [
    UsuariosService,
    TypeOrmModule, // ✅ ¡Esto es lo que permite inyectar el repositorio en otros módulos!
  ],
})
export class UsuariosModule {}
