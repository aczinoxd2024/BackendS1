import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from 'src/paquete-1-usuarios-accesos/usuarios/usuarios.service';

// ✅ Interfaz con los campos esperados del token
interface JwtPayload {
  ci: string;
  correo: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usuariosService: UsuariosService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallbackSecretKey',
    });
  }

  // ✅ Ya no es async (no se usa await) y se usa tipado correcto
  validate(payload: JwtPayload) {
    return {
      id: payload.ci, // 👈 ID del usuario (es el CI en tu app)
      correo: payload.correo,
      rol: payload.rol,
    };
  }
}
