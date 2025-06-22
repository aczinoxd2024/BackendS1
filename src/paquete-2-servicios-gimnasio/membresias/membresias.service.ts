import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';

import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Membresia } from '../../paquete-3-control-comercial/membresias/membresia.entity';
import { TipoMembresia } from '../../paquete-3-control-comercial/membresias/Tipos/tipo_membresia.entity';

@Injectable()
export class MembresiasService {
  constructor(
    @InjectRepository(Membresia)
    private membresiaRepository: Repository<Membresia>,

    @InjectRepository(TipoMembresia)
    private tipoMembresiaRepository: Repository<TipoMembresia>,

    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  // 🔧 CRUD BÁSICO

  async create(membresia: Membresia): Promise<Membresia> {
    if (!membresia.CICliente) {
      throw new BadRequestException('El CI del cliente es obligatorio');
    }

    return this.membresiaRepository.save({
      ...membresia,
      PlataformaWeb: 'Web', //  fuerza explícita para este flujo
    });
  }

  async findAll(): Promise<Membresia[]> {
    return this.membresiaRepository.find();
  }

  async findOne(id: number): Promise<Membresia> {
    const membresia = await this.membresiaRepository.findOneBy({
      IDMembresia: id,
    });

    if (!membresia) {
      throw new NotFoundException(`Membresía con ID ${id} no encontrada`);
    }

    return membresia;
  }

  async update(id: number, membresia: Membresia): Promise<Membresia> {
    await this.membresiaRepository.update(id, membresia);

    const updatedMembresia = await this.membresiaRepository.findOneBy({
      IDMembresia: id,
    });

    if (!updatedMembresia) {
      throw new NotFoundException(
        `Membresía con ID ${id} no encontrada para actualizar`,
      );
    }

    return updatedMembresia;
  }

  async remove(id: number): Promise<void> {
    await this.membresiaRepository.delete(id);
  }
  // ✅ Visualizar membresía actual y días restantes
  async obtenerDiasRestantes(ciCliente: string) {
    const hoy = new Date();

    const membresiaActual = await this.membresiaRepository.findOne({
      where: {
        CICliente: ciCliente,
        FechaFin: Raw((alias) => `${alias} >= CURDATE()`),
      },
      order: {
        FechaFin: 'DESC',
      },
      relations: ['cliente'],
    });

    if (!membresiaActual) {
      throw new NotFoundException(
        `El cliente ${ciCliente} no tiene una membresía activa.`,
      );
    }

    const diasRestantes = Math.ceil(
      (new Date(membresiaActual.FechaFin).getTime() - hoy.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const tipo = await this.tipoMembresiaRepository.findOne({
      where: { ID: membresiaActual.TipoMembresiaID },
    });

    return {
      IDMembresia: membresiaActual.IDMembresia,
      FechaInicio: membresiaActual.FechaInicio,
      FechaFin: membresiaActual.FechaFin,
      Tipo: tipo?.NombreTipo || 'Desconocido',
      DiasRestantes: diasRestantes,
    };
  }
  async obtenerMembresiaActualYDiasRestantes(ci: string) {
    const hoy = new Date();

    const membresia = await this.membresiaRepository.findOne({
      where: {
        CICliente: ci,
        FechaFin: Raw((alias) => `${alias} >= CURDATE()`), // Solo membresías vigentes
      },
      order: { FechaFin: 'DESC' }, // Obtener la más reciente
    });

    if (!membresia) {
      throw new NotFoundException('El cliente no tiene membresías vigentes');
    }

    const diasRestantes = Math.ceil(
      (new Date(membresia.FechaFin).getTime() - hoy.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      mensaje: 'Membresía actual encontrada',
      membresia: {
        IDMembresia: membresia.IDMembresia,
        FechaInicio: membresia.FechaInicio,
        FechaFin: membresia.FechaFin,
        TipoMembresiaID: membresia.TipoMembresiaID,
        PlataformaWeb: membresia.PlataformaWeb,
        CICliente: membresia.CICliente,
      },
      diasRestantes,
    };
  }

  // 🚀 NUEVO → Asignar Membresía (Presencial)

  /*
  async asignarMembresia(data: {
    clienteCi: string;
    tipoMembresiaId: number;
    fechaInicio: Date;
  }) {
    // Validar cliente
    const cliente = await this.clienteRepository.findOneBy({
      CI: data.clienteCi,
    });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Validar tipo de membresía
    const tipoMembresia = await this.tipoMembresiaRepository.findOneBy({
      ID: data.tipoMembresiaId,
    });
    if (!tipoMembresia) {
      throw new NotFoundException('Tipo de membresía no encontrado');
    }

    // Calcular fecha fin
    const fechaInicio = new Date(data.fechaInicio);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + tipoMembresia.DuracionDias);

    // Crear membresía (NO necesita relación directa, es informativa)
    const nuevaMembresia = this.membresiaRepository.create({
      FechaInicio: fechaInicio,
      FechaFin: fechaFin,
      PlataformaWeb: 'Presencial',
      TipoMembresiaID: tipoMembresia.ID,
    });

    await this.membresiaRepository.save(nuevaMembresia);

    return {
      mensaje: 'Membresía asignada con éxito',
      cliente: cliente.CI,
      membresiaId: nuevaMembresia.IDMembresia,
      fechaInicio,
      fechaFin,
    };
  }*/

  async asignarMembresia(data: {
    clienteCi: string;
    tipoMembresiaId: number;
    fechaInicio: Date;
  }) {
    // Validar cliente
    const cliente = await this.clienteRepository.findOneBy({
      CI: data.clienteCi,
    });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Validar tipo de membresía
    const tipoMembresia = await this.tipoMembresiaRepository.findOneBy({
      ID: data.tipoMembresiaId,
    });
    if (!tipoMembresia) {
      throw new NotFoundException('Tipo de membresía no encontrado');
    }

    // Calcular fecha fin
    const fechaInicio = new Date(data.fechaInicio);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + tipoMembresia.DuracionDias);

    const nuevaMembresia = this.membresiaRepository.create({
      FechaInicio: fechaInicio,
      FechaFin: fechaFin,
      PlataformaWeb: 'Presencial',
      TipoMembresiaID: tipoMembresia.ID,
      CICliente: cliente.CI,
    });

    await this.membresiaRepository.save(nuevaMembresia);

    return {
      mensaje: 'Membresía asignada con éxito',
      cliente: cliente.CI,
      membresiaId: nuevaMembresia.IDMembresia,
      fechaInicio,
      fechaFin,
    };
  }
}
