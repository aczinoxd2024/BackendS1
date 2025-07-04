import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  id: string;
  correo: string;
  rol: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✅ Cambiado a solo obtener del handler (NO de la clase)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      // No se definieron roles, acceso permitido (puede ser ruta pública o no protegida por roles)
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new ForbiddenException('No token provided');
    }

    const token = authorizationHeader.split(' ')[1];

    let payload: JwtPayload;

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new ForbiddenException('Problema interno de autenticación');
      }

      payload = await new Promise<JwtPayload>((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
          if (err || !decoded) {
            return reject(err || new Error('Token inválido'));
          }
          resolve(decoded as JwtPayload);
        });
      });

      request.user = payload;
    } catch {
      throw new ForbiddenException('Token inválido o expirado');
    }

    const rolesNormalizados = requiredRoles
      .filter((r) => r)
      .map((r) => r.toString().trim().toLowerCase());

    const rolUsuario = (payload.rol ?? '').toString().trim().toLowerCase();

    console.log('Roles permitidos:', rolesNormalizados);
    console.log('Rol del usuario:', rolUsuario);

    if (!rolesNormalizados.includes(rolUsuario)) {
      throw new ForbiddenException('Acceso denegado por rol insuficiente');
    }

    console.log('Acceso permitido');
    return true;
  }
}
