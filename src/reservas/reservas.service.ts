import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from './reserva.entity';
import { Clase } from '../clases/clase.entity';
import { Cliente } from '../clientes/cliente.entity';
import { EstadoReserva } from '../estado-reserva/estado-reserva.entity';
import { Horario } from '../horarios/horario.entity';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
    @InjectRepository(Clase)
    private readonly claseRepository: Repository<Clase>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(EstadoReserva)
    private readonly estadoReservaRepository: Repository<EstadoReserva>,
    @InjectRepository(Horario)
    private readonly horarioRepository: Repository<Horario>,
  ) {}

  async crearReserva(IDClase: number, CI: string) {
  const clase = await this.claseRepository.findOneBy({ IDClase });
  if (!clase) throw new NotFoundException('Clase no encontrada');

  const estadoConfirmada = await this.estadoReservaRepository.findOneBy({
    Estado: 'Confirmada',
  });
  if (!estadoConfirmada)
    throw new NotFoundException('Estado "Confirmada" no encontrado');

  const horario = await this.horarioRepository.findOne({
    where: { clase: { IDClase } },
    order: { HoraIni: 'ASC' },
    relations: ['clase'],
  });
  if (!horario)
    throw new NotFoundException('No hay horario asignado a esta clase');

  const yaExiste = await this.reservasRepository.findOne({
    where: {
      clase: { IDClase },
      cliente: { CI },
      estado: { Estado: 'Confirmada' },
    },
    relations: ['clase', 'cliente', 'estado'],
  });

  if (yaExiste)
    throw new ConflictException(
      'Ya tienes una reserva activa para esta clase',
    );

  const cupos = await this.reservasRepository.count({
    where: {
      clase: { IDClase },
      estado: { Estado: 'Confirmada' },
    },
    relations: ['estado'],
  });

  if (cupos >= clase.CupoMaximo) {
    throw new ConflictException('Clase sin cupos disponibles');
  }

  const nuevaReserva = this.reservasRepository.create({
    clase: { IDClase } as any,
    cliente: { CI } as any,
    estado: estadoConfirmada,
    FechaReserva: new Date(),
    horario: { IDHorario: horario.IDHorario } as any,
  });

  const reservaGuardada = await this.reservasRepository.save(nuevaReserva);

  // ✅ Lógica adicional: actualizar NumInscritos y estado de la clase
  clase.NumInscritos++;

  if (
    clase.Estado === 'Pendiente' &&
    clase.NumInscritos >= Math.ceil(clase.CupoMaximo / 2)
  ) {
    clase.Estado = 'Activo';
  }

  await this.claseRepository.save(clase);

  const claseSeActivo =
  clase.Estado === 'Activo' &&
  clase.NumInscritos >= Math.ceil(clase.CupoMaximo / 2);


  return {
  ...reservaGuardada,
  claseActivada: claseSeActivo
};

}


  async buscarPorCliente(ci: string) {
    return this.reservasRepository.find({
      where: {
        cliente: { CI: ci },
        estado: { Estado: 'Confirmada' },
      },
      relations: ['clase', 'estado', 'horario'],
    });
  }

  async findAll(): Promise<Reserva[]> {
    return this.reservasRepository.find({
      relations: ['clase', 'cliente', 'estado', 'horario'],
    });
  }

  async findOne(id: number): Promise<Reserva> {
    const reserva = await this.reservasRepository.findOne({
      where: { IDReserva: id },
      relations: ['clase', 'cliente', 'estado', 'horario'],
    });
    if (!reserva) {
      throw new NotFoundException(`No se encontró la reserva con ID ${id}`);
    }
    return reserva;
  }

  async remove(id: number): Promise<void> {
    const reserva = await this.findOne(id);
    await this.reservasRepository.remove(reserva);
  }
  async buscarPorCICliente(
    ci: string,
    estado?: string,
    fechaInicio?: string,
    fechaFin?: string,
  ) {
    const where: any = {
      cliente: { CI: ci },
    };

    if (estado) {
      where.estado = { Estado: estado };
    }

    const query = this.reservasRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.cliente', 'cliente')
      .leftJoinAndSelect('reserva.clase', 'clase')
      .leftJoinAndSelect('reserva.estado', 'estado')
      .leftJoinAndSelect('reserva.horario', 'horario')
      .where('cliente.CI = :ci', { ci });

    if (estado) {
      query.andWhere('estado.Estado = :estado', { estado });
    }

    if (fechaInicio) {
      query.andWhere('reserva.FechaReserva >= :fechaInicio', { fechaInicio });
    }

    if (fechaFin) {
      query.andWhere('reserva.FechaReserva <= :fechaFin', { fechaFin });
    }

    return query.getMany();
  }
  async cancelarReserva(id: number) {
    const reserva = await this.reservasRepository.findOne({
      where: { IDReserva: id },
      relations: ['estado'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    const estadoCancelado = await this.estadoReservaRepository.findOneBy({
      Estado: 'Cancelada',
    });

    if (!estadoCancelado) {
      throw new NotFoundException('Estado "Cancelada" no existe');
    }

    reserva.estado = estadoCancelado;
    return this.reservasRepository.save(reserva);
  }

  async getReservasPasadas(
    ciCliente: string,
    fechaInicio?: string,
    fechaFin?: string,
  ) {
    const query = this.reservasRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.clase', 'clase')
      .leftJoinAndSelect('reserva.horario', 'horario')
      .leftJoinAndSelect('reserva.estado', 'estadoReserva')
      .leftJoinAndSelect('reserva.cliente', 'cliente')
      .where('cliente.CI = :ci', { ci: ciCliente })
      .andWhere('reserva.FechaReserva < CURDATE()');

    if (fechaInicio) {
      query.andWhere('reserva.FechaReserva >= :fechaInicio', { fechaInicio });
    }

    if (fechaFin) {
      query.andWhere('reserva.FechaReserva <= :fechaFin', { fechaFin });
    }

    query.orderBy('reserva.FechaReserva', 'DESC');

    const reservas = await query.getMany();

    // Para cada reserva, buscar si existe asistencia relacionada
    const connection = this.reservasRepository.manager.connection;
    for (const reserva of reservas) {
      const result = await connection.query(
        `
      SELECT ea.Estado
      FROM asistencia_clases ac
      JOIN estado_asistencia ea ON ea.ID = ac.IDEstadoAsis
      JOIN asistencia_general ag ON ag.IDAsistencia = ac.IDAsistenciaGeneral
      WHERE ac.IDClase = ?
        AND ag.CIPerso = ?
        AND ag.Fecha = ?
      LIMIT 1
      `,
        [reserva.clase.IDClase, reserva.cliente.CI, reserva.FechaReserva],
      );

      reserva['estadoAsistencia'] =
        result.length > 0 ? result[0].Estado : 'Sin registro';
    }

    return reservas;
  }
  async buscarPorFiltros(
  ci?: string,
  estado?: string,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<Reserva[]> {
  const query = this.reservasRepository
    .createQueryBuilder('reserva')
    .leftJoinAndSelect('reserva.cliente', 'cliente')
    .leftJoinAndSelect('reserva.clase', 'clase')
    .leftJoinAndSelect('reserva.horario', 'horario')
    .leftJoinAndSelect('reserva.estado', 'estado')
    .where('1 = 1'); // Para permitir agregar filtros dinámicos

  if (ci) {
    query.andWhere('cliente.ci = :ci', { ci });
  }

  if (estado) {
    query.andWhere('estado.Estado = :estado', { estado });
  }

  if (fechaInicio) {
    query.andWhere('reserva.FechaReserva >= :fechaInicio', { fechaInicio });
  }

  if (fechaFin) {
    query.andWhere('reserva.FechaReserva <= :fechaFin', { fechaFin });
  }

  return query.orderBy('clase.Nombre', 'ASC').getMany();
}
async cancelarReservaCliente(id: number, ci: string) {
  const reserva = await this.reservasRepository.findOne({
    where: {
      IDReserva: id,
      cliente: { CI: ci }, // Verifica que le pertenezca
    },
    relations: ['estado', 'cliente'],
  });

  if (!reserva) {
    throw new NotFoundException('Reserva no encontrada o no pertenece al cliente');
  }

  const estadoCancelada = await this.estadoReservaRepository.findOne({
    where: { Estado: 'Cancelada' },
  });

  if (!estadoCancelada) {
    throw new Error('Estado "Cancelada" no está definido en la base de datos');
  }

  reserva.estado = estadoCancelada;
  await this.reservasRepository.save(reserva);
}


}
