import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { User } from 'src/auth/user.decorator';

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
