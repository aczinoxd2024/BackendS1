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
import { In } from 'typeorm';
import { Clase } from 'paquete-2-servicios-gimnasio/clases/clase.entity';



@Injectable()
export class TipoMembresiaService {
  constructor(
    @InjectRepository(TipoMembresia)
    private readonly tipoRepo: Repository<TipoMembresia>,

    private readonly bitacoraService: BitacoraService,

    @InjectRepository(Promocion)
    private readonly promoRepo: Repository<Promocion>,

    @InjectRepository(Clase)
private readonly claseRepo: Repository<Clase>,

  ) {}

  async obtenerTipos(): Promise<TipoMembresia[]> {
    return this.tipoRepo.find();
  }

  async obtenerPorId(id: number): Promise<TipoMembresia> {
    const tipo = await this.tipoRepo.findOne({ where: { ID: id } })
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
  NombreTipo: data.NombreTipo,
  Descripcion: data.Descripcion,
  Precio: data.Precio,
  DuracionDias: data.DuracionDias,
  Beneficios: data.Beneficios,
  IDPromocion: data.IDPromocion ?? undefined,
  Clases: data.Clases ? JSON.stringify(data.Clases) : undefined,
  CantidadClasesCliente: data.CantidadClasesCliente ?? undefined
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
  NombreTipo: data.NombreTipo ?? existente.NombreTipo,
  Descripcion: data.Descripcion ?? existente.Descripcion,
  Precio: data.Precio ?? existente.Precio,
  DuracionDias: data.DuracionDias ?? existente.DuracionDias,
  Beneficios: data.Beneficios ?? existente.Beneficios,
  IDPromocion: data.IDPromocion ?? existente.IDPromocion,
  Clases: Array.isArray(data.Clases) ? JSON.stringify(data.Clases) : existente.Clases,
  CantidadClasesCliente: data.CantidadClasesCliente ?? existente.CantidadClasesCliente,
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
  
  // Marcado como inactivo (soft delete)
  tipo.Estado = 'Inactivo';
  await this.tipoRepo.save(tipo);

  const usuario = req.user as any;
  if (usuario?.rol !== 'administrador') {
    await this.bitacoraService.registrarDesdeRequest(
      req,
      AccionBitacora.ELIMINAR_TIPO_MEMBRESIA,
      'tipo_membresia',
    );
  }

  return {
    mensaje: `Tipo de membresía "${tipo.NombreTipo}" marcado como inactivo.`,
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


  async obtenerTiposActivos(): Promise<TipoMembresia[]> {
  return this.tipoRepo.find({
    where: { Estado: 'Activo' },
    order: { Precio: 'ASC' }
  });
}

async restaurar(id: number, req: Request): Promise<{ mensaje: string }> {
  const tipo = await this.obtenerPorId(id);
  if (!tipo) throw new NotFoundException('Membresía no encontrada');

  if (tipo.Estado === 'Activo') {
    return { mensaje: 'La membresía ya está activa.' };
  }

  tipo.Estado = 'Activo';
  await this.tipoRepo.save(tipo);

  const usuario = req.user as any;
  if (usuario?.rol !== 'administrador') {
    await this.bitacoraService.registrarDesdeRequest(
      req,
      AccionBitacora.RESTAURAR_TIPO_MEMBRESIA,
      'tipo_membresia',
    );
  }

  return { mensaje: `Membresía "${tipo.NombreTipo}" restaurada correctamente.` };
}

async obtenerPorEstado(estado: string): Promise<TipoMembresia[]> {
  return this.tipoRepo.find({
    where: { Estado: estado },
    order: { Precio: 'ASC' }
  });
}


}
