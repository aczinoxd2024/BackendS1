import { IsNotEmpty, IsString } from 'class-validator';

export class AsistenciaEscanearDto {
  @IsNotEmpty({ message: 'El CI no puede estar vacío' })
  @IsString({ message: 'El CI debe ser una cadena de texto' })
  ci: string;
}
