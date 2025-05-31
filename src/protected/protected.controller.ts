import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/paquete-1-usuarios-accesos/auth/jwt.auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedData() {
    return { message: 'This is a protected route' };
  }
}
