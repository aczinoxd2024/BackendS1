import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bitacora } from './bitacora.entity';
import { Request } from 'express';
import { AccionBitacora } from './bitacora-actions.enum';
import { JwtService } from '@nestjs/jwt'; // invetar

@Injectable()
export class BitacoraService {
  constructor(
    @InjectRepository(Bitacora)
    private bitacoraRepository: Repository<Bitacora>,
    private jwtService: JwtService, // inventar
  ) {}

  /**
   * Obtiene todos los registros de bitácora con usuario y persona (nombre completo)
   */
  async obtenerTodos(): Promise<Bitacora[]> {
    return await this.bitacoraRepository.find({
      relations: ['usuario', 'usuario.idPersona'],
      order: { fechaHora: 'DESC' },
    });
  }

  /**
   * Registra una nueva entrada en la bitácora
   */
  async registrar(
    idUsuario: string,
    accion: AccionBitacora,
    tabla: string,
    ip: string,
  ): Promise<void> {
    try {
      if (!idUsuario || !accion || !tabla || !ip) {
        console.error('❌ Registro bitácora inválido:', {
          idUsuario,
          accion,
          tabla,
          ip,
        });
        return;
      }

      const registro = this.bitacoraRepository.create({
        idUsuario,
        accion,
        tablaAfectada: tabla,
        ipMaquina: ip,
      });

      await this.bitacoraRepository.save(registro);
      console.log('✅ Bitácora registrada:', registro);
    } catch (error) {
      console.error('❌ Error al registrar en bitácora:', error);
    }
  }

  /**
   * Registra en la bitácora extrayendo info desde el request JWT
   */
  async registrarDesdeRequest(
    req: Request,
    accion: AccionBitacora,
    tabla: string,
  ): Promise<void> {
    const authHeader = req.headers['authorization'];
    let idUsuario: string | undefined;

    try {
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded: any = this.jwtService.decode(token);

        console.log('🎯 JWT recibido en bitácora:', decoded);
        idUsuario = decoded?.id;
      }

      if (!idUsuario) {
        console.warn(
          '⚠️ No se pudo extraer el ID del usuario desde el token JWT',
        );
        return;
      }

      const ip = this.getClientIp(req);
      await this.registrar(idUsuario, accion, tabla, ip);
    } catch (error) {
      console.error('❌ Error al registrar en bitácora desde request:', error);
    }
  }

  /**
   * Extrae IP del request
   */
  getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    let ip = '';

    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0];
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0];
    } else {
      ip = request.socket.remoteAddress || 'IP no detectada';
    }

    if (ip === '::1' || ip === '127.0.0.1') {
      return 'localhost';
    }

    return ip;
  }
}
