import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])], // Importamos la entidad Usuario
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [UsuariosService], // Exportamos el servicio si se necesita en otros módulos
})
export class UsuariosModule {}
