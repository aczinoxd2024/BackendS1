import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportesEstadisticasService } from './reportes-estadisticas.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@auth/roles/roles.guard';
import { Roles } from '@auth/roles/roles.decorator';

@Controller('reportes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportesEstadisticasController {
  constructor(private readonly service: ReportesEstadisticasService) {}

  @Get('membresias/resumen')
  @Roles('Administrador')
  obtenerResumenMembresias() {
    return this.service.obtenerResumenMembresias();
  }

  @Get('pagos/mensuales')
@Roles('Administrador')
obtenerReportePagosMensuales() {
  return this.service.obtenerReportePagosMensuales();
}


}
