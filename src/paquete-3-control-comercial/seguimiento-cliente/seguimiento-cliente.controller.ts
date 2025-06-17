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
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SeguimientoClienteController {
  constructor(private readonly service: SeguimientoClienteService) {}

  @Post()
  @Roles('Instructor')
  async crearSeguimiento(@Body() dto: CreateSeguimientoDto, @Req() req) {
    const ciInstructor = req.user.ci;
    dto.ciInstructor = ciInstructor;
    return this.service.registrarSeguimiento(dto);
  }

  @Get('cliente/:ci')
  @Roles('Cliente', 'Instructor')
  historial(@Param('ci') ci: string) {
    return this.service.obtenerHistorialCliente(ci);
  }

  @Get(':id')
  @Roles('Instructor')
  obtenerUno(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Get('cliente/:ci/:fecha')
   @Roles('Cliente', 'Instructor')
  obtenerPorFecha(@Param('ci') ci: string, @Param('fecha') fecha: string) {
    return this.service.obtenerPorClienteYFecha(ci, fecha);
  }

 @Put('cliente/:ci/:fecha')
@Roles('Instructor')
actualizar(
  @Param('ci') ci: string,
  @Param('fecha') fecha: string,
  @Body() dto: CreateSeguimientoDto
) {
  return this.service.actualizarSeguimiento(ci, fecha, dto);
}

@Delete('cliente/:ci/:fecha')
@Roles('Instructor')
eliminar(
  @Param('ci') ci: string,
  @Param('fecha') fecha: string
) {
  return this.service.eliminarSeguimiento(ci, fecha);
}

@Get('clientes/gold')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('instructor') 
listarClientesGold() {
  return this.service.listarClientesConMembresiaGoldActiva();
}


}