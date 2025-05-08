import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { UserRequest } from '../auth/user-request.interface';
import { Roles } from 'src/auth/roles/roles.decorator';
import { Request } from 'express';
import { ClienteCrearDto } from 'src/auth/dto/clienteCrear.dto';
import { ClienteActualizarDto } from 'src/auth/dto/clienteActualizar.dto';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // 🚨 Nuevo endpoint para que el cliente logueado obtenga su perfil
  @UseGuards(JwtAuthGuard)
  @Roles('cliente', 'recepcionista', 'administrador', 'instructor')
  @Get('perfil')
  async obtenerMiPerfil(@Req() req: UserRequest) {
    const ci = req.user?.id ?? 'desconocido';
    console.log('Obteniendo perfil para CI:', ci);
    return this.clientesService.obtenerMiPerfil(ci);
  }

  // 🚨 Actualizar perfil cliente
  @UseGuards(JwtAuthGuard)
  @Roles('cliente', 'recepcionista', 'administrador', 'instructor')
  @Put('perfil/actualizar')
  async actualizarMiPerfil(
    @Body() data: ClienteActualizarDto,
    @Req() req: UserRequest,
  ) {
    const ci = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';

    return this.clientesService.actualizarCliente(ci, data, ci, ip);
  }

  // ✅ Adquirir membresía desde la web (SIN autenticación)
  @Post('adquirir')
  async adquirirMembresia(@Body() data: ClienteCrearDto, @Req() req: Request) {
    const ip = req.ip ?? 'desconocido';
    return this.clientesService.adquirirMembresia(data, ip);
  }

  // ✅ Listar clientes (SOLO Recepcionista / Administrador)
  @Roles('recepcionista', 'administrador')
  @Get()
  async listarClientes() {
    return this.clientesService.listarClientes();
  }

  // ✅ Crear cliente (SOLO Recepcionista / Administrador)
  @Roles('recepcionista', 'administrador')
  @Post()
  async createCliente(@Body() data: ClienteCrearDto, @Req() req: UserRequest) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';
    return this.clientesService.create(data, req.user.rol, idUsuario, ip);
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

  // ✅ Eliminar cliente (SOLO Administrador)
  @Roles('administrador')
  @Delete(':ci')
  async eliminarCliente(@Param('ci') ci: string, @Req() req: UserRequest) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';
    return this.clientesService.eliminarCliente(ci, idUsuario, ip);
  }

  // ✅ Obtener un cliente por su CI (SOLO Recepcionista / Administrador)
  @Roles('recepcionista', 'administrador')
  @Get(':ci')
  async obtenerCliente(@Param('ci') ci: string) {
    return this.clientesService.obtenerClientePorCI(ci);
  }
}
