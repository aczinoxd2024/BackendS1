import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { JwtAuthGuard } from './jwt.auth.guard';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔐 Inicio de sesión
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    return this.authService.logout(req);
  }

  // 🔁 Solicitar recuperación de contraseña
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  // 🔐 Cambiar la contraseña con token (desde email)
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.resetPassword(resetPasswordDto, req);
  }

  // 🔐 Cambiar contraseña desde perfil (requiere estar logueado)
  @UseGuards(JwtAuthGuard)
  @Post('cambiar-password')
  async cambiarPassword(
    @Body() body: CambiarPasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.cambiarPasswordDesdePerfil(body, req);
  }
}
