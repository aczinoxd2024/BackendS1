import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SeguimientoClienteService } from './seguimiento-cliente.service';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@auth/roles/roles.guard';
import { Roles } from '@auth/roles/roles.decorator';

@Controller('seguimiento')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Protege todos los endpoints con JWT + Roles
export class SeguimientoClienteController {
  constructor(private readonly service: SeguimientoClienteService) {}

  // Crear seguimiento (solo INSTRUCTOR)
  @Post()
  @Roles('Instructor')
  async crearSeguimiento(@Body() dto: CreateSeguimientoDto, @Req() req) {
    const ciInstructor = req.user.ci;
    dto.ciInstructor = ciInstructor;
    return this.service.registrarSeguimiento(dto);
  }

  // Cliente puede ver su historial
  @Get('cliente/:ci')
  @Roles('Cliente', 'Instructor') // Instructor también puede ver de cualquier cliente
  historial(@Param('ci') ci: string) {
    return this.service.obtenerHistorialCliente(ci);
  }

  // Instructor puede obtener uno por CI + fecha
  @Get('cliente/:ci/:fecha')
  @Roles('Cliente', 'Instructor')
  obtenerPorFecha(
    @Param('ci') ci: string,
    @Param('fecha') fecha: string,
  ) {
    return this.service.obtenerPorClienteYFecha(ci, fecha);
  }

  // Actualizar seguimiento por CI + fecha
@Put('cliente/:ci/:fecha')
@Roles('Instructor')
actualizarPorFecha(
  @Param('ci') ci: string,
  @Param('fecha') fecha: string,
  @Body() dto: CreateSeguimientoDto,
) {
  return this.service.actualizarSeguimiento(ci, fecha, dto); // 
}


  // Eliminar seguimiento por CI + fecha
  @Delete('cliente/:ci/:fecha')
  @Roles('Instructor')
  eliminarPorFecha(
    @Param('ci') ci: string,
    @Param('fecha') fecha: string,
  ) {
    return this.service.eliminarSeguimiento(ci, fecha);
  }
}
