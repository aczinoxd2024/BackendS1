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
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EstadoCliente } from 'src/clientes/estado-cliente/estado-cliente.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
    private configService: ConfigService,
    private mailerService: MailerService,
    @InjectRepository(EstadoCliente)
    private estadoClienteRepository: Repository<EstadoCliente>,
  ) {}

  // ✅ Verifica credenciales
  async validateUser(correo: string, password: string): Promise<Usuario> {
    const usuario = await this.usuariosService.findOneByCorreo(correo);
    if (!usuario || !(await this.verifyPassword(usuario, password))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    return usuario;
  }

  // ✅ Verifica contraseña
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

  // ✅ Obtener IP de la petición
  private getClientIp(req: Request): string {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'IP no detectada';

    return Array.isArray(ip) ? ip[0] : ip.toString();
  }

  // ✅ LOGIN
  async login(
    loginDto: LoginDto,
    req: Request,
  ): Promise<{ access_token: string; user: any }> {
    const { correo, password, rol } = loginDto;
    const correoLimpio = correo.trim();

    const usuario = await this.usuariosService.findOneByCorreo(correoLimpio);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const contrasenaValida = await this.verifyPassword(usuario, password);
    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 🚨 ✅ VERIFICAR ESTADO DEL USUARIO (bloquear si está inactivo)
    const estadoInactivo: EstadoCliente | null =
      await this.estadoClienteRepository.findOneBy({
        Estado: 'Inactivo',
      });

    if (estadoInactivo && usuario.idEstadoU === estadoInactivo.ID) {
      console.log('🚨 Usuario inactivo intentando ingresar:', usuario);
      throw new UnauthorizedException(
        'Este usuario está inactivo. Contacte al administrador.',
      );
    }

    // ✅ Verificar perfiles (roles)
    const perfiles = usuario.usuarioPerfil.map((up) => up.perfil?.nombrePerfil);
    if (!perfiles || perfiles.length === 0) {
      throw new UnauthorizedException('El usuario no tiene un rol asignado.');
    }

    if (!perfiles.includes(rol)) {
      throw new UnauthorizedException('Rol no coincide con el usuario');
    }

    // ✅ Preparar JWT
    const payload: JwtPayload = {
      id: usuario.id,
      correo: usuario.correo,
      rol,
    };

    const accessToken = this.jwtService.sign(payload);
    const ip = this.getClientIp(req);

    // ✅ Registrar en bitácora
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

  // ✅ LOGOUT
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

  // ✅ ENVÍA CORREO DE RECUPERACIÓN
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const usuario = await this.usuariosService.findOneByCorreo(email);
    if (!usuario) throw new NotFoundException('Correo no registrado.');

    const rol = usuario.usuarioPerfil[0]?.perfil?.nombrePerfil;
    if (!rol) {
      throw new UnauthorizedException('El usuario no tiene un rol asignado.');
    }

    const payload: JwtPayload = {
      id: usuario.id,
      correo: usuario.correo,
      rol,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Recuperación de contraseña - GoFit',
      html: `
        <p>Hola,</p>
        <p>Solicitaste restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este enlace expirará en 15 minutos.</p>
      `,
    });

    return {
      message: 'Correo enviado con instrucciones para recuperar la contraseña.',
    };
  }

  // ✅ RESET PASSWORD + BITÁCORA
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    req: Request, // ✅ Para obtener IP
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    const usuario = await this.usuariosService.findOneById(payload.id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    usuario.contrasena = await bcrypt.hash(newPassword, 10);
    await this.usuariosService.update(usuario);

    const ip = this.getClientIp(req);

    await this.bitacoraService.registrar(
      usuario.id,
      AccionBitacora.RECUPERACION_CONTRASENA,
      'usuario',
      ip,
    );

    return { message: 'Contraseña actualizada correctamente.' };
  }
}
