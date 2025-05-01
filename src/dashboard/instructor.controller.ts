import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { User } from 'src/auth/user.decorator';

@UseGuards(RolesGuard)
@Controller('instructor')
export class InstructorController {
  @Roles('instructor')
  @Get('inicio')
  inicioInstructor(@User() user: any) {
    return {
      mensaje: 'Acceso autorizado para instructor 🏋️',
      usuario: user,
    };
  }
}
