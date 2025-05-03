import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { UserRequest } from '../auth/user-request.interface';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Request } from 'express';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // ✅ Crear cliente desde el panel (RECEPCIONISTA / ADMINISTRADOR)
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
      tipoMembresiaId: number;
      metodoPagoId: number;
    },
    @Req() req: UserRequest,
  ) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';

    return this.clientesService.create(data, req.user.rol, idUsuario, ip);
  }

  // ✅ Listar todos los clientes (Ruta pública o protegida según definas luego)
  @Get()
  async findAll() {
    return this.clientesService.findAll();
  }

  // ✅ Adquirir membresía desde la web (Ruta pública SIN autenticación)
  @Post('adquirir')
  async adquirirMembresia(
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
      tipoMembresiaId: number;
      metodoPagoId: number;
    },
    @Req() req: Request,
  ) {
    const ip = req.ip ?? 'desconocido';

    // 👇 Ejecutar servicio que gestiona esta adquisición pública
    return this.clientesService.adquirirMembresia(data, ip);
  }
}
