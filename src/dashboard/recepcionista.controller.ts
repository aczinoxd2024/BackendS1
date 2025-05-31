import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { RolesGuard } from 'src/paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { User } from 'src/paquete-1-usuarios-accesos/auth/user.decorator';

@UseGuards(RolesGuard)
@Controller('recepcionista')
export class RecepcionistaController {
  @Roles('recepcionista')
  @Get('inicio')
  inicioRecepcionista(@User() user: any) {
    return {
      mensaje: 'Acceso autorizado para recepcionista 📋',
      usuario: user,
    };
  }
}
