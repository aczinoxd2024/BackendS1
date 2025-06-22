import { Membresia } from 'paquete-3-control-comercial/membresias/membresia.entity';
import { MembresiasService } from '../paquete-3-control-comercial/membresias/membresias.service';
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';

@Controller('membresias')
export class MembresiasController {
  constructor(private readonly MembresiasService: MembresiasService) {}

  
  @Post()
  async create(@Body() membresia: Membresia): Promise<Membresia> {
    return this.MembresiasService.create(membresia);
  }

  @Get()
  async findAll(): Promise<Membresia[]> {
    return this.MembresiasService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Membresia> {
    return this.MembresiasService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() membresia: Membresia,
  ): Promise<Membresia> {
    return this.MembresiasService.update(id, membresia);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.MembresiasService.remove(id);
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
    return await this.MembresiasService.asignarMembresia(data);
  }
}
