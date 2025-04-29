import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../usuarios/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

interface JwtPayload {
  id: string;
  correo: string;
  rol: string; // El token llevará también el rol
}

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

    const isPasswordValid = await this.verifyPassword(usuario, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    return usuario;
  }

  private async verifyPassword(
    usuario: Usuario,
    password: string,
  ): Promise<boolean> {
    if (!usuario.contrasena) {
      throw new UnauthorizedException(
        'El usuario no tiene contraseña configurada',
      );
    }

    // Verificamos la contraseña directamente
    return bcrypt.compare(password, usuario.contrasena);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: any }> {
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

    const rol = usuario.usuarioPerfil[0]?.perfil?.nombrePerfil;

    if (!rol) {
      throw new UnauthorizedException('El usuario no tiene un rol asignado.');
    }

    const payload: JwtPayload = {
      id: usuario.id,
      correo: usuario.correo,
      rol: rol,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        rol: rol,
      },
    };
  }

  // Método para recuperar la contraseña
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; token: string }> {
    const { email } = forgotPasswordDto;

    const usuario = await this.usuariosService.findOneByCorreo(email);
    if (!usuario) {
      throw new NotFoundException('Correo no registrado.');
    }

    const rol = usuario.usuarioPerfil[0]?.perfil?.nombrePerfil;

    if (!rol) {
      throw new UnauthorizedException('El usuario no tiene un rol asignado.');
    }

    const payload: JwtPayload = {
      id: usuario.id,
      correo: usuario.correo,
      rol: rol,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    return { message: 'Instrucciones enviadas.', token };
  }

  // Método para resetear la contraseña
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const payload = this.jwtService.verify<JwtPayload>(token);

    const usuario = await this.usuariosService.findOneById(payload.id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Hasheamos la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    usuario.contrasena = hashedPassword;
    await this.usuariosService.update(usuario);

    return { message: 'Contraseña actualizada correctamente.' };
  }
}
