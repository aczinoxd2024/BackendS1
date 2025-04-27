import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
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
      relations: ['idPersona'],
    });
  }

  async update(usuario: Usuario): Promise<Usuario> {
    return await this.usuarioRepository.save(usuario);
  }

  async findOneById(id: string): Promise<Usuario | null> {
    return await this.usuarioRepository.findOne({
      where: { id },
      relations: ['idPersona'],
    });
  }
}
