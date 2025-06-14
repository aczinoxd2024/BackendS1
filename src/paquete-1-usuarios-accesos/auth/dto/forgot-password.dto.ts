// ../paquete-1-usuarios-accesos/auth/dto/forgot-password.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
