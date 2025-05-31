import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  password: string; // ✅ Cambiado a password

  @IsString()
  @IsNotEmpty()
  rol: string; // ✅ Cambiado a rol
}
