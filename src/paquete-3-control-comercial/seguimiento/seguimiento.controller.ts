import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SeguimientoService } from './seguimiento.service';
import { CrearSeguimientoDto } from './crear-seguimiento.dto';

@Controller('seguimiento')
export class SeguimientoController {
  constructor(private readonly seguimientoService: SeguimientoService) {}

  @Post()
  crear(@Body() dto: CrearSeguimientoDto) {
    return this.seguimientoService.crear(dto);
  }

  @Get(':idCliente')
  obtener(@Param('idCliente') id: string) {
    return this.seguimientoService.obtenerPorCliente(id);
  }
}
