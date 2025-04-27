import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../usuarios/usuario.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  // Método para validar las credenciales del usuario
  async validateUser(correo: string, password: string): Promise<Usuario> {
    const usuario = await this.usuariosService.findOneByCorreo(correo);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificamos si la contraseña está en texto plano o ya está encriptada
    const isPasswordValid = await this.verifyPassword(usuario, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    return usuario;
  }

  // Método para verificar la contraseña
  private async verifyPassword(
    usuario: Usuario,
    password: string,
  ): Promise<boolean> {
    // Si la contraseña en la base de datos empieza con "$2", significa que ya está hasheada
    if (usuario.contrasena.startsWith('$2')) {
      // Si ya está encriptada, comparamos directamente
      return await bcrypt.compare(password, usuario.contrasena);
    } else {
      // Si la contraseña está en texto plano, la encriptamos y la actualizamos en la base de datos
      const hashedPassword = await bcrypt.hash(password, 10);
      usuario.contrasena = hashedPassword;

      // Asegúrate de tener el método 'update' en tu servicio de UsuariosService
      await this.usuariosService.update(usuario); // Actualiza la contraseña en la base de datos
      return true;
    }
  }

  // Método para generar el JWT
  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const usuario = await this.usuariosService.findOneByCorreo(loginDto.correo);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await this.verifyPassword(
      usuario,
      loginDto.contrasena,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = { correo: usuario.correo, id: usuario.id };
    const accessToken = this.jwtService.sign(payload);
    return { access_token: accessToken };
  }
}
