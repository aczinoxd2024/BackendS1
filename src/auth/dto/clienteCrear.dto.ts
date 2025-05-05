export class ClienteCrearDto {
  ci: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  telefono: string;
  direccion: string;
  observacion?: string;
  correo: string;
  tipoMembresiaId: number;
  metodoPagoId: number;
}
