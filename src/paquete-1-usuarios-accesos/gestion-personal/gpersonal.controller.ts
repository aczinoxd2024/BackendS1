import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GpersonalService } from './gpersonal.service';
import { CreatePersonalDto } from 'paquete-1-usuarios-accesos/auth/dto/create-personal.dto';
import { UpdatePersonalDto } from 'paquete-1-usuarios-accesos/auth/dto/update-personal.dto';
import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { UserRequest } from 'paquete-1-usuarios-accesos/auth/user-request.interface';

@Controller('gestion-personal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador')
export class GpersonalController {
  constructor(private readonly gpersonalService: GpersonalService) {}

  @Post()
  async crear(@Body() data: CreatePersonalDto, @Req() req: UserRequest) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';
    console.log(`[POST] Crear personal - IP: ${ip} - Usuario: ${idUsuario}`);
    return this.gpersonalService.crearPersonal(data, idUsuario, ip);
  }

  @Get()
  async listar() {
    console.log('[GET] Listar personal');
    return this.gpersonalService.listarPersonal();
  }

  @Get(':ci')
  async obtener(@Param('ci') ci: string) {
    console.log(`[GET] Obtener personal CI: ${ci}`);
    return this.gpersonalService.obtenerPersonal(ci);
  }

  @Put(':ci')
  async actualizar(
    @Param('ci') ci: string,
    @Body() data: UpdatePersonalDto,
    @Req() req: UserRequest,
  ) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';
    console.log(
      `[PUT] Actualizar personal CI: ${ci} - IP: ${ip} - Usuario: ${idUsuario}`,
    );
    return this.gpersonalService.actualizarPersonal(ci, data, idUsuario, ip);
  }

  @Delete(':ci')
  async desactivar(@Param('ci') ci: string, @Req() req: UserRequest) {
    const idUsuario = req.user?.id ?? 'desconocido';
    const ip = req.ip ?? 'desconocido';
    console.log(
      `[DELETE] Desactivar personal CI: ${ci} - IP: ${ip} - Usuario: ${idUsuario}`,
    );
    return this.gpersonalService.desactivarPersonal(ci, idUsuario, ip);
  }
}
