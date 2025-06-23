import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { Roles } from './../../paquete-1-usuarios-accesos/auth/roles/roles.decorator';
// Importaciones corregidas para JwtAuthGuard y RolesGuard
import { JwtAuthGuard } from './../../paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from './../../paquete-1-usuarios-accesos/auth/roles/roles.guard';

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
    // CORRECCIÓN: Se añadió 'await' aquí para satisfacer la regla 'require-await' de ESLint
    return await this.notificacionesService.obtenerMembresiasProximasAVencer();
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
