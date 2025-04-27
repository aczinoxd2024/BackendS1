import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { Reserva } from './reserva.entity';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  create(@Body() reserva: Reserva): Promise<Reserva> {
    return this.reservasService.create(reserva);
  }

  @Get()
  findAll(): Promise<Reserva[]> {
    return this.reservasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Reserva> {
    return this.reservasService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() reserva: Reserva): Promise<Reserva> {
    return this.reservasService.update(id, reserva);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.reservasService.remove(id);
    return { message: `Reserva con ID ${id} eliminada correctamente` };
  }
}
