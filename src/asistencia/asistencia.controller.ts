import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Request,
  Res,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { CreateAsistenciaDto } from './create-asistencia.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { Response } from 'express';
import { RolesGuard } from '../auth/roles/roles.guard';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { UpdateHoraSalidaDto } from './update-salida.dto';

@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Post()
  create(@Body() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciaService.create(createAsistenciaDto);
  }

  @Get()
  findAll() {
    return this.asistenciaService.findAll();
  }

  // ✅ Historial protegido
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('historial/:ci')
  @Roles('administrador', 'recepcionista', 'cliente')
  async getHistorialCliente(@Param('ci') ci: string, @Request() req) {
    const rol = req.user.rol;
    const correo = req.user.correo;

    // Si es cliente, solo puede ver su propio historial (ci === correo)
    if (rol === 'cliente' && correo !== ci) {
      throw new ForbiddenException('No autorizado para ver este historial');
    }

    return this.asistenciaService.findByCIPersona(ci);
  }
  //////////////////
  @UseGuards(JwtAuthGuard, RolesGuard)
@Post('salida/:id')
@Roles('administrador', 'recepcionista', 'cliente')
async registrarSalida(
  @Param('id') id: number,
  @Body() dto: UpdateHoraSalidaDto,
  @Request() req,
) {
  const rol = req.user.rol;
  const correo = req.user.correo;
  const asistencia = await this.asistenciaService.registrarSalida(id, dto);


 if (rol === 'cliente' && asistencia.persona?.CI !== correo) {
    throw new ForbiddenException('No autorizado para registrar esta salida');
  }

  return asistencia;
}
@UseGuards(JwtAuthGuard, RolesGuard)
  @Get('estadisticas/total')
  @Roles('administrador', 'recepcionista')
  async totalAsistencias() {
    return {
      total: await this.asistenciaService.contarTotalAsistencias(),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('estadisticas/hoy')
  @Roles('administrador', 'recepcionista')
  async asistenciasHoy() {
    return {
      hoy: await this.asistenciaService.contarAsistenciasHoy(),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('estadisticas/por-cliente')
  @Roles('administrador', 'recepcionista')
  async asistenciasPorCliente() {
    return await this.asistenciaService.asistenciasPorCliente();
  }
///////////////////////////////////excel
  @UseGuards(JwtAuthGuard, RolesGuard)
@Get('historial/exportar/excel/:ci')
@Roles('administrador', 'recepcionista', 'cliente')
async exportarHistorialExcel(
  @Param('ci') ci: string,
  @Request() req,
  @Res({ passthrough: true }) res: Response,
) {
  const rol = req.user.rol;
  const correo = req.user.correo;

  if (rol === 'cliente' && correo !== ci) {
    return res.status(403).json({ message: 'No autorizado para exportar este historial' });
  }

  try {
    const buffer = await this.asistenciaService.generarHistorialExcel(ci);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=historial_${ci}.xlsx`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: 'Error al generar el archivo Excel', error: error.message });
  }
}
  //////////////////////////////////pdf
 @UseGuards(JwtAuthGuard, RolesGuard)
@Get('historial/exportar/pdf/:ci')
@Roles('administrador', 'recepcionista', 'cliente')
async exportarHistorialPDF(@Param('ci') ci: string, @Request() req, @Res() res: Response) {
  const rol = req.user.rol;
  const correo = req.user.correo;

  if (rol === 'cliente' && correo !== ci) {
    return res.status(403).json({ message: 'No autorizado para exportar este historial' });
  }

  try {
    const pdfBuffer = await this.asistenciaService.generarHistorialPDF(ci);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=historial_${ci}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
}
}
