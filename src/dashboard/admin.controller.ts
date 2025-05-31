import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { User } from 'paquete-1-usuarios-accesos/auth/user.decorator';

@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  @Roles('administrador') // ⚠️ Asegúrate de que así esté escrito en la BD
  @Get('inicio')
  inicioAdmin(@User() user: any) {
    return {
      mensaje: 'Acceso autorizado para administrador 👨‍💼',
      usuario: user,
    };
  }
}
