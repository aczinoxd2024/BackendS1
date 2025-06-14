import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Personal } from 'personal/personal.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';

@Controller('instructores')
export class InstructorController {
  constructor(
    @InjectRepository(Personal) private readonly personalRepo: Repository<Personal>
  ) {}

  @Get()
  async obtenerInstructores() {
    const instructores = await this.personalRepo.find({
      where: { Cargo: Like('%Instructor%') },
      relations: ['persona']
    });

    return instructores.map(i => ({
      ci: i.CI,
      nombre: i.persona?.Nombre || '',
      apellido: i.persona?.Apellido || '',
      cargo: i.Cargo
    }));
  }
}
