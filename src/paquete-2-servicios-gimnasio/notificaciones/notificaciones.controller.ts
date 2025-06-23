import { Roles } from './../../paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { JwtAuthGuard } from '@auth/jwt.auth.guard';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get('alertas')
  @UseGuards(JwtAuthGuard) // Proteger el endpoint
  async sendMembershipExpirationAlerts(
    @Query('dias') diasBeforeExpiration: number = 3,
  ) {
    const results =
      await this.notificacionesService.sendMembershipExpirationAlerts(
        diasBeforeExpiration,
      );
    // Devolver los resultados detallados como JSON
    return {
      message: 'Proceso de envío de alertas completado.',
      details: results,
    };
  }

  @Post('promocional')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador')
  async sendPromotionalEmail(
    @Body('subject') subject: string,
    @Body('htmlContent') htmlContent: string,
  ) {
    const results = await this.notificacionesService.sendPromotionalEmail(
      subject,
      htmlContent,
    );
    // Devolver los resultados detallados como JSON
    return {
      message: 'Proceso de envío de correos promocionales completado.',
      details: results,
    };
  }

  @Get('listar-vencimientos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista') // Asegura que solo los recepcionistas puedan acceder
  async obtenerMembresiasProximasAVencer() {
    return this.notificacionesService.obtenerMembresiasProximasAVencer();
  }

  @Post('notificar-vencimientos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista')
  async notificarVencimientos() {
    const results =
      await this.notificacionesService.sendMembershipExpirationAlerts(3);
    // Devolver los resultados detallados como JSON
    return {
      message: 'Notificaciones de vencimiento enviadas.',
      details: results,
    };
  }
}
