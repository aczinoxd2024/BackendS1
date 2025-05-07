import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuario.entity';
import { UserRequest } from 'src/auth/user-request.interface';
import { Roles } from 'src/auth/roles/roles.decorator';
import { AuthGuard } from '@nestjs/passport';

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

  // ✅ Endpoint para actualizar usuario con bitácora
  @UseGuards(AuthGuard('jwt'))
  @Roles('recepcionista', 'administrador')
  @Put(':id')
  async updateUsuario(
    @Param('id') id: string,
    @Body() usuario: Usuario,
    @Req() req: UserRequest,
  ): Promise<Usuario> {
    usuario.id = id;
    return this.usuariosService.updateConBitacora(usuario, req); // ✅ Cambiado para registrar en bitácora
  }
}
