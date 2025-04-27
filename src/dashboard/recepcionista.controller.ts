import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
// ✅ corregido

@UseGuards(RolesGuard)
@Controller('recepcionista')
export class RecepcionistaController {
  @Roles('Recepcionista')
  @Get('dashboard')
  getDashboard() {
    return 'Bienvenido Recepcionista 🧾';
  }
}
