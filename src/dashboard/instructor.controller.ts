import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Personal } from 'src/personal/personal.entity';
import { Persona } from 'src/personas/persona.entity';

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
