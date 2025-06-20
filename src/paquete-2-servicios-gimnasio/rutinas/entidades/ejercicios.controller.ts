import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ejercicio } from './ejercicio.entity';

@Controller('ejercicios') // 👈 RUTA CORRECTA
export class EjerciciosController {
  constructor(
    @InjectRepository(Ejercicio)
    private readonly ejercicioRepo: Repository<Ejercicio>
  ) {}

  @Get()
  async getAll() {
    return await this.ejercicioRepo.find({ select: ['id', 'nombre'] });
  }
}
