import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rutina } from './entidades/rutina.entity';
import { DetalleRutina } from './entidades/detalle-rutina.entity';
import { Ejercicio } from './entidades/ejercicio.entity';
import { DiaSemana } from 'dia-semana/dia-semana.entity';
import { CreateRutinaDto } from './dto/create-rutina.dto';
import { UpdateRutinaDto } from './dto/update-rutina.dto';
import { BitacoraService } from 'paquete-1-usuarios-accesos/bitacora/bitacora.service';
import { AccionBitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora-actions.enum';
import { Request } from 'express';
import { ClienteRutina } from './entidades/cliente-rutina.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { Clase } from 'paquete-2-servicios-gimnasio/clases/clase.entity';
import { TipoAccesoRutina } from './enums';
import { BadRequestException } from '@nestjs/common';



@Injectable()
export class RutinasService {
  constructor(
    @InjectRepository(Rutina) private readonly rutinaRepo: Repository<Rutina>,
    @InjectRepository(DetalleRutina) private readonly detalleRepo: Repository<DetalleRutina>,
    @InjectRepository(Ejercicio) private readonly ejercicioRepo: Repository<Ejercicio>,
    @InjectRepository(DiaSemana) private readonly diaRepo: Repository<DiaSemana>,
    @InjectRepository(Cliente) private readonly clienteRepository: Repository<Cliente>,
    private readonly bitacoraService: BitacoraService,
    @InjectRepository(ClienteRutina) private readonly clienteRutinaRepository: Repository<ClienteRutina>,
    @InjectRepository(Clase) private readonly claseRepo: Repository<Clase>,
  ) {}

 async create(dto: CreateRutinaDto, req: Request): Promise<Rutina> {
  let detalles: DetalleRutina[] = [];

  if (dto.detalles && dto.detalles.length > 0) {
    detalles = await Promise.all(
      dto.detalles.map(async (d) => {
        const ejercicio = await this.ejercicioRepo.findOne({ where: { id: d.idEjercicio } });
        const dia = await this.diaRepo.findOne({ where: { ID: d.idDia } });

        if (!ejercicio || !dia) {
          throw new NotFoundException('Ejercicio o día inválido');
        }

        return this.detalleRepo.create({
          ejercicio,
          dia,
          series: d.series,
          repeticiones: d.repeticiones,
          descanso: d.descanso
        });
      })
    );
  }

  // Inicializamos clase opcionalmente
  let clase: Clase | undefined = undefined;

if (dto.tipoAcceso === TipoAccesoRutina.clase) {
  if (!dto.IDClase) {
    throw new BadRequestException('Se requiere IDClase para rutinas de tipo clase');
  }
  const claseEncontrada = await this.claseRepo.findOne({ where: { IDClase: dto.IDClase } });
  if (!claseEncontrada) throw new NotFoundException('Clase no encontrada');
  clase = claseEncontrada;
}



  const rutina = this.rutinaRepo.create({
    nombre: dto.nombre,
    objetivo: dto.objetivo,
    nivel: dto.nivel,
    tipoAcceso: dto.tipoAcceso,
    esBasica: dto.esBasica || false,
    generoObjetivo: dto.generoObjetivo,
    ciInstructor: dto.ciInstructor,
    detalles,
    clase, // ✅ opcional
    IDClase: dto.IDClase,
    activo: true,
  });

  const rutinaGuardada = await this.rutinaRepo.save(rutina);
  await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.CREAR_RUTINA, 'rutina');
  return rutinaGuardada;
}


  async findAll(): Promise<Rutina[]> {
  try {
    return await this.rutinaRepo.find({
      where: { activo: true },
      relations: ['detalles', 'detalles.ejercicio', 'detalles.dia'],
    });
  } catch (error) {
    console.error('❌ Error en findAll:', error);
    throw new InternalServerErrorException('Error al cargar rutinas');
  }
}

  async getRutinasGenerales(): Promise<Rutina[]> {
    return this.rutinaRepo.find({
      where: { tipoAcceso: 'general', activo: true },
      relations: ['detalles', 'detalles.ejercicio', 'detalles.dia'],
    });
  }

  async obtenerRutinasPermitidas(ciCliente: string): Promise<Rutina[]> {
    const cliente = await this.clienteRepository.findOne({
      where: { CI: ciCliente },
      relations: ['pagos', 'pagos.detalles', 'pagos.detalles.clase', 'pagos.detalles.membresia', 'pagos.detalles.membresia.tipo'],
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const pagos = cliente.pagos.flatMap(p => p.detalles);
    const tieneGold = pagos.some(p => p.membresia?.tipo?.NombreTipo === 'Gold');
    const tieneBasicaOAparatos = tieneGold || pagos.some(p => p.clase?.Nombre === 'Aparatos');

    const rutinas: Rutina[] = [];

    if (tieneBasicaOAparatos) {
      const generales = await this.rutinaRepo.find({
        where: { tipoAcceso: 'general', activo: true },
        relations: ['detalles', 'detalles.ejercicio', 'detalles.dia'],
      });
      rutinas.push(...generales);
    }

    if (tieneGold) {
      const gold = await this.rutinaRepo.find({
        where: { tipoAcceso: 'gold', activo: true },
        relations: ['detalles', 'detalles.ejercicio', 'detalles.dia'],
      });
      rutinas.push(...gold);
    }

    const personalizadas = await this.clienteRutinaRepository.find({
      where: { cliente: { CI: ciCliente }, activo: true },
      relations: ['rutina', 'rutina.detalles', 'rutina.detalles.ejercicio', 'rutina.detalles.dia'],
    });
    rutinas.push(...personalizadas.map(r => r.rutina));

    const unicas = Array.from(new Map(rutinas.map(r => [r.id, r])).values());
    return unicas;
  }

  async findOne(id: number): Promise<Rutina> {
    const rutina = await this.rutinaRepo.findOne({
      where: { id, activo: true },
      relations: ['detalles', 'detalles.ejercicio', 'detalles.dia'],
    });
    if (!rutina) throw new NotFoundException('Rutina no encontrada');
    return rutina;
  }

  
 async update(id: number, dto: UpdateRutinaDto, req: Request): Promise<any> {
  const rutina = await this.findOne(id);

  if (!dto.detalles || dto.detalles.length === 0) {
    throw new BadRequestException('Debe agregar al menos un ejercicio a la rutina');
  }

  // Eliminar detalles actuales
  await this.detalleRepo.remove(rutina.detalles);

  // Crear nuevos detalles
  const nuevosDetalles = await Promise.all(
    dto.detalles.map(async (d) => {
      const ejercicio = await this.ejercicioRepo.findOne({ where: { id: d.idEjercicio } });
      const dia = await this.diaRepo.findOne({ where: { ID: d.idDia } });

      if (!ejercicio || !dia) {
        throw new NotFoundException('Ejercicio o día inválido');
      }

      return this.detalleRepo.create({
        ejercicio,
        dia,
        series: d.series,
        repeticiones: d.repeticiones,
        descanso: d.descanso,
        rutina
      });
    })
  );

  await this.detalleRepo.save(nuevosDetalles);

  // Actualizar rutina
  rutina.nombre = dto.nombre;
  rutina.objetivo = dto.objetivo;
  rutina.generoObjetivo = dto.generoObjetivo;
  rutina.nivel = dto.nivel;
  rutina.tipoAcceso = dto.tipoAcceso;
  rutina.descripcion = dto.descripcion || '';
  rutina.ciInstructor = dto.ciInstructor || rutina.ciInstructor;

  await this.rutinaRepo.save(rutina);
  await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.ACTUALIZAR_RUTINA, 'rutina');

  // Intentar cargar la rutina actualizada con relaciones
  try {
    const rutinaConRelaciones = await this.rutinaRepo.findOne({
      where: { id: rutina.id },
      relations: ['detalles', 'detalles.ejercicio', 'detalles.dia']
    });

    // Si alguna relación falla o viene null, devolvemos solo los datos planos
    if (!rutinaConRelaciones || !rutinaConRelaciones.detalles) {
      return {
        mensaje: 'Rutina actualizada, pero los detalles no pudieron cargarse completamente.',
        rutinaBasica: rutina
      };
    }
    

    return rutinaConRelaciones;
  } catch (error) {
    console.error('❌ Error al devolver rutina con relaciones:', error);
    return {
      mensaje: 'Rutina actualizada correctamente, pero ocurrió un error al devolver los datos completos.',
      rutinaBasica: rutina
    };
  }
}



  async remove(id: number, req: Request): Promise<void> {
    const rutina = await this.findOne(id);
    rutina.activo = false;
    await this.rutinaRepo.save(rutina);
    await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.ELIMINAR_RUTINA, 'rutina');
  }

  async reactivarRutina(id: number, req: Request): Promise<Rutina> {
    const rutina = await this.rutinaRepo.findOne({ where: { id } });
    if (!rutina) throw new NotFoundException('Rutina no encontrada');
    rutina.activo = true;
    const actualizada = await this.rutinaRepo.save(rutina);
    await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.REACTIVAR_RUTINA, 'rutina');
    return actualizada;
  }

  async eliminarDetalle(idRutina: number, idDetalle: number, req: Request): Promise<void> {
    const rutina = await this.rutinaRepo.findOne({ where: { id: idRutina }, relations: ['detalles'] });
    if (!rutina) throw new NotFoundException('Rutina no encontrada');
    const detalle = rutina.detalles.find((d) => d.id === idDetalle);
    if (!detalle) throw new NotFoundException('Detalle no encontrado');
    await this.detalleRepo.remove(detalle);
    await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.ELIMINAR_DETALLE_RUTINA, 'detalle_rutina');
  }

  async agregarDetalleARutina(
    idRutina: number,
    detalle: { idEjercicio: number; idDia: number; series: number; repeticiones: number },
    req: Request
  ): Promise<DetalleRutina> {
    const rutina = await this.findOne(idRutina);
    const ejercicio = await this.ejercicioRepo.findOne({ where: { id: detalle.idEjercicio } });
    const dia = await this.diaRepo.findOne({ where: { ID: detalle.idDia } });
    if (!ejercicio || !dia) throw new NotFoundException('Ejercicio o día no válido');
    const nuevoDetalle = this.detalleRepo.create({ rutina, ejercicio, dia, series: detalle.series, repeticiones: detalle.repeticiones });
    const guardado = await this.detalleRepo.save(nuevoDetalle);
    await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.CREAR_DETALLE_RUTINA, 'detalle_rutina');
    return guardado;
  }

  async asignarRutinaPersonalizada(idRutina: number, ciCliente: string, req: Request): Promise<string> {
    const cliente = await this.clienteRepository.findOne({ where: { CI: ciCliente } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    const rutina = await this.rutinaRepo.findOne({ where: { id: idRutina } });
    if (!rutina) throw new NotFoundException('Rutina no encontrada');
    if (rutina.tipoAcceso !== 'personalizada') {
      throw new Error('Solo se pueden asignar rutinas personalizadas');
    }
    const yaAsignada = await this.clienteRutinaRepository.findOne({
      where: { cliente: { CI: ciCliente }, rutina: { id: idRutina } },
    });
    if (yaAsignada) {
      if (!yaAsignada.activo) {
        yaAsignada.activo = true;
        await this.clienteRutinaRepository.save(yaAsignada);
        return 'Rutina personalizada reactivada para el cliente';
      }
      return 'La rutina ya estaba asignada al cliente';
    }
    const relacion = this.clienteRutinaRepository.create({ cliente, rutina });
    await this.clienteRutinaRepository.save(relacion);
    await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.ASIGNAR_RUTINA_PERSONALIZADA, 'cliente_rutina');
    return 'Rutina personalizada asignada correctamente';
  }

  async obtenerRutinasPorTipo(tipo: string): Promise<Rutina[]> {
  return this.rutinaRepo.find({
    where: { tipoAcceso: tipo },
    relations: ['detalles'], // si quieres traer los ejercicios también
  });
}


}
