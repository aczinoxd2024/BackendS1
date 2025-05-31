import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import * as bcrypt from 'bcryptjs';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { AccionBitacora } from 'src/bitacora/bitacora-actions.enum';
import { UserRequest } from 'src/auth/user-request.interface';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,

    private bitacoraService: BitacoraService,
  ) {}

  async create(usuario: Usuario): Promise<Usuario> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(usuario.contrasena, saltOrRounds);
    usuario.contrasena = hashedPassword;
    return await this.usuarioRepository.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return await this.usuarioRepository.find();
  }

  async rehashPasswords(): Promise<string> {
    const usuarios = await this.usuarioRepository.find();
    const saltOrRounds = 10;

    for (const usuario of usuarios) {
      if (!usuario.contrasena.startsWith('$2')) {
        const hashed = await bcrypt.hash(usuario.contrasena, saltOrRounds);
        usuario.contrasena = hashed;
        await this.usuarioRepository.save(usuario);
      }
    }
    return 'Contraseñas de los usuarios existentes han sido actualizadas';
  }

  async findOneByCorreo(correo: string): Promise<Usuario | null> {
    return await this.usuarioRepository.findOne({
      where: { correo },
      relations: ['idPersona', 'usuarioPerfil', 'usuarioPerfil.perfil'],
    });
  }

  // ✅ update normal (sin bitácora) → para mantener compatibilidad con el sistema
  async update(usuario: Usuario): Promise<Usuario> {
    return await this.usuarioRepository.save(usuario);
  }

  // ✅ updateConBitacora → para actualizar y registrar en bitácora
  async updateConBitacora(
    usuario: Usuario,
    request: UserRequest,
  ): Promise<Usuario> {
    const usuarioActualizado = await this.usuarioRepository.save(usuario);

    const idUsuarioAccion = request.user?.id || 'desconocido';
    const ip = this.bitacoraService.getClientIp(request);

    await this.bitacoraService.registrar(
      idUsuarioAccion,
      AccionBitacora.MODIFICACION_USUARIO,
      'usuario',
      ip,
    );

    return usuarioActualizado;
  }

  async findOneById(id: string): Promise<Usuario | null> {
    return await this.usuarioRepository.findOne({
      where: { id },
      relations: ['idPersona', 'usuarioPerfil', 'usuarioPerfil.perfil'],
    });
  }
}
