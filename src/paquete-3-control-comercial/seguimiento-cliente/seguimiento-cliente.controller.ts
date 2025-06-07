import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Put,
  Delete,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { SeguimientoClienteService } from './seguimiento-cliente.service';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';


@Controller('seguimiento')
export class SeguimientoClienteController {
  constructor(private readonly service: SeguimientoClienteService) {}

  @Post()
  registrar(@Body() dto: CreateSeguimientoDto) {
    return this.service.registrarSeguimiento(dto);
  }

  @Get('cliente/:ci')
  historial(@Param('ci') ci: string) {
    return this.service.obtenerHistorialCliente(ci);
  }

  @Get('cliente/:ci/ultimo')
  ultimo(@Param('ci') ci: string) {
    return this.service.obtenerUltimoSeguimiento(ci);
  }

  @Get(':ci/:fecha')
  obtenerUno(@Param('ci') ci: string, @Param('fecha') fecha: string) {
    return this.service.obtenerPorClienteYFecha(ci, fecha);
  }

  @Put(':ci/:fecha')
  actualizar(
    @Param('ci') ci: string,
    @Param('fecha') fecha: string,
    @Body() dto: CreateSeguimientoDto,
  ) {
    return this.service.actualizarSeguimiento(ci, fecha, dto);
  }

  @Delete(':ci/:fecha')
  eliminar(@Param('ci') ci: string, @Param('fecha') fecha: string) {
    return this.service.eliminarSeguimiento(ci, fecha);
  }
}
