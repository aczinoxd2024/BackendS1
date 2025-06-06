import { Controller, Get, Post, Body } from '@nestjs/common';
import { TipoPersonaService } from './tipo-persona.service';
import { TipoPersona } from './tipo-persona.entity';

@Controller('tipo-persona')
export class TipoPersonaController {
  constructor(private readonly tipoPersonaService: TipoPersonaService) {}

  @Post()
  create(@Body() tipo: TipoPersona): Promise<TipoPersona> {
    return this.tipoPersonaService.create(tipo);
  }

  @Get()
  findAll(): Promise<TipoPersona[]> {
    return this.tipoPersonaService.findAll();
  }
}
