import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { Roles } from '@auth/roles/roles.decorator';
import { JwtAuthGuard } from '@auth/jwt.auth.guard';
import { RolesGuard } from '@auth/roles/roles.guard';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  // 👉 GET /notificaciones/alertas?dias=3
  @Get('alertas')
  async enviarAlertas(@Query('dias') dias: string): Promise<string> {
    const cantidadDias = parseInt(dias, 10) || 3;
    return this.notificacionesService.sendMembershipExpirationAlerts(
      cantidadDias,
    );
  }

  // 👉 POST /notificaciones/promocional
  @Post('promocional')
  async enviarCorreoPromocional(
    @Body() body: { asunto: string; contenidoHTML: string },
  ): Promise<string> {
    return this.notificacionesService.sendPromotionalEmail(
      body.asunto,
      body.contenidoHTML,
    );
  }
  @Get('listar-vencimientos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista')
  async listarVencimientos() {
    return this.notificacionesService.obtenerMembresiasProximasAVencer();
  }
  @Post('notificar-vencimientos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista')
  async notificar() {
    return this.notificacionesService.sendMembershipExpirationAlerts(3);
  }
}
