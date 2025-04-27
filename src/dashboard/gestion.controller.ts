import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';

@UseGuards(RolesGuard)
@Controller('gestion')
export class GestionController {
  @Roles('Administrador', 'Recepcionista') // 🔥 Permite MULTIPLES ROLES
  @Get('dashboard')
  getDashboard() {
    return 'Bienvenido a Gestión: Administrador o Recepcionista 📋👑';
  }
}
