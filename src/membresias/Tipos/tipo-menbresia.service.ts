import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoMembresia } from './menbresia.entity';

@Injectable()
export class TipoMembresiaService {
  constructor(
    @InjectRepository(TipoMembresia)
    private tipoMembresiaRepository: Repository<TipoMembresia>,
  ) {}

  async obtenerTipos(): Promise<{ id: number; nombre: string }[]> {
    const tipos = await this.tipoMembresiaRepository.find();

    // Solo devolver ID y NombreTipo
    return tipos.map((tipo) => ({
      id: tipo.ID,
      nombre: tipo.NombreTipo,
    }));
  }
}
