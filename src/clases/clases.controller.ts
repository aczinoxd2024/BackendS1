import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ClasesService } from './clases.service';
import { Clase } from './clase.entity';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';
import { plainToInstance } from 'class-transformer';
import { AsignarInstructorDto } from './dto/asignar-instructor.dto';
import { Request } from 'express';
import { Roles } from 'src/auth/roles/roles.decorator';

@Controller('clases')
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Post()
  create(@Body() claseDto: CreateClaseDto): Promise<Clase> {
    const clase = plainToInstance(Clase, claseDto);
    return this.clasesService.create(clase);
  }

  @Post(':id/instructores')
  @Roles('administrador')
  async asignarInstructor(
    @Param('id') id: string,
    @Body() body: AsignarInstructorDto,
  ) {
    const idClase = Number(id);
    if (isNaN(idClase)) {
      throw new BadRequestException('ID inválido');
    }
    return this.clasesService.asignarInstructor(idClase, body.ci);
  }

  @Get()
  findAll(): Promise<Clase[]> {
    return this.clasesService.findAll();
  }

  // ✅ Rutas personalizadas deben ir antes de :id
  @Get('activas')
  getClasesActivas() {
    return this.clasesService.obtenerClasesActivas();
  }

  @Get('mis-clases')
  @Roles('instructor')
  async getMisClases(@Req() req: Request) {
    const ci = (req.user as any)?.ci;
    if (!ci) throw new UnauthorizedException('Instructor no identificado');
    return this.clasesService.obtenerClasesPorInstructor(ci);
  }

  @Get('publicas')
  getDisponiblesParaCliente() {
    return this.clasesService.obtenerClasesParaCliente();
  }

  @Get(':id/instructores')
  getInstructores(@Param('id') id: string) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new BadRequestException('ID inválido');
    }
    return this.clasesService.obtenerInstructoresPorClase(idNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Clase> {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new BadRequestException('El ID de clase debe ser un número válido');
    }
    return this.clasesService.findOne(idNum);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() claseDto: UpdateClaseDto,
  ): Promise<Clase> {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new BadRequestException('El ID de clase debe ser un número válido');
    }
    return this.clasesService.update(idNum, claseDto as Clase);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new BadRequestException('El ID de clase debe ser un número válido');
    }
    return this.clasesService.remove(idNum);
  }
}
