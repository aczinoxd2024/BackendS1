import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PromocionService } from './promocion.service';
import { Promocion } from './promocion.entity';

@Controller('promociones')
export class PromocionController {
  constructor(private readonly promocionService: PromocionService) {}

  @Get()
  getAll(): Promise<Promocion[]> {
    return this.promocionService.obtenerTodas();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<Promocion | null> {
    return this.promocionService.obtenerPorId(id);
  }
}
