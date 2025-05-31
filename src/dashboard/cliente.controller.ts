import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { RolesGuard } from 'src/paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { User } from 'src/paquete-1-usuarios-accesos/auth/user.decorator';

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
