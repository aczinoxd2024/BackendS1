import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './usuario.entity';
import { Perfil } from './perfil.entity';
import { UsuarioPerfil } from './usuario-perfil.entity'; // 🔥 Importar

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Perfil,
      UsuarioPerfil, // 🔥 Aquí agregas UsuarioPerfil
    ]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
