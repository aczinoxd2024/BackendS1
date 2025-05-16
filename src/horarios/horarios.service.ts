import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './horario.entity';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepo: Repository<Horario>,
  ) {}

  // ADMIN, RECEPCIONISTA: Ver todos los horarios
  findAll(): Promise<Horario[]> {
    return this.horarioRepo.find({
      relations: ['clase', 'diaSemana'], // ✅ Incluye el día
    });
  }

  // ADMIN, INSTRUCTOR, RECEPCIONISTA: Ver horarios por ID de clase
  findByClase(IDClases: number): Promise<Horario[]> {
    return this.horarioRepo.find({
      where: { IDClases },
      relations: ['clase', 'diaSemana'], // ✅ Incluye el día
    });
  }

  // ADMIN, INSTRUCTOR: Ver un horario específico
  async findOne(id: number): Promise<Horario> {
    const horario = await this.horarioRepo.findOne({
      where: { IDHorario: id },
      relations: ['clase', 'diaSemana'], // ✅ Incluye el día
    });

    if (!horario) {
      throw new NotFoundException(`No se encontró el horario con ID ${id}`);
    }
    return horario;
  }

  // ADMIN: Crear un horario
  create(data: Horario): Promise<Horario> {
    return this.horarioRepo.save(data);
  }

  // ADMIN: Editar un horario
  async update(id: number, data: Partial<Horario>): Promise<Horario> {
    await this.horarioRepo.update(id, data);
    return this.findOne(id);
  }

  // ADMIN: Eliminar un horario
  async remove(id: number): Promise<void> {
    const horario = await this.findOne(id);
    await this.horarioRepo.remove(horario);
  }

  // ADMIN, INSTRUCTOR, CLIENTE, RECEPCIONISTA: Mostrar horarios con etiquetas visuales
  async getHorariosConEtiqueta(): Promise<
    { title: string; hora: string; diaEtiqueta: string }[]
  > {
    const horarios = await this.horarioRepo.find({
      relations: ['clase', 'diaSemana'], // ✅ Incluye el día real
    });

    return horarios.map((h) => ({
      title: h.clase?.Nombre || 'Clase sin nombre',
      hora: `${h.HoraIni} a ${h.HoraFin}`,
      diaEtiqueta: h.diaSemana?.Dia || 'Sin día',
    }));
  }
}
