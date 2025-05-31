// ../paquete-1-usuarios-accesos/auth/dto/cambiar-password.dto.ts
import { IsString, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  passwordActual: string;

  @IsString()
  @MinLength(6)
  nuevaContrasena: string;

  @IsString()
  @MinLength(6)
  confirmarContrasena: string;
}
