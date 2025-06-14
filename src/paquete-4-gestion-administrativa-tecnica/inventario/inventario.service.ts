import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from './inventario.entity';
import { CrearInventarioDto, ActualizarInventarioDto } from './inventario.dto';
import { EstadoInventario } from '../estado-inventario/estado-inventario.entity';
import { BitacoraService } from 'paquete-1-usuarios-accesos/bitacora/bitacora.service'; // Ajusta si usas otra ruta

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private inventarioRepo: Repository<Inventario>,
    @InjectRepository(EstadoInventario)
    private estadoRepo: Repository<EstadoInventario>,
    private readonly bitacoraService: BitacoraService,
  ) {}

  async crear(dto: CrearInventarioDto): Promise<Inventario> {
    const yaExiste = await this.inventarioRepo.findOne({
      where: { nombre: dto.nombre },
    });

    if (yaExiste) {
      throw new BadRequestException(
        'Ya existe un ítem con ese nombre, actualizar no crear.',
      );
    }

    const estado = await this.estadoRepo.findOneBy({ id: dto.estadoId });
    if (!estado) throw new NotFoundException('Estado no encontrado');

    const nuevo = this.inventarioRepo.create({ ...dto, estado });
    return this.inventarioRepo.save(nuevo);
  }

  async listar(): Promise<Inventario[]> {
    return this.inventarioRepo.find({ relations: ['estado'] });
  }

  async listarConFiltros(
    nombre?: string,
    estadoId?: number,
    cantidadMin?: number,
    cantidadMax?: number,
  ): Promise<Inventario[]> {
    const query = this.inventarioRepo
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.estado', 'estado');

    if (nombre) {
      query.andWhere('inventario.nombre LIKE :nombre', {
        nombre: `%${nombre}%`,
      });
    }

    if (estadoId) {
      query.andWhere('estado.id = :estadoId', { estadoId });
    }

    if (cantidadMin !== undefined) {
      query.andWhere('inventario.cantidadActual >= :cantidadMin', {
        cantidadMin,
      });
    }

    if (cantidadMax !== undefined) {
      query.andWhere('inventario.cantidadActual <= :cantidadMax', {
        cantidadMax,
      });
    }

    return query.getMany();
  }

  async actualizar(
    id: number,
    dto: ActualizarInventarioDto,
  ): Promise<Inventario> {
    const item = await this.inventarioRepo.findOne({
      where: { idItem: id },
      relations: ['estado'],
    });
    if (!item) throw new NotFoundException('Ítem no encontrado');

    // 🔒 Validación: no permitir nombres duplicados
    if (dto.nombre) {
      const existente = await this.inventarioRepo.findOne({
        where: { nombre: dto.nombre },
      });

      if (existente && existente.idItem !== id) {
        throw new BadRequestException('Ya existe otro ítem con ese nombre.');
      }
    }

    // Validación cantidad negativa (ya lo tenías si lo usás)
    if (dto.cantidadActual !== undefined && dto.cantidadActual < 0) {
      throw new BadRequestException('La cantidad no puede ser negativa');
    }

    if (dto.estadoId) {
      const estado = await this.estadoRepo.findOneBy({ id: dto.estadoId });
      if (!estado) throw new NotFoundException('Estado no encontrado');
      item.estado = estado;
    }

    Object.assign(item, dto);
    return this.inventarioRepo.save(item);
  }

  async darDeBaja(id: number): Promise<Inventario> {
    const item = await this.inventarioRepo.findOne({
      where: { idItem: id },
      relations: ['estado'],
    });
    if (!item) throw new NotFoundException('Ítem no encontrado');

    const estadoDanado = await this.estadoRepo.findOneBy({
      estado: 'Dañado',
    });
    if (!estadoDanado)
      throw new NotFoundException('Estado "Dañado" no encontrado');

    item.estado = estadoDanado;
    return this.inventarioRepo.save(item);
  }
}
