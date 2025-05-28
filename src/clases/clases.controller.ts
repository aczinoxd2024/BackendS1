import {Controller,Post,Get,Put,Delete,Param,Body,BadRequestException,Req,UnauthorizedException,} from '@nestjs/common';
import { ClasesService } from './clases.service';
import { Clase } from './clase.entity';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';
import { plainToInstance } from 'class-transformer';
import { AsignarInstructorDto } from './dto/asignar-instructor.dto';
import { Request } from 'express';
import { Roles } from 'src/auth/roles/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Patch } from '@nestjs/common';        // asegúrate que este archivo exista
import { ParseIntPipe } from '@nestjs/common';
import { DeleteClaseDto } from './dto/delete-clase.dto';

   
  // asegúrate que este archivo exista



@Controller('clases')
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

@Post()
create(@Body() claseDto: CreateClaseDto): Promise<Clase> {
  return this.clasesService.create(claseDto);
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
    @Get('disponibles')
async getDisponibles() {
  return this.clasesService.obtenerClasesDisponibles();
}
@Get('permitidas')
@Roles('cliente','administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
async getPermitidas(@Req() req: Request) {
  const ci = (req.user as any)?.ci;
  return this.clasesService.obtenerClasesPermitidas(ci);
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
    return this.clasesService.update(idNum, claseDto);

  }

  @Delete(':id')
@Roles('administrador')
async eliminarClase(
  @Param('id', ParseIntPipe) id: number,
  @Body() deleteDto: DeleteClaseDto
) {
  return this.clasesService.eliminarClase(id, deleteDto);
}


  @Patch(':id/suspender')
// Puedes protegerlo después con @Roles y @UseGuards si lo deseas
suspenderClase(@Param('id') id: string, @Req() req: Request) {
  const usuario = (req.user as any)?.idUsuario ?? 'admin'; // por ahora usa "admin"
  const ip = req.ip ?? '127.0.0.1'; // usa IP por defecto si no se obtiene
  return this.clasesService.suspenderClase(Number(id), usuario, ip);
}

@Patch(':id/reactivar')
// Puedes protegerlo después con @Roles y @UseGuards si lo deseas
reactivarClase(@Param('id') id: string, @Req() req: Request) {
  const usuario = (req.user as any)?.idUsuario ?? 'admin';
  const ip = req.ip ?? '127.0.0.1';
  return this.clasesService.reactivarClase(Number(id), usuario, ip);
}

}
