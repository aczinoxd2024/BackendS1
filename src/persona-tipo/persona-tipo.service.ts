import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonaTipo } from './persona-tipo.entity';

@Injectable()
export class PersonaTipoService {
  constructor(
    @InjectRepository(PersonaTipo)
    private personaTipoRepository: Repository<PersonaTipo>,
  ) {}

  async assign(personaTipo: PersonaTipo): Promise<PersonaTipo> {
    return await this.personaTipoRepository.save(personaTipo);
  }

  async findAll(): Promise<PersonaTipo[]> {
    return await this.personaTipoRepository.find();
  }
}
