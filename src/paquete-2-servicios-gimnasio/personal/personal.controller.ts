import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { PersonalService } from './personal.service';
import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { UserRequest } from 'paquete-1-usuarios-accesos/auth/user-request.interface';
import { AsistenciaEscanearDto } from 'paquete-1-usuarios-accesos/auth/dto/asistencia-escanear.dto';
import { Request } from 'express';

@Controller('personal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PersonalController {
  constructor(private readonly personalService: PersonalService) {}

  // ✅ 1. Ver todos (solo administrador)
  @Get()
  @Roles('administrador')
  getAll() {
    return this.personalService.findAll();
  }

  // ✅ 2. Ver uno por CI (solo administrador)
  @Get(':ci')
  @Roles('administrador')
  getByCi(@Param('ci') ci: string) {
    return this.personalService.findOne(ci);
  }

  // ✅ 3. Tarjeta virtual del personal logueado (recepcionista/instructor)
  @Get('tarjeta/info')
  @Roles('recepcionista', 'instructor')
  obtenerTarjeta(@Req() req: UserRequest) {
    const ci = req.user.ci;
    return this.personalService.generarTarjetaPersonal(ci);
  }

  @Post('asistencia-escanear')
  @Roles('recepcionista', 'instructor')
  registrarAsistenciaQR(
    @Body() dto: AsistenciaEscanearDto,
    @Req() req: UserRequest,
  ) {
    const ciResponsable = req.user?.ci;
    if (!ciResponsable) {
      throw new UnauthorizedException(
        'No se pudo obtener el CI del responsable',
      );
    }

    const ip = req.ip || '127.0.0.1';
    return this.personalService.registrarAsistenciaDesdeQR(
      dto.ci,
      ciResponsable,
      ip,
    );
  }

  // ✅ Registrar salida del personal
  @Post('asistencia-salida')
  @Roles('recepcionista', 'instructor')
  registrarSalidaQR(
    @Body() dto: AsistenciaEscanearDto,
    @Req() req: UserRequest,
  ) {
    const ciResponsable = req.user?.ci;
    if (!ciResponsable) {
      throw new UnauthorizedException(
        'No se pudo obtener el CI del responsable',
      );
    }

    const ip = req.ip || '127.0.0.1';
    return this.personalService.registrarSalida(dto.ci, ciResponsable, ip);
  }
  @Get('test/zonahoraria')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador')
  testHoraBolivia() {
    return this.personalService.probarZonaHoraria();
  }

  // ✅ Consultar asistencias por CI (administrador o recepcionista)
  @Get(':ci/asistencias')
  @Roles('administrador', 'recepcionista')
  obtenerAsistencias(@Param('ci') ci: string) {
    return this.personalService.obtenerAsistenciasDelPersonal(ci);
  }
  // ✅ Obtener asistencias del día actual (rol administrador o recepcionista)
  @Get('asistencias/hoy')
  @Roles('administrador', 'recepcionista')
  obtenerAsistenciasHoy() {
    return this.personalService.obtenerAsistenciasDelDia();
  }
}
