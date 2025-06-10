import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards
} from '@nestjs/common';
import { RutinasService } from './rutinas.service';
import { CreateRutinaDto } from './dto/create-rutina.dto';
import { UpdateRutinaDto } from './dto/update-rutina.dto';
import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { Request } from 'express';

@Controller('api/rutinas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RutinasController {
  constructor(private readonly rutinasService: RutinasService) {}

  @Post()
  @Roles('Instructor')
  create(@Body() dto: CreateRutinaDto, @Req() req: Request) {
    return this.rutinasService.create(dto, req);
  }

  @Get()
  @Roles('Administrador', 'Instructor', 'Cliente', 'Recepcionista')
  findAll() {
    return this.rutinasService.findAll();
  }

  @Get('mi-rutina/:ci')
  @Roles('Cliente')
  obtenerRutinasPermitidas(@Param('ci') ci: string) {
    return this.rutinasService.obtenerRutinasPermitidas(ci);
  }

  @Get(':id')
  @Roles('Administrador', 'Instructor', 'Cliente', 'Recepcionista')
  findOne(@Param('id') id: number) {
    return this.rutinasService.findOne(id);
  }

  @Put(':id')
  @Roles('Instructor')
  update(@Param('id') id: number, @Body() dto: UpdateRutinaDto, @Req() req: Request) {
    return this.rutinasService.update(id, dto, req);
  }

  @Delete(':id')
  @Roles('Instructor')
  remove(@Param('id') id: number, @Req() req: Request) {
    return this.rutinasService.remove(id, req);
  }

  @Put(':id/reactivar')
  @Roles('Instructor')
  reactivar(@Param('id') id: number, @Req() req: Request) {
    return this.rutinasService.reactivarRutina(id, req);
  }

  @Post(':id/detalle')
  @Roles('Instructor')
  agregarDetalle(@Param('id') id: number, @Body() body, @Req() req: Request) {
    return this.rutinasService.agregarDetalleARutina(id, body, req);
  }

  @Delete(':idRutina/detalle/:idDetalle')
  @Roles('Instructor')
  eliminarDetalle(
    @Param('idRutina') idRutina: number,
    @Param('idDetalle') idDetalle: number,
    @Req() req: Request
  ) {
    return this.rutinasService.eliminarDetalle(idRutina, idDetalle, req);
  }

  @Put(':id/asignar/:ciCliente')
  @Roles('Instructor')
  asignarPersonalizada(
    @Param('id') id: number,
    @Param('ciCliente') ciCliente: string,
    @Req() req: Request
  ) {
    return this.rutinasService.asignarRutinaPersonalizada(id, ciCliente, req);
  }
}
