import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import * as bcrypt from 'bcryptjs'; // Usamos bcryptjs para encriptar la contraseña

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  // Método para crear un nuevo usuario
  async create(usuario: Usuario): Promise<Usuario> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(usuario.contrasena, saltOrRounds); // Encriptamos la contraseña
    usuario.contrasena = hashedPassword; // Guardamos el hash en lugar de la contraseña original
    return await this.usuarioRepository.save(usuario); // Guardamos el usuario con la contraseña encriptada
  }

  // Obtener todos los usuarios
  async findAll(): Promise<Usuario[]> {
    return await this.usuarioRepository.find();
  }

  // Rehash de contraseñas de todos los usuarios si es necesario
  async rehashPasswords(): Promise<string> {
    const usuarios = await this.usuarioRepository.find();
    const saltOrRounds = 10;

    for (const usuario of usuarios) {
      // Verifica si la contraseña ya está hasheada
      if (!usuario.contrasena.startsWith('$2')) {
        // bcrypt hashes siempre comienzan con $2b$, $2a$, etc.
        const hashed = await bcrypt.hash(usuario.contrasena, saltOrRounds);
        usuario.contrasena = hashed; // Actualiza la contraseña con el hash
        await this.usuarioRepository.save(usuario); // Guarda el usuario con la contraseña hasheada
      }
    }
    return 'Contraseñas de los usuarios existentes han sido actualizadas';
  }

  // Método para obtener un usuario por correo
  async findOneByCorreo(correo: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { correo },
      relations: ['idPersona'], // Asegura que se cargue la relación con Persona
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con correo ${correo} no encontrado`); // Lanzamos una excepción más apropiada
    }

    return usuario;
  }
  // Agrega este método al servicio de usuarios
  async update(usuario: Usuario): Promise<Usuario> {
    return await this.usuarioRepository.save(usuario);
  }
}
