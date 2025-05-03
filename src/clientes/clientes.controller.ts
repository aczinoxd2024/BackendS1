import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { UserRequest } from '../auth/user-request.interface';
import { Roles } from 'src/auth/roles/roles.decorator';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // ✅ Ruta protegida para crear clientes
  @Roles('recepcionista', 'administrador')
  @Post()
  async createCliente(
    @Body()
    data: {
      ci: string;
      nombre: string;
      apellido: string;
      fechaNacimiento: Date;
      telefono: string;
      direccion: string;
      observacion: string;
      correo: string;
      tipoMembresiaId: number; // 👈 CORREGIDO
    },
    @Req() req: UserRequest,
  ) {
    // ✅ Validar datos del usuario que hace la petición
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';

    return await this.clientesService.create(data, req.user.rol, idUsuario, ip);
  }

  // ✅ Ruta para listar todos los clientes
  @Get()
  async findAll() {
    return this.clientesService.findAll();
  }
}
