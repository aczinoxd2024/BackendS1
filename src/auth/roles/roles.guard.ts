import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken'; // 🔥 Importamos jsonwebtoken
import { ConfigService } from '@nestjs/config'; // 🔥 Para leer el secret del .env

interface JwtPayload {
  rol: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('🔵 Roles requeridos para esta ruta:', requiredRoles);

    if (!requiredRoles) {
      console.log('🟡 No se requieren roles, acceso permitido.');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      console.log('🔴 No token provided');
      throw new ForbiddenException('No token provided');
    }

    const token = authorizationHeader.split(' ')[1];
    console.log('🟠 Token recibido:', token);

    let payload: JwtPayload;
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        console.error('❌ JWT_SECRET no está definido en .env');
        throw new ForbiddenException('Problema interno de autenticación');
      }

      const decoded = jwt.verify(token, secret) as unknown as JwtPayload;
      payload = decoded;

      console.log('🟢 Token verificado correctamente, payload:', payload);
    } catch (e) {
      console.error('🔴 Error al verificar el token:', e.message);
      throw new ForbiddenException('Token inválido o expirado');
    }

    console.log(
      '🟣 Verificando si el rol del usuario está permitido:',
      payload.rol,
    );

    if (!requiredRoles.includes(payload.rol)) {
      console.log(`🔴 Rol '${payload.rol}' no autorizado para esta ruta.`);
      throw new ForbiddenException('Acceso denegado por rol insuficiente');
    }

    console.log(`✅ Acceso permitido para el rol '${payload.rol}'`);
    return true;
  }
}
