import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoPersona } from './tipo-persona.entity';

@Injectable()
export class TipoPersonaService {
  constructor(
    @InjectRepository(TipoPersona)
    private tipoPersonaRepository: Repository<TipoPersona>,
  ) {}

  async create(tipo: TipoPersona): Promise<TipoPersona> {
    return await this.tipoPersonaRepository.save(tipo);
  }

  async findAll(): Promise<TipoPersona[]> {
    return await this.tipoPersonaRepository.find();
  }
}
