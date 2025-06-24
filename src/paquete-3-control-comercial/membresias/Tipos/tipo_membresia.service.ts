import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoMembresia } from './tipo_membresia.entity';
import { CreateTipoMembresiaDto } from '../../dto/create-tipo_membresia.dto';
import { UpdateTipoMembresiaDto } from '../../dto/update-tipo_membresia.dto';
import { Request } from 'express';
import { BitacoraService } from 'paquete-1-usuarios-accesos/bitacora/bitacora.service';
import { AccionBitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora-actions.enum';
import { Promocion } from '../../promociones-Crud/promocion.entity';


@Injectable()
export class TipoMembresiaService {
  constructor(
    @InjectRepository(TipoMembresia)
    private readonly tipoRepo: Repository<TipoMembresia>,

    private readonly bitacoraService: BitacoraService,

    @InjectRepository(Promocion)
    private readonly promoRepo: Repository<Promocion>,
  ) {}

  async obtenerTipos(): Promise<TipoMembresia[]> {
    return this.tipoRepo.find();
  }

  async obtenerPorId(id: number): Promise<TipoMembresia> {
    const tipo = await this.tipoRepo.findOne({ where: { id } })
    if (!tipo) throw new NotFoundException('Tipo de membresía no encontrado');
    return tipo;
  }

async crear(
  data: CreateTipoMembresiaDto,
  req: Request,
): Promise<TipoMembresia> {
  // 🔹 Validación de promoción (si aplica)
  if (data.IDPromocion) {
    const promo = await this.promoRepo.findOne({
      where: { IDPromo: data.IDPromocion },
    });
    if (!promo)
      throw new NotFoundException('La promoción especificada no existe.');
    const hoy = new Date();
    if (promo.FechaFin < hoy) {
      throw new BadRequestException(
        'La promoción está vencida y no puede ser asignada.',
      );
    }
  }
console.log('📥 Data recibida en backend:', data);
  // 🔹 Crear tipo de membresía (sin corchetes)
const tipo = this.tipoRepo.create({
  nombreTipo: data.nombreTipo,
  descripcion: data.descripcion,
  precio: data.precio,
  duracionDias: data.duracionDias,
  beneficios: data.beneficios,
  IDPromocion: data.IDPromocion ?? undefined,
  clases: data.clases ? JSON.stringify(data.clases) : undefined,
  cantidadClasesCliente: data.cantidadClasesCliente ?? undefined
});

console.log('💾 Objeto que se guardará:', tipo);
  const nuevo = await this.tipoRepo.save(tipo);

  // 🔹 Bitácora si no es admin
  const usuario = req.user as any;
  if (usuario?.rol !== 'administrador') {
    await this.bitacoraService.registrarDesdeRequest(
      req,
      AccionBitacora.CREAR_TIPO_MEMBRESIA,
      'tipo_membresia',
    );
  }

  return nuevo;
}


 async actualizar(
  id: number,
  data: UpdateTipoMembresiaDto,
  req: Request,
): Promise<TipoMembresia> {
  const existente = await this.obtenerPorId(id);

  // Validación de promoción (si aplica)
  if (data.IDPromocion) {
    const promo = await this.promoRepo.findOne({
      where: { IDPromo: data.IDPromocion },
    });
    if (!promo)
      throw new NotFoundException('La promoción especificada no existe.');
    const hoy = new Date();
    if (promo.FechaFin < hoy) {
      throw new BadRequestException(
        'La promoción está vencida y no puede ser asignada.',
      );
    }
  }

  // Asignar cambios, incluyendo clases y cantidadClasesCliente
  Object.assign(existente, {
    ...data,
    IDPromocion: data.IDPromocion ?? existente.IDPromocion,
    clases: Array.isArray(data.clases) ? JSON.stringify(data.clases) : existente.clases,
    cantidadClasesCliente: data.cantidadClasesCliente ?? existente.cantidadClasesCliente,
  });

  const guardado = await this.tipoRepo.save(existente);

  const usuario = req.user as any;
  if (usuario?.rol !== 'administrador') {
    await this.bitacoraService.registrarDesdeRequest(
      req,
      AccionBitacora.ACTUALIZAR_TIPO_MEMBRESIA,
      'tipo_membresia',
    );
  }

  return guardado;
}

  async eliminar(id: number, req: Request): Promise<{ mensaje: string }> {
    const tipo = await this.obtenerPorId(id);
    await this.tipoRepo.remove(tipo);

    const usuario = req.user as any;
    if (usuario?.rol !== 'administrador') {
      await this.bitacoraService.registrarDesdeRequest(
        req,
        AccionBitacora.ELIMINAR_TIPO_MEMBRESIA,
        'tipo_membresia',
      );
    }

    return {
      mensaje: `Tipo de membresía "${tipo.nombreTipo}" eliminado correctamente.`,

    };
  }

  async obtenerConPromocionActiva(): Promise<TipoMembresia[]> {
    const hoy = new Date();
    return this.tipoRepo
      .createQueryBuilder('tipo')
      .leftJoinAndSelect('tipo.promocion', 'promo')
      .where('promo.fechaInicio <= :hoy', { hoy })
      .andWhere('promo.fechaFin >= :hoy', { hoy })
      .getMany();
  }
}
