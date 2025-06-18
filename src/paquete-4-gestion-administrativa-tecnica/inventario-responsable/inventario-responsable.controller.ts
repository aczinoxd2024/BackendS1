import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { InventarioResponsableService } from './inventario-responsable.service';
import { CrearResponsableDto } from './inventario-responsable.dto';
import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';


@Controller('inventario-responsable')
export class InventarioResponsableController {
  constructor(private readonly service: InventarioResponsableService) {}

  @Post()
asignar(@Body() dto: CrearResponsableDto) {
  console.log('DTO recibido:', dto);
  return this.service.asignar(dto);
}
  @Get()
  listar() {
    return this.service.listar();
  }
 @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador','recepcionista') // solo roles autorizados
  @Get(':ci')
  getPorResponsable(@Param('ci') ci: string) {
    return this.service.obtenerPorResponsable(ci);
  }
@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador','recepcionista') // solo roles autorizados
  @Delete(':ci/:idItem')
  eliminarAsignacion(
    @Param('ci') ci: string,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.service.eliminarResponsabilidad(ci, idItem);
  }
@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador','recepcionista') // solo roles autorizados
  @Get('validar/:ci')
  validarAsignaciones(@Param('ci') ci: string) {
    return this.service.validarCantidad(ci);
  }
}