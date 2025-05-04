import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../usuarios/usuario.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { Request } from 'express';
import { AccionBitacora } from '../bitacora/bitacora-actions.enum';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface JwtPayload {
  id: string;
  correo: string;
  rol: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private bitacoraService: BitacoraService,
  ) {}

  // Validar usuario y contraseña
  async validateUser(correo: string, password: string): Promise<Usuario> {
    const usuario = await this.usuariosService.findOneByCorreo(correo);
    if (!usuario || !(await this.verifyPassword(usuario, password))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    return usuario;
  }

  // Comparar contraseña hasheada
  private async verifyPassword(
    usuario: Usuario,
    password: string,
  ): Promise<boolean> {
    if (!usuario.contrasena) {
      throw new UnauthorizedException(
        'El usuario no tiene contraseña configurada',
      );
    }
    return bcrypt.compare(password, usuario.contrasena);
  }

  // Obtener la IP real del cliente
  private getClientIp(req: Request): string {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'IP no detectada';
    return Array.isArray(ip) ? ip[0] : ip.toString();
  }

  // Iniciar sesión y registrar en bitácora
  async login(
    loginDto: LoginDto,
    req: Request,
  ): Promise<{ access_token: string; user: any }> {
    const { correo, password, rol } = loginDto;
    const correoLimpio = correo.trim();

    const usuario = await this.usuariosService.findOneByCorreo(correoLimpio);

    if (!usuario) {
      console.log('❌ Usuario no encontrado con correo:', correoLimpio);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const contrasenaValida = await this.verifyPassword(usuario, password);
    if (!contrasenaValida) {
      console.log('❌ Contraseña inválida para usuario:', correoLimpio);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const perfiles = usuario.usuarioPerfil.map((up) => up.perfil?.nombrePerfil);

    console.log('✅ Usuario encontrado:', correoLimpio);
    console.log('🎭 Perfiles asignados:', perfiles);
    console.log('🎯 Rol seleccionado:', rol);

    if (!perfiles || perfiles.length === 0) {
      throw new UnauthorizedException('El usuario no tiene un rol asignado.');
    }

    if (!perfiles.includes(rol)) {
      throw new UnauthorizedException('Rol no coincide con el usuario');
    }

    const payload: JwtPayload = {
      id: usuario.id,
      correo: usuario.correo,
      rol,
    };

    const accessToken = this.jwtService.sign(payload);

    const ip = this.getClientIp(req);

    await this.bitacoraService.registrar(
      usuario.id,
      AccionBitacora.LOGIN,
      'usuario',
      ip,
    );

    return {
      access_token: accessToken,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.idPersona?.Nombre ?? 'Sin nombre',
        rol,
      },
    };
  }

  // Cerrar sesión y registrar en bitácora
  async logout(req: Request): Promise<{ message: string }> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { message: 'No había token para cerrar sesión.' };
    }

    const token = authHeader.split(' ')[1];
    const payload = this.jwtService.verify<JwtPayload>(token);

    const ip = this.getClientIp(req);

    await this.bitacoraService.registrar(
      payload.id,
      AccionBitacora.LOGOUT,
      'usuario',
      ip,
    );

    return { message: 'Cierre de sesión registrado correctamente.' };
  }

  // Solicitud para recuperación de contraseña
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; token: string }> {
    const { email } = forgotPasswordDto;
    const usuario = await this.usuariosService.findOneByCorreo(email);
    if (!usuario) throw new NotFoundException('Correo no registrado.');

    const rol = usuario.usuarioPerfil[0]?.perfil?.nombrePerfil;
    if (!rol)
      throw new UnauthorizedException('El usuario no tiene un rol asignado.');

    const payload: JwtPayload = {
      id: usuario.id,
      correo: usuario.correo,
      rol,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    return { message: 'Instrucciones enviadas.', token };
  }

  // Restablecimiento de contraseña
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;
    const payload = this.jwtService.verify<JwtPayload>(token);

    const usuario = await this.usuariosService.findOneById(payload.id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    usuario.contrasena = await bcrypt.hash(newPassword, 10);
    await this.usuariosService.update(usuario);

    return { message: 'Contraseña actualizada correctamente.' };
  }
}
