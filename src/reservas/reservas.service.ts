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

    const estadoConfirmada = await this.estadoReservaRepository.findOneBy({ Estado: 'Confirmada' });
    if (!estadoConfirmada) throw new NotFoundException('Estado "Confirmada" no encontrado');

    const horario = await this.horarioRepository.findOne({
      where: { clase: { IDClase } },
      order: { HoraIni: 'ASC' },
      relations: ['clase'],
    });
    if (!horario) throw new NotFoundException('No hay horario asignado a esta clase');

    const yaExiste = await this.reservasRepository.findOne({
      where: {
        clase: { IDClase },
        cliente: { CI },
        estado: { Estado: 'Confirmada' },
      },
      relations: ['clase', 'cliente', 'estado'],
    });

    if (yaExiste) throw new ConflictException('Ya tienes una reserva activa para esta clase');

    const cupos = await this.reservasRepository.count({
      where: {
        clase: { IDClase },
        estado: { Estado: 'Confirmada' },
      },
      relations: ['estado'],
    });

    if (cupos >= clase.NumInscritos) {
      throw new ConflictException('Clase sin cupos disponibles');
    }

    const nuevaReserva = this.reservasRepository.create({
  clase: { IDClase } as any,
  cliente: { CI } as any,
  estado: estadoConfirmada,
  FechaReserva: new Date(),
  horario: { IDHorario: horario.IDHorario } as any, // ✅ así garantizas persistencia por FK
});


    return this.reservasRepository.save(nuevaReserva);
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
  async buscarPorCICliente(ci: string, estado?: string) {
  const where: any = {
    cliente: { CI: ci },
  };

  if (estado) {
    where.estado = { Estado: estado };
  }

  return this.reservasRepository.find({
    where,
    relations: ['clase', 'estado', 'horario', 'cliente'],
  });
}

}
