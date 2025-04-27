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

// 🔥 Cambiamos a string porque usas UUID
interface JwtPayload {
  id: string;
  correo?: string; // opcional
}

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async validateUser(correo: string, password: string): Promise<Usuario> {
    const usuario: Usuario | null =
      await this.usuariosService.findOneByCorreo(correo);
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

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const usuario: Usuario | null = await this.usuariosService.findOneByCorreo(
      loginDto.correo,
    );
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

    const payload: JwtPayload = { id: usuario.id, correo: usuario.correo }; // 🔥 id es string
    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; token: string }> {
    const { email } = forgotPasswordDto;

    const usuario: Usuario | null =
      await this.usuariosService.findOneByCorreo(email);
    if (!usuario) {
      throw new NotFoundException('Correo no registrado.');
    }

    const payload: JwtPayload = { id: usuario.id }; // 🔥 id es string
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    return { message: 'Instrucciones enviadas.', token };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const payload = this.jwtService.verify<JwtPayload>(token); // 🔥 payload tipado correcto

    const usuario: Usuario | null = await this.usuariosService.findOneById(
      payload.id, // 🔥 id es string
    );
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    usuario.contrasena = hashedPassword;
    await this.usuariosService.update(usuario);

    return { message: 'Contraseña actualizada correctamente.' };
  }
}
