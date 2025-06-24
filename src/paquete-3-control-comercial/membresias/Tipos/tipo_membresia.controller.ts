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
import { In } from 'typeorm';
import { Clase } from 'paquete-2-servicios-gimnasio/clases/clase.entity';
import { Repository, } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';


// 🔐 Guards y Decoradores
import { JwtAuthGuard } from 'paquete-1-usuarios-accesos/auth/jwt.auth.guard';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';


@Controller('tipo_membresia')
export class TipoMembresiaController {
  constructor(private readonly tipoMembresiaService: TipoMembresiaService, 
  @InjectRepository(Clase)
  private readonly claseRepo: Repository<Clase> ) {}

  
 // ✅ GET: Obtener solo membresías activas
  @Get()
  async obtenerTodos(): Promise<TipoMembresia[]> {
    return this.tipoMembresiaService.obtenerTiposActivos(); // ⬅️ Nombre actualizado
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador', 'recepcionista')
@Get('inactivas')
async obtenerInactivas(): Promise<TipoMembresia[]> {
  return this.tipoMembresiaService.obtenerPorEstado('Inactivo');
}


  // ✅ GET: Obtener por ID
  @Get(':id')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const tipo = await this.tipoMembresiaService.obtenerPorId(id);
    if (!tipo) {
      throw new NotFoundException('Tipo de membresía no encontrado');
    }

    let clasesArray: number[] = [];
    let clasesInfo: Clase[] = [];

    if (tipo.Clases) {
      try {
        clasesArray = JSON.parse(tipo.Clases);
        clasesInfo = await this.claseRepo.findBy({ IDClase: In(clasesArray) });
      } catch (error) {
        console.warn('Error al parsear Clases:', error);
      }
    }

    return {
      ...tipo,
      clasesIncluidas: clasesInfo,
    };
  }

  // ✅ POST: Crear membresía
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'recepcionista')
  crear(
    @Body() data: CreateTipoMembresiaDto,
    @Req() req: Request,
  ): Promise<TipoMembresia> {
    return this.tipoMembresiaService.crear(data, req);
  }

  // ✅ PUT: Actualizar membresía
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'recepcionista')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTipoMembresiaDto,
    @Req() req: Request,
  ): Promise<TipoMembresia> {
    return this.tipoMembresiaService.actualizar(id, data, req);
  }

  @Put(':id/restaurar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador', 'recepcionista')
restaurar(
  @Param('id', ParseIntPipe) id: number,
  @Req() req: Request
): Promise<{ mensaje: string }> {
  return this.tipoMembresiaService.restaurar(id, req);
}


  // ✅ DELETE: Eliminación lógica
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador', 'recepcionista')
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<{ mensaje: string }> {
    return this.tipoMembresiaService.eliminar(id, req); // ⬅️ ya debe aplicar soft delete
  }

  // ✅ GET: Membresías con promoción activa
  @UseGuards(JwtAuthGuard)
  @Get('con-promocion-activa')
  async obtenerConPromocionActiva(): Promise<TipoMembresia[]> {
    return this.tipoMembresiaService.obtenerConPromocionActiva();
  }



}
