import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TipoMembresiaService } from './tipo_membresia.service';
import { TipoMembresia } from './tipo_membresia.entity';
import { CreateTipoMembresiaDto } from '../../dto/create-tipo_membresia.dto';
import { UpdateTipoMembresiaDto } from '../../dto/update-tipo_membresia.dto';
import { Request } from 'express';
import { Req } from '@nestjs/common';

// 🔐 Guards y Decoradores
import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';

@Controller('tipo_membresia')
export class TipoMembresiaController {
  constructor(private readonly tipoMembresiaService: TipoMembresiaService) {}

  // ✅ Público autenticado: obtener todos
@Get(':id')
async obtenerPorId(
  @Param('id', ParseIntPipe) id: number,
): Promise<any> {
  const tipo = await this.tipoMembresiaService.obtenerPorId(id);
  if (!tipo) {
    throw new NotFoundException('Tipo de membresía no encontrado');
  }

  let clasesArray: number[] = [];

  if (tipo.Clases) {
    try {
      clasesArray = JSON.parse(tipo.Clases);
    } catch (error) {
      console.warn('Error al parsear Clases:', error);
    }
  }

  return {
    ...tipo,
    Clases: clasesArray, // 👈 aquí lo sobrescribimos como array solo para la respuesta
  };
}


  // ✅ Crear (admin o recepcionista)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'recepcionista')
  crear(
    @Body() data: CreateTipoMembresiaDto,
    @Req() req: Request,
  ): Promise<TipoMembresia> {
    return this.tipoMembresiaService.crear(data, req);
  }

  // ✅ Actualizar (admin o recepcionista)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'recepcionista')
  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTipoMembresiaDto,
    @Req() req: Request,
  ): Promise<TipoMembresia> {
    return this.tipoMembresiaService.actualizar(id, data, req);
  }

  // ✅ Eliminar (admin o recepcionista)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'recepcionista')
  @Delete(':id')
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<{ mensaje: string }> {
    return this.tipoMembresiaService.eliminar(id, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('con-promocion-activa')
  async obtenerConPromocionActiva(): Promise<TipoMembresia[]> {
    return this.tipoMembresiaService.obtenerConPromocionActiva();
  }
}
