import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membresia } from './menbresia.entity';

@Injectable()
export class MembresiasService {
  constructor(
    @InjectRepository(Membresia)
    private membresiaRepository: Repository<Membresia>,
  ) {}

  async create(membresia: Membresia): Promise<Membresia> {
    return this.membresiaRepository.save(membresia);
  }

  async findAll(): Promise<Membresia[]> {
    return this.membresiaRepository.find();
  }

  async findOne(id: number): Promise<Membresia> {
    const membresia = await this.membresiaRepository.findOneBy({
      IDMembresia: id,
    });
    if (!membresia) {
      throw new NotFoundException(`Membresía con ID ${id} no encontrada`);
    }
    return membresia;
  }

  async update(id: number, membresia: Membresia): Promise<Membresia> {
    await this.membresiaRepository.update(id, membresia);
    const updatedMembresia = await this.membresiaRepository.findOneBy({
      IDMembresia: id,
    });
    if (!updatedMembresia) {
      throw new NotFoundException(
        `Membresía con ID ${id} no encontrada para actualizar`,
      );
    }
    return updatedMembresia;
  }

  async remove(id: number): Promise<void> {
    await this.membresiaRepository.delete(id);
  }
}
