import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../usuarios/usuario.entity';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usuariosService: UsuariosService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallbackSecretKey', // Usa una clave secreta segura
    });
  }

  // Método 'validate' con tipo de retorno 'Usuario' o 'null'
  async validate(payload: any) {
  return {
    sub: payload.sub || payload.id,      // ID del usuario
    correo: payload.correo,
    rol: payload.rol,
    ci: payload.ci                        // Este es el campo CLAVE
  };
}

}
