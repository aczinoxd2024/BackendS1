import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { MembresiasService } from './membresias.service';
import { Membresia } from './membresia.entity';

@Controller('membresias')
export class MembresiasController {
  constructor(private readonly membresiasService: MembresiasService) {}

  @Post()
  async create(@Body() membresia: Membresia): Promise<Membresia> {
    return this.membresiasService.create(membresia);
  }

  @Get()
  async findAll(): Promise<Membresia[]> {
    return this.membresiasService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Membresia> {
    return this.membresiasService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() membresia: Membresia,
  ): Promise<Membresia> {
    return this.membresiasService.update(id, membresia);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.membresiasService.remove(id);
  }

  // ✅ NUEVA RUTA: Asignar membresía a cliente (Recepcionista)
  @Post('asignar')
  async asignarMembresia(
    @Body()
    data: {
      clienteCi: string;
      tipoMembresiaId: number;
      fechaInicio: Date;
    },
  ) {
    return await this.membresiasService.asignarMembresia(data);
  }
}
