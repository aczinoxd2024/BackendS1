import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ClasesService } from './clases.service';
import { Clase } from './clase.entity';

@Controller('clases')
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Post()
  create(@Body() clase: Clase): Promise<Clase> {
    return this.clasesService.create(clase);
  }

  @Get()
  findAll(): Promise<Clase[]> {
    return this.clasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Clase> {
    return this.clasesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() clase: Clase): Promise<Clase> {
    return this.clasesService.update(id, clase);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.clasesService.remove(id);
  }
}
