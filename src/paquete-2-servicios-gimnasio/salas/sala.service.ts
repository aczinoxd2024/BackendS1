import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sala } from './sala.entity';

@Injectable()
export class SalaService {
  constructor(
    @InjectRepository(Sala)
    private readonly salaRepository: Repository<Sala>,
  ) {}

  findAll(): Promise<Sala[]> {
    return this.salaRepository.find();
  }
}
