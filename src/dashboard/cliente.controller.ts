import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { User } from 'src/auth/user.decorator';

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
