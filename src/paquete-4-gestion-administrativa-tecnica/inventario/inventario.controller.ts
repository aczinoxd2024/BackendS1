import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CrearInventarioDto, ActualizarInventarioDto } from './inventario.dto';
import { Request } from 'express';
import { BitacoraService } from 'paquete-1-usuarios-accesos/bitacora/bitacora.service';
import { AccionBitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora-actions.enum';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('inventario')
@Controller('inventario')
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly bitacoraService: BitacoraService,
  ) {}

  @Post()
  async crear(@Body() dto: CrearInventarioDto, @Req() req: Request) {
    const resultado = await this.inventarioService.crear(dto);
    await this.bitacoraService.registrarDesdeRequest(
      req,
      AccionBitacora.CREAR_INVENTARIO,
      'Inventario',
    );
    return resultado;
  }

  @Get()
  async listar(
    @Req() req: Request,
    @Query('nombre') nombre?: string,
    @Query('estado') estadoId?: number,
    @Query('cantidadMin') cantidadMin?: number,
    @Query('cantidadMax') cantidadMax?: number,
  ) {
    const resultado = await this.inventarioService.listarConFiltros(
      nombre,
      estadoId,
      cantidadMin,
      cantidadMax,
    );
    await this.bitacoraService.registrarDesdeRequest(
      req,
      AccionBitacora.LISTAR_INVENTARIO,
      'Inventario',
    );
    return resultado;
  }

  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarInventarioDto,
    @Req() req: Request,
  ) {
    const resultado = await this.inventarioService.actualizar(id, dto);
    await this.bitacoraService.registrarDesdeRequest(
      req,
      AccionBitacora.ACTUALIZAR_INVENTARIO,
      'Inventario',
    );
    return resultado;
  }

  @Put(':id/baja')
  async darDeBaja(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const resultado = await this.inventarioService.darDeBaja(id);
    await this.bitacoraService.registrarDesdeRequest(
      req,
      AccionBitacora.DAR_BAJA_INVENTARIO,
      'Inventario',
    );
    return resultado;
  }
}
