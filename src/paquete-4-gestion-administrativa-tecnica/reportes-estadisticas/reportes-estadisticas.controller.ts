import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesEstadisticasService } from './reportes-estadisticas.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@auth/roles/roles.guard';
import { Roles } from '@auth/roles/roles.decorator';



@Controller('reportes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportesEstadisticasController {
  constructor(
    private readonly service: ReportesEstadisticasService,
    
    
  ) { }

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


  @Get('asistencias-personal')
  @Roles('Administrador')
  async obtenerAsistenciasPorCargo(
    @Query('cargo') cargo: string,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
  ) {
    if (!cargo || !inicio || !fin) {
      throw new BadRequestException(
        'Debe proporcionar cargo, inicio y fin como parámetros',
      );
    }

   return this.service.obtenerAsistenciasPorCargo(cargo, inicio, fin);

  }

@Get('clases/reporte')
@Roles('Administrador')
@UseGuards(AuthGuard('jwt'), RolesGuard)
async obtenerReporteClases(@Query('instructor') nombreInstructor?: string) {
  return this.service.generarReporteClases(nombreInstructor);
}

@Get('clases/activas')
@Roles('Administrador')
async obtenerClasesActivas() {
  return this.service.obtenerClasesActivas();
}


@Get('reservas/clases')
@Roles('Administrador', 'Recepcionista')
@UseGuards(AuthGuard('jwt'), RolesGuard)
obtenerReporteReservasClases(
  @Query('inicio') inicio?: string,
  @Query('fin') fin?: string,
) {
  return this.service.generarReporteReservasClases(inicio, fin);
}

@Get('instructores-desde-clases')
@Roles('Administrador')
async obtenerInstructoresDesdeClases() {
  return this.service.obtenerNombresInstructoresUnicos();
}


}