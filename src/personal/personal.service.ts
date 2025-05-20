import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personal } from './personal.entity';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class PersonalService {
  constructor(
    @InjectRepository(Personal)
    private readonly personalRepo: Repository<Personal>,
  ) {}

  findAll(): Promise<Personal[]> {
    return this.personalRepo.find();
  }

  async findOne(ci: string): Promise<Personal> {
  const persona = await this.personalRepo.findOneBy({ CI: ci });
  if (!persona) {
    throw new NotFoundException('Instructor no encontrado');
  }
  return persona;
}
}
