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
      secretOrKey: 'secretKey', // Usa una clave secreta segura
    });
  }

  // Método 'validate' con tipo de retorno 'Usuario' o 'null'
  async validate(payload: { correo: string }): Promise<Usuario> {
    // Busca al usuario por correo
    const usuario = await this.usuariosService.findOneByCorreo(payload.correo);

    // Si no se encuentra un usuario, lanzamos una excepción
    if (!usuario) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return usuario; // Retorna el usuario encontrado
  }
}
