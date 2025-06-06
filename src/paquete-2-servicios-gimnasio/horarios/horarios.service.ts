import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './horario.entity';
import { Clase } from '../clases/clase.entity';
import { DiaSemana } from '../dia-semana/dia-semana.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';


@Injectable()
export class HorariosService {
  constructor(
  @InjectRepository(Horario)
  private readonly horarioRepo: Repository<Horario>,
  @InjectRepository(Clase)
  private readonly claseRepo: Repository<Clase>,
  @InjectRepository(DiaSemana)
  private readonly diaRepo: Repository<DiaSemana>,
) {}

  // ADMIN, RECEPCIONISTA: Ver todos los horarios
  findAll(): Promise<Horario[]> {
    return this.horarioRepo.find({
      relations: ['clase', 'diaSemana'], // ✅ Incluye el día
    });
  }

  // ADMIN, INSTRUCTOR, RECEPCIONISTA: Ver horarios por ID de clase
 findByClase(IDClase: number): Promise<Horario[]> {
  return this.horarioRepo.find({
    where: { clase: { IDClase } },
    relations: ['clase', 'diaSemana'],
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
  async create(dto: CreateHorarioDto): Promise<Horario> {
  const clase = await this.claseRepo.findOneBy({ IDClase: dto.IDClase });
  if (!clase) throw new NotFoundException('Clase no encontrada');

  const dia = await this.diaRepo.findOneBy({ ID: dto.IDDia });
  if (!dia) throw new NotFoundException('Día inválido');

  const nuevoHorario = this.horarioRepo.create({
    HoraIni: dto.HoraIni,
    HoraFin: dto.HoraFin,
    clase,
    diaSemana: dia,
  });

  return this.horarioRepo.save(nuevoHorario);
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
