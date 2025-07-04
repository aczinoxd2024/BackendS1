import { Controller, Get } from '@nestjs/common';
import { DiaSemanaService } from './dia-semana.service';

@Controller('dias-semana') // <--- ¡CAMBIA 'dias-semana' a 'dias' aquí!
export class DiaSemanaController {
  constructor(private readonly diaService: DiaSemanaService) {}

  @Get()
  getAll() {
    return this.diaService.findAll();
  }
}
