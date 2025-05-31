import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { User } from 'paquete-1-usuarios-accesos/auth/user.decorator';

@UseGuards(RolesGuard)
@Controller('cliente')
export class ClienteController {
  @Roles('cliente')
  @Get('inicio')
  inicioCliente(@User() user: any) {
    return {
      mensaje: 'Acceso autorizado para cliente 🧑‍💻',
      usuario: user, // Incluye id, correo y rol del token
    };
  }
}
