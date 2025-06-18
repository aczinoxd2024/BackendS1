import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventarioUso } from './inventario-uso.entity';
import { CrearInventarioUsoDto } from './inventario-uso.dto';

@Injectable()
export class InventarioUsoService {
  constructor(
    @InjectRepository(InventarioUso)
    private repo: Repository<InventarioUso>,
  ) {}

  async crear(dto: CrearInventarioUsoDto): Promise<InventarioUso> {
    const nuevo = this.repo.create({
      ...dto,
      FechaAsignacion: new Date(),
    });
    return this.repo.save(nuevo);
  }

  async listar(): Promise<InventarioUso[]> {
    return this.repo.find({ relations: ['item'] });
  }

  // ✅ Filtros por tipoDestino y fecha
  async filtrar(tipoDestino?: string, fecha?: string): Promise<InventarioUso[]> {
    const query = this.repo.createQueryBuilder('uso')
      .leftJoinAndSelect('uso.item', 'item');

    if (tipoDestino) {
      query.andWhere('uso.tipoDestino = :tipoDestino', { tipoDestino });
    }

    if (fecha) {
      query.andWhere('DATE(uso.fechaAsignacion) = :fecha', { fecha });
    }

    return query.getMany();
  }

  // ✅ Historial por ítem
  async obtenerHistorialPorItem(idItem: number): Promise<InventarioUso[]> {
    return this.repo.find({
      where: { item: { idItem } },
      relations: ['item'],
      order: { FechaAsignacion: 'DESC' },
    });
  }

  // ✅ Validar cantidad (esto es más lógico hacerlo en InventarioResponsableService)
  async validarCantidad(ci: string): Promise<boolean> {
    const cantidad = await this.repo.count({ where: { TipoDestino: 'responsable', IDDestino:parseInt (ci,10) } });
    return cantidad > 5;
  }
}
