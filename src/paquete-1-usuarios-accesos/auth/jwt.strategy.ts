import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// ✅ Interfaz con el nuevo campo `id`
interface JwtPayload {
  id: string;
  correo: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallbackSecretKey',
    });
  }

  // ✅ Devuelve el `id` correcto que existe en la tabla USUARIO
  validate(payload: JwtPayload) {
    return {
      id: payload.id,          // ← este será req.user.id
      correo: payload.correo,
      rol: payload.rol,
    };
  }
}
