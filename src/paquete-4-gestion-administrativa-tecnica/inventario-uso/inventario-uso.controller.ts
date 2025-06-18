import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Query, 
  Param, 
  ParseIntPipe 
} from '@nestjs/common';
import { InventarioUsoService } from './inventario-uso.service';
import { CrearInventarioUsoDto } from './inventario-uso.dto';
import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';

@Controller('inventario-uso')
export class InventarioUsoController {
  constructor(private readonly service: InventarioUsoService) {}

  @Post()
  crear(@Body() dto: CrearInventarioUsoDto) {
    return this.service.crear(dto);
  }

  @Get()
  listar() {
    return this.service.listar();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador','recepcionista') // solo roles autorizados
  @Get('filtrar')
  filtrarUso(
    @Query('tipoDestino') tipoDestino?: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.service.filtrar(tipoDestino, fecha);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador','recepcionista') // solo roles autorizados
  @Get('item/:idItem')
  getHistorialItem(@Param('idItem', ParseIntPipe) idItem: number) {
    return this.service.obtenerHistorialPorItem(idItem);
  }
}