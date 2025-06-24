import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PromocionService } from './promocion.service';
import { Promocion } from './promocion.entity';

@Controller('promociones-crud')
export class PromocionController {
  constructor(private readonly promocionService: PromocionService) {}

  // ✅ Primero rutas específicas
  @Get('clientes-vigentes')
  getClientesVigentes() {
    // esto si tuvieras lógica aquí o lo delegas al PromocionesService
  }

  @Get()
  getAll(): Promise<Promocion[]> {
    return this.promocionService.obtenerTodas();
  }

  // ⚠️ Esta ruta genérica debe ir al final
  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<Promocion | null> {
    return this.promocionService.obtenerPorId(id);
  }
}
