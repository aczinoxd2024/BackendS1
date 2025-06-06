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
import { Response } from 'express';

import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';

@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  // ───────────────────────────────────────────────
  // 🔹 1. Registro de Asistencia
  // ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente') // solo roles autorizados
  @Post('registrar')
  async registrarAsistencia(@Request() req) {
    console.log('Usuario en token:', req.user);
    const ci = req.user.ci; // o el campo que tenga el CI en tu token JWT
    return this.asistenciaService.registrarAsistencia(ci);
  }
  // ───────────────────────────────────────────────
  // 🔹 2. Consulta General
  // ───────────────────────────────────────────────

  @Get()
  findAll() {
    return this.asistenciaService.findAll();
  }

  // ───────────────────────────────────────────────
  // 🔹 3.MI- Historial (protegido)
  // ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('mi-historial')
  @Roles('cliente')
  async getMiHistorial(@Request() req) {
  const ci = req.user.ci; // CI extraído del token del cliente
  return this.asistenciaService.findByCIPersona(ci);
  }
  // ───────────────────────────────────────────────
  // 🔹 3. Historial por CI (protegido)
  // ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('historial/:ci')
  @Roles('administrador', 'recepcionista', 'cliente')
  async getHistorialCliente(@Param('ci') ci: string, @Request() req) {
    const rol = req.user.rol;
    const correo = req.user.correo;

    if (rol === 'cliente' && correo !== ci) {
      throw new ForbiddenException('No autorizado para ver este historial');
    }

    return this.asistenciaService.findByCIPersona(ci);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('hoy')
  @Roles('recepcionista')
  async getAsistenciasDelDia() {
  const hoy = new Date();
  return this.asistenciaService.findAsistenciasPorDia(hoy);
} 
  // ───────────────────────────────────────────────
  // 🔹 4. Estadísticas
  // ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('estadisticas/por-cliente')
  @Roles('administrador', 'recepcionista')
  async asistenciasPorCliente() {
    return await this.asistenciaService.asistenciasPorCliente();
  }

  // ───────────────────────────────────────────────
  // 🔹 5. Exportar Historial Cliente (Excel y PDF)
  // ───────────────────────────────────────────────

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('historial/exportar/pdf/:ci')
  @Roles('administrador', 'recepcionista', 'cliente')
  async exportarHistorialPDF(
    @Param('ci') ci: string,
    @Request() req,
    @Res() res: Response,
  ) {
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

  // ───────────────────────────────────────────────
  // 🔹 6. Exportar Historial General
  // ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('historial/exportar/pdf/todos')
  @Roles('administrador', 'recepcionista')
  async exportarHistorialPDFTodos(@Res() res: Response) {
    try {
      const pdfBuffer = await this.asistenciaService.generarHistorialPDFTodos();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=historial_todos.pdf',
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).json({ message: 'Error al generar el PDF' });
    }
  }
}