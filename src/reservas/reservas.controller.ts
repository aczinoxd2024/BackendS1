import {Controller,Post,Get,Put,Delete,Param,Body,Req,UnauthorizedException,UseGuards,Query,Patch,} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { Reserva } from './reserva.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { Request } from 'express';
import { Roles } from 'src/auth/roles/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

 @Post()
@Roles('cliente', 'administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
async crearReserva(@Req() req: Request, @Body() dto: CreateReservaDto) {
  const ci = (req.user as any)?.ci;
  if (!ci) throw new UnauthorizedException('Cliente no identificado');
  return this.reservasService.crearReserva(dto.IDClase, ci);
}

  @Get('mis-reservas')
  @Roles('cliente')
  async getMisReservas(@Req() req: Request) {
    const ci = (req.user as any)?.ci;
    if (!ci) throw new UnauthorizedException('Cliente no identificado');
    return this.reservasService.buscarPorCliente(ci);
  }

  @Get('mis-reservas-pasadas')
  @Roles('cliente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getReservasPasadas(
    @Req() req: Request,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const ci = (req.user as any)?.ci;
    if (!ci) throw new UnauthorizedException('Cliente no identificado');
    return this.reservasService.getReservasPasadas(ci, fechaInicio, fechaFin);
  }

  @Get('cliente/:ci')
  @Roles('recepcionista', 'administrador')
  async getReservasPorCliente(
    @Param('ci') ci: string,
    @Query('estado') estado?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.reservasService.buscarPorCICliente(
      ci,
      estado,
      fechaInicio,
      fechaFin,
    );
  }
  @Get('filtradas')
@Roles('recepcionista', 'administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
async getReservasFiltradas(
  @Query('ci') ci?: string,
  @Query('estado') estado?: string,
  @Query('fechaInicio') fechaInicio?: string,
  @Query('fechaFin') fechaFin?: string,
) {
  return this.reservasService.buscarPorFiltros(ci, estado, fechaInicio, fechaFin);
}
@Get('historial')
@Roles('cliente','recepcionista')
@UseGuards(JwtAuthGuard, RolesGuard)
async getHistorialReservas(
  @Req() req: Request,
  @Query('fechaInicio') fechaInicio?: string,
  @Query('fechaFin') fechaFin?: string,
) {
  const ci = (req.user as any)?.ci;
  if (!ci) throw new UnauthorizedException('Cliente no identificado');
  return this.reservasService.getReservasPasadas(ci, fechaInicio, fechaFin);
}



  @Get()
  @Roles('administrador', 'recepcionista')
  findAll(): Promise<Reserva[]> {
    return this.reservasService.findAll();
  }

  @Get(':id')
  @Roles('administrador', 'recepcionista')
  findOne(@Param('id') id: number): Promise<Reserva> {
    return this.reservasService.findOne(id);
  }
  // ✅ Cliente cancela su propia reserva
@Put('cancelar/:id')
@Roles('cliente')
@UseGuards(JwtAuthGuard, RolesGuard)
async cancelarReservaCliente(
  @Param('id') id: number,
  @Req() req: Request
): Promise<{ message: string }> {
  const ci = (req.user as any)?.ci;
  if (!ci) throw new UnauthorizedException('Cliente no identificado');
  await this.reservasService.cancelarReservaCliente(id, ci);
  return { message: 'Reserva cancelada correctamente' };
}


  @Delete(':id')
  @Roles('cliente', 'recepcionista', 'administrador')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.reservasService.remove(id);
    return { message: `Reserva con ID ${id} eliminada correctamente` };
  }

  @Patch(':id/cancelar')
  @Roles('recepcionista', 'administrador')
  async cancelarReserva(@Param('id') id: number): Promise<{ message: string }> {
    await this.reservasService.cancelarReserva(id);
    return { message: 'Reserva cancelada correctamente' };
  }
}
