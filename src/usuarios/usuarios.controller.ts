import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuario.entity';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  async create(@Body() usuario: Usuario): Promise<Usuario> {
    return this.usuariosService.create(usuario);
  }

  @Get()
  async findAll(): Promise<Usuario[]> {
    return this.usuariosService.findAll();
  }

  @Post('rehash')
  async rehashPasswords(): Promise<string> {
    return this.usuariosService.rehashPasswords();
  }
  @Get(':correo')
  async getUsuarioByCorreo(@Param('correo') correo: string): Promise<Usuario> {
    const usuario = await this.usuariosService.findOneByCorreo(correo);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }
}
