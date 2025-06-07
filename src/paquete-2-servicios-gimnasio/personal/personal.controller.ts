import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PersonalService } from './personal.service';
import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { UserRequest } from 'paquete-1-usuarios-accesos/auth/user-request.interface';
import { AsistenciaEscanearDto } from 'paquete-1-usuarios-accesos/auth/dto/asistencia-escanear.dto';

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

  // ✅ 4. Registrar asistencia desde cámara (solo recepcionista)
  @Post('asistencia-escanear')
  @Roles('recepcionista')
  registrarAsistenciaQR(@Body() dto: AsistenciaEscanearDto) {
    return this.personalService.registrarAsistenciaDesdeQR(dto.ci);
  }
}
