import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  rol: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtén los roles requeridos desde el reflector
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      console.log('No se requieren roles, acceso permitido.');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorizationHeader = request.headers.authorization;

    // Si no se recibe un token en los headers
    if (!authorizationHeader) {
      console.log('No token provided');
      throw new ForbiddenException('No token provided');
    }

    // Extrae el token del header
    const token = authorizationHeader.split(' ')[1];
    console.log(`Token recibido: ${token}`);

    let payload: JwtPayload;
    try {
      // Intenta verificar y decodificar el token
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      console.log(`Token verificado, payload: ${JSON.stringify(payload)}`);
    } catch (e) {
      console.error('Error al verificar el token:', e);
      throw new ForbiddenException('Token inválido o expirado');
    }

    // Verifica si el rol del payload es uno de los roles requeridos
    if (!requiredRoles.includes(payload.rol)) {
      console.log(`Rol '${payload.rol}' no autorizado para esta ruta.`);
      throw new ForbiddenException('Acceso denegado por rol insuficiente');
    }

    console.log(`Acceso permitido para el rol '${payload.rol}'`);
    return true;
  }
}
