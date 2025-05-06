import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  Delete,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { UserRequest } from '../auth/user-request.interface';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Request } from 'express';
import { ClienteCrearDto } from 'src/auth/dto/clienteCrear.dto';
import { ClienteActualizarDto } from 'src/auth/dto/clienteActualizar.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // ✅ Crear cliente (SOLO Recepcionista / Administrador)
  @Roles('recepcionista', 'administrador')
  @Post()
  async createCliente(@Body() data: ClienteCrearDto, @Req() req: UserRequest) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';

    return this.clientesService.create(data, req.user.rol, idUsuario, ip);
  }

  // ✅ Obtener un cliente por su CI
  @Roles('recepcionista', 'administrador')
  @Get(':ci')
  async obtenerCliente(@Param('ci') ci: string) {
    return this.clientesService.obtenerClientePorCI(ci);
  }

  // ✅ Adquirir membresía desde la web (SIN autenticación)
  @Post('adquirir')
  async adquirirMembresia(@Body() data: ClienteCrearDto, @Req() req: Request) {
    const ip = req.ip ?? 'desconocido';

    return this.clientesService.adquirirMembresia(data, ip);
  }

  // ✅ Actualizar cliente (SOLO Recepcionista / Administrador)
  @Roles('recepcionista', 'administrador')
  @Put(':ci')
  async actualizarCliente(
    @Param('ci') ci: string,
    @Body() data: ClienteActualizarDto,
    @Req() req: UserRequest,
  ) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';

    return this.clientesService.actualizarCliente(ci, data, idUsuario, ip);
  }

  // ✅ Eliminar cliente definitivo (SOLO Administrador)
  @Roles('administrador')
  @Delete(':ci')
  async eliminarCliente(@Param('ci') ci: string, @Req() req: UserRequest) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';

    return this.clientesService.eliminarCliente(ci, idUsuario, ip);
  }
}
