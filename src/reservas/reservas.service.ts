import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from './reserva.entity';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
  ) {}

  create(reserva: Reserva): Promise<Reserva> {
    return this.reservasRepository.save(reserva);
  }

  findAll(): Promise<Reserva[]> {
    return this.reservasRepository.find();
  }

  async findOne(id: number): Promise<Reserva> {
    const reserva = await this.reservasRepository.findOneBy({ ID: id });
    if (!reserva) {
      throw new NotFoundException(`No se encontró la reserva con ID ${id}`);
    }
    return reserva;
  }

  // Método de actualización corregido
  async update(id: number, reserva: Reserva): Promise<Reserva> {
    const existingReserva = await this.reservasRepository.findOneBy({ ID: id });

    if (!existingReserva) {
      throw new NotFoundException(`No se encontró la reserva con ID ${id}`);
    }

    // Asignar los valores de la nueva reserva a la reserva existente
    const updatedReserva = Object.assign(existingReserva, reserva);

    // Guardar los cambios
    return this.reservasRepository.save(updatedReserva);
  }

  async remove(id: number): Promise<{ message: string }> {
    const reserva = await this.reservasRepository.findOneBy({ ID: id });

    if (!reserva) {
      throw new NotFoundException(`No se encontró la reserva con ID ${id}`);
    }

    await this.reservasRepository.delete(id);
    return { message: `Reserva con ID ${id} eliminada correctamente` };
  }
}
