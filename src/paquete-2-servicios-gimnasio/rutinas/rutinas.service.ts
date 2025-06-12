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
  ) {}

  async create(dto: CreateRutinaDto, req: Request): Promise<Rutina> {
    const detalles = await Promise.all(
      dto.detalles.map(async (d) => {
        const ejercicio = await this.ejercicioRepo.findOne({ where: { id: d.idEjercicio } });
        const dia = await this.diaRepo.findOne({ where: { ID: d.idDia } });
        if (!ejercicio || !dia) throw new NotFoundException('Ejercicio o día inválido');
        return this.detalleRepo.create({ ejercicio, dia, series: d.series, repeticiones: d.repeticiones });
      })
    );

    const rutina = this.rutinaRepo.create({
      nombre: dto.nombre,
      objetivo: dto.objetivo,
      nivel: dto.nivel,
      tipoAcceso: dto.tipoAcceso,
      esBasica: dto.esBasica || false,
      generoObjetivo: dto.generoObjetivo,
      ciInstructor: dto.ciInstructor,
      detalles,
      activo: true,
    });

    const rutinaGuardada = await this.rutinaRepo.save(rutina);
    await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.CREAR_RUTINA, 'rutina');
    return rutinaGuardada;
  }

  findAll(): Promise<Rutina[]> {
    return this.rutinaRepo.find({
      where: { activo: true },
      relations: ['detalles', 'detalles.ejercicio', 'detalles.dia'],
    });
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

  async update(id: number, dto: UpdateRutinaDto, req: Request): Promise<Rutina> {
    const rutina = await this.findOne(id);
    Object.assign(rutina, dto);
    await this.bitacoraService.registrarDesdeRequest(req, AccionBitacora.ACTUALIZAR_RUTINA, 'rutina');
    return this.rutinaRepo.save(rutina);
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
}
