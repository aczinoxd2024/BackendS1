import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bitacora } from './bitacora.entity';
import { Request } from 'express';
import { AccionBitacora } from './bitacora-actions.enum'; // ✅ Importar enum

@Injectable()
export class BitacoraService {
  constructor(
    @InjectRepository(Bitacora)
    private bitacoraRepository: Repository<Bitacora>,
  ) {}

  /**
   * Obtiene todos los registros de bitácora con usuario y persona (nombre completo)
   */
  async obtenerTodos(): Promise<Bitacora[]> {
    return await this.bitacoraRepository.find({
      relations: ['usuario', 'usuario.idPersona'], // ✅ Para traer nombre
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
        return; // Evita que se rompa si falta algo
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

    // Formatear IP localhost
    if (ip === '::1' || ip === '127.0.0.1') {
      return 'localhost';
    }

    return ip;
  }
}
