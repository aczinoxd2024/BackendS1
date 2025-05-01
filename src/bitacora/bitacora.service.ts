import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bitacora } from './bitacora.entity';

@Injectable()
export class BitacoraService {
  constructor(
    @InjectRepository(Bitacora)
    private bitacoraRepository: Repository<Bitacora>,
  ) {}

  async registrar(
    idUsuario: string,
    accion: string,
    tabla: string,
    ip: string,
  ): Promise<void> {
    const registro = this.bitacoraRepository.create({
      idUsuario,
      accion,
      tablaAfectada: tabla,
      ipMaquina: ip,
    });

    await this.bitacoraRepository.save(registro);
  }
}
