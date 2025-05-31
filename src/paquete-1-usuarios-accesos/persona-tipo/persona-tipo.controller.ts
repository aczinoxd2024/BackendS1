import { Controller, Get, Post, Body } from '@nestjs/common';
import { PersonaTipoService } from './persona-tipo.service';
import { PersonaTipo } from './persona-tipo.entity';

@Controller('persona-tipo')
export class PersonaTipoController {
  constructor(private readonly personaTipoService: PersonaTipoService) {}

  @Post()
  assign(@Body() personaTipo: PersonaTipo): Promise<PersonaTipo> {
    return this.personaTipoService.assign(personaTipo);
  }

  @Get()
  findAll(): Promise<PersonaTipo[]> {
    return this.personaTipoService.findAll();
  }
}
