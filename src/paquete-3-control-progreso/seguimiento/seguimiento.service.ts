import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeguimientoCliente } from './seguimiento.entity';
import { CrearSeguimientoDto } from './crear-seguimiento.dto';

@Injectable()
export class SeguimientoService {
  constructor(
    @InjectRepository(SeguimientoCliente)
    private seguimientoRepository: Repository<SeguimientoCliente>,
  ) {}

  async crear(dto: CrearSeguimientoDto) {
    const seguimiento = this.seguimientoRepository.create(dto);
    return await this.seguimientoRepository.save(seguimiento);
  }

  async obtenerPorCliente(idCliente: string) {
    return this.seguimientoRepository.find({
      where: { IDCliente: idCliente },
      order: { Fecha: 'DESC' },
    });
  }
}
