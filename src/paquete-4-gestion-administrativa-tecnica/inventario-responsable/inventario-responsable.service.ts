import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventarioResponsable } from './inventario-responsable.entity';
import { CrearResponsableDto } from './inventario-responsable.dto';

@Injectable()
export class InventarioResponsableService {
  constructor(
    @InjectRepository(InventarioResponsable)
    private repo: Repository<InventarioResponsable>,
  ) {}

  async asignar(dto: CrearResponsableDto): Promise<InventarioResponsable> {
    const nuevo = this.repo.create({
      ...dto,
      FechaAsignacion: new Date(),
    });
    return this.repo.save(nuevo);
  }

  async listar(): Promise<InventarioResponsable[]> {
   return this.repo.find({
    relations: ['item', 'persona'], // ← esto es clave
    order: { FechaAsignacion: 'DESC' }
     });
  }

  async obtenerPorResponsable(ci: string): Promise<InventarioResponsable[]> {
    return this.repo.find({
      where: { CI: ci },
      relations: ['item'], // si tienes relación en la entidad
    });
  }

  async eliminarResponsabilidad(ci: string, idItem: number): Promise<void> {
    await this.repo.delete({ CI: ci, IDItem: idItem  });
  }
async validarCantidad(ci: string) {
  const cantidad = await this.repo.count({ where: { CI:ci } });
  return {
    ci,
    cantidadAsignada: cantidad,
    excedeLimite: cantidad > 5,
  };
}
}