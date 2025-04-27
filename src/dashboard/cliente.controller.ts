import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';

@UseGuards(RolesGuard)
@Controller('cliente')
export class ClienteController {
  @Roles('Cliente')
  @Get('dashboard')
  getDashboard() {
    return 'Bienvenido Cliente 🧑‍💻';
  }
}
