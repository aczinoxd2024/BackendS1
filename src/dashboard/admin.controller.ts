import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';

@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  @Roles('Administrador')
  @Get('dashboard')
  getDashboard() {
    return 'Bienvenido Administrador 👑';
  }
}
