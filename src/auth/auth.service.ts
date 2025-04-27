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
    console.log('DEBUG usuario.contrasena:', usuario.contrasena);
    console.log('DEBUG password ingresada:', password);

    if (!usuario.contrasena) {
      throw new UnauthorizedException(
        'El usuario no tiene contraseña configurada',
      );
    }

    if (!password) {
      throw new UnauthorizedException('Contraseña no proporcionada');
    }

    if (usuario.contrasena.startsWith('$2')) {
      return await bcrypt.compare(password, usuario.contrasena);
    } else {
      const hashedPassword = await bcrypt.hash(usuario.contrasena, 10);
      usuario.contrasena = hashedPassword;
      await this.usuariosService.update(usuario);
      return await bcrypt.compare(password, usuario.contrasena);
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
