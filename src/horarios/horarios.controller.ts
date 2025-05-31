import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { Horario } from './horario.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { RolesGuard } from 'src/paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { Roles } from 'src/paquete-1-usuarios-accesos/auth/roles/roles.decorator';

@UseGuards(RolesGuard)
@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  // ADMIN, RECEPCIONISTA: Ver todos los horarios
  @Roles('administrador', 'recepcionista')
  @Get()
  findAll(): Promise<Horario[]> {
    return this.horariosService.findAll();
  }

  // ADMIN, RECEPCIONISTA, INSTRUCTOR: Ver horarios por clase
  @Roles('administrador', 'recepcionista', 'instructor')
  @Get('clase/:id')
  findByClase(@Param('id') id: string): Promise<Horario[]> {
    const claseId = Number(id);
    if (isNaN(claseId)) {
      throw new BadRequestException('El ID de clase debe ser un número válido');
    }
    return this.horariosService.findByClase(claseId);
  }

  // ADMIN, INSTRUCTOR, RECEPCIONISTA, CLIENTE: Horarios agrupados por día
  @Roles('administrador', 'instructor', 'recepcionista', 'cliente')
  @Get('por-dia')
  getHorariosAgrupadosPorDia() {
    return this.horariosService.getHorariosConEtiqueta();
  }

  // ADMIN, INSTRUCTOR, RECEPCIONISTA, CLIENTE: Mostrar horarios con etiquetas visuales
  @Roles('administrador', 'instructor', 'recepcionista', 'cliente')
  @Get('con-etiqueta')
  getHorariosEtiquetados() {
    return this.horariosService.getHorariosConEtiqueta();
  }

  // ADMIN, INSTRUCTOR, RECEPCIONISTA: Ver horario por ID
  @Roles('administrador', 'instructor', 'recepcionista')
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Horario> {
    const horarioId = Number(id);
    if (isNaN(horarioId)) {
      throw new BadRequestException('El ID de horario debe ser un número válido');
    }
    return this.horariosService.findOne(horarioId);
  }

  // ✅ POST: Crear un horario
  @Roles('administrador')
  @Post()
  create(@Body() dto: CreateHorarioDto): Promise<Horario> {
    return this.horariosService.create(dto); // ✅ corregido, sin casting
  }

  // ADMIN: Editar horario
  @Roles('administrador')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHorarioDto): Promise<Horario> {
    const horarioId = Number(id);
    if (isNaN(horarioId)) {
      throw new BadRequestException('El ID de horario debe ser un número válido');
    }
    return this.horariosService.update(horarioId, dto); // ❌ eliminado cast a Horario
  }

  // ADMIN: Eliminar horario
  @Roles('administrador')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    const horarioId = Number(id);
    if (isNaN(horarioId)) {
      throw new BadRequestException('El ID de horario debe ser un número válido');
    }
    return this.horariosService.remove(horarioId);
  }
}
