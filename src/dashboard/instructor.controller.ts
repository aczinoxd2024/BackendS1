import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';

@UseGuards(RolesGuard)
@Controller('instructor')
export class InstructorController {
  @Roles('Instructor')
  @Get('dashboard')
  getDashboard() {
    return 'Bienvenido Instructor 🏋️';
  }
}
