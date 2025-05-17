import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { Reserva } from './reserva.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { Request } from 'express';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Query } from '@nestjs/common';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @Roles('cliente')
  async crearReserva(@Req() req: Request, @Body() dto: CreateReservaDto) {
    const ci = (req.user as any)?.ci;
    if (!ci) throw new UnauthorizedException('Cliente no identificado');
    return this.reservasService.crearReserva(dto.IDClase, ci);
  }

  @Get('mis-reservas') // ✅ esta ruta debe ir antes que ':id'
  @Roles('cliente')
  async getMisReservas(@Req() req: Request) {
    const ci = (req.user as any)?.ci;
    if (!ci) throw new UnauthorizedException('Cliente no identificado');
    return this.reservasService.buscarPorCliente(ci);
  }

  @Get('cliente/:ci')
@Roles('recepcionista', 'administrador')
getReservasPorCliente(
  @Param('ci') ci: string,
  @Query('estado') estado?: string
) {
  return this.reservasService.buscarPorCICliente(ci, estado);
}

  @Get()
  @Roles('administrador', 'recepcionista')
  findAll(): Promise<Reserva[]> {
    return this.reservasService.findAll();
  }

  @Get(':id')
  @Roles('administrador', 'recepcionista')
  findOne(@Param('id') id: number): Promise<Reserva> {
    return this.reservasService.findOne(id);
  }

  @Delete(':id')
  @Roles('cliente', 'recepcionista', 'administrador')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.reservasService.remove(id);
    return { message: `Reserva con ID ${id} eliminada correctamente` };
  }
}
