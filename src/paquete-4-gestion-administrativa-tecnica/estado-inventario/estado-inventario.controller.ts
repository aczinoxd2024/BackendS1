import { Controller, Get } from '@nestjs/common';
import { EstadoInventarioService } from './estado-inventario.service';

@Controller('estado-inventario')
export class EstadoInventarioController {
  constructor(private readonly estadoService: EstadoInventarioService) {}

  @Get()
  findAll() {
    return this.estadoService.findAll();
  }
}
