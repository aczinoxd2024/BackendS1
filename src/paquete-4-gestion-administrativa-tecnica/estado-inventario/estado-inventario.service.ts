import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoInventario } from './estado-inventario.entity';

@Injectable()
export class EstadoInventarioService {
  constructor(
    @InjectRepository(EstadoInventario)
    private readonly estadoRepo: Repository<EstadoInventario>,
  ) {}

  findAll(): Promise<EstadoInventario[]> {
    return this.estadoRepo.find();
  }
}
