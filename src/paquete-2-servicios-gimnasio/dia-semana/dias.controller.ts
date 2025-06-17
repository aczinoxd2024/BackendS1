import { Controller, Get } from '@nestjs/common';
import { DiaSemanaService } from './dia-semana.service';

@Controller('dias') // <- el que usa el frontend
export class DiasController {
  constructor(private readonly diaService: DiaSemanaService) {}

  @Get()
  getAll() {
    return this.diaService.findAll(); // o puedes mapear DTOs si deseas
  }
}
