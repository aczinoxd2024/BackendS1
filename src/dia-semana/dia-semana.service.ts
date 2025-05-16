import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiaSemana } from './dia-semana.entity';

@Injectable()
export class DiaSemanaService {
  constructor(
    @InjectRepository(DiaSemana)
    private readonly diaRepo: Repository<DiaSemana>,
  ) {}

  findAll(): Promise<DiaSemana[]> {
    return this.diaRepo.find();
  }
}

