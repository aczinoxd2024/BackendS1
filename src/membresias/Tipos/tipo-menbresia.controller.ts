import { Controller, Get } from '@nestjs/common';
import { TipoMembresiaService } from './tipo-menbresia.service';
import { TipoMembresia } from './menbresia.entity';

@Controller('tipos-membresia')
export class TipoMembresiaController {
  constructor(private readonly tipoMembresiaService: TipoMembresiaService) {}
  
  // Endpoint GET /tipos-membresia
  @Get()
  obtenerTipos() {
    return this.tipoMembresiaService.obtenerTipos();
  }
}
