import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clase } from './clase.entity';

@Injectable()
export class ClasesService {
  constructor(
    @InjectRepository(Clase)
    private clasesRepository: Repository<Clase>,
  ) {}

  create(clase: Clase): Promise<Clase> {
    return this.clasesRepository.save(clase);
  }

  findAll(): Promise<Clase[]> {
    return this.clasesRepository.find();
  }

  async findOne(id: number): Promise<Clase> {
    const clase = await this.clasesRepository.findOneBy({ IDClase: id });
    if (!clase) {
      throw new NotFoundException(`No se encontró la clase con ID ${id}`);
    }
    return clase;
  }

  async update(id: number, clase: Clase): Promise<Clase> {
    // Eliminamos la asignación innecesaria
    await this.clasesRepository.update(id, clase); // Realizamos la actualización
    return this.findOne(id); // Obtenemos la clase actualizada después de la actualización
  }

  async remove(id: number): Promise<void> {
    // Eliminamos la asignación innecesaria
    await this.clasesRepository.delete(id); // Eliminamos la clase
  }
}
