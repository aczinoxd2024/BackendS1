import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Clase } from './clase.entity';
import { ClaseInstructor } from './clase-instructor.entity';
import { Personal } from '../personal/personal.entity';

@Injectable()
export class ClasesService {
  constructor(
    @InjectRepository(Clase)
    private clasesRepository: Repository<Clase>,
    private readonly dataSource: DataSource,
  ) {}

  create(clase: Clase): Promise<Clase> {
    return this.clasesRepository.save(clase);
  }

  findAll(): Promise<Clase[]> {
    return this.clasesRepository.find();
  }

  async findOne(id: number): Promise<Clase> {
    const clase = await this.clasesRepository.findOneBy({ IDClase: id });
    if (!clase) {
      throw new NotFoundException(`No se encontró la clase con ID ${id}`);
    }
    return clase;
  }

  async update(id: number, clase: Clase): Promise<Clase> {
    await this.clasesRepository.update(id, clase);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.clasesRepository.delete(id);
  }

  // ✅ Clases activas con detalles completos (para admin/recepción)
  async obtenerClasesActivas() {
    const clases = await this.clasesRepository.find({
      where: { Estado: 'Activo' },
      relations: [
        'sala',
        'horarios',
        'horarios.diaSemana',
        'claseInstructores',
        'claseInstructores.instructor',
      ],
    });

    return clases.map((clase) => ({
      IDClase: clase.IDClase,
      Nombre: clase.Nombre,
      Estado: clase.Estado,
      NumInscritos: clase.NumInscritos,
      Sala: clase.sala?.Descripcion || null,
      HorariosPorDia: clase.horarios.map(
        (h) => `${h.diaSemana?.Dia}: ${h.HoraIni} a ${h.HoraFin}`,
      ),
    }));
  }

  // ✅ Obtener instructores de una clase
  async obtenerInstructoresPorClase(id: number) {
    const clase = await this.clasesRepository.findOne({
      where: { IDClase: id },
      relations: [
        'claseInstructores',
        'claseInstructores.instructor',
        'claseInstructores.instructor.persona',
      ],
    });

    if (!clase) throw new NotFoundException('Clase no encontrada');

    return clase.claseInstructores.map((r) => ({
      CI: r.instructor.CI,
      Nombre: r.instructor.persona?.Nombre || 'Sin nombre',
      Apellido: r.instructor.persona?.Apellido || 'Sin apellido',
    }));
  }

  // ✅ Asignar instructor con validación de horario
  async asignarInstructor(idClase: number, ci: string) {
    const clase = await this.clasesRepository.findOne({
      where: { IDClase: idClase },
      relations: ['horarios'],
    });
    if (!clase) throw new NotFoundException('Clase no encontrada');

    const instructor = await this.dataSource
      .getRepository(Personal)
      .findOneBy({ CI: ci });
    if (!instructor) throw new NotFoundException('Instructor no encontrado');

    const repo = this.dataSource.getRepository(ClaseInstructor);
    const yaExiste = await repo.findOne({
      where: {
        clase: { IDClase: idClase },
        instructor: { CI: ci },
      },
      relations: ['clase', 'instructor'],
    });
    if (yaExiste)
      throw new ConflictException('Instructor ya asignado a esta clase');

    // 🚨 Validar conflictos de horario con otras clases del instructor
    const clasesDelInstructor = await this.clasesRepository
      .createQueryBuilder('clase')
      .leftJoin('clase.claseInstructores', 'ci')
      .leftJoinAndSelect('clase.horarios', 'h')
      .where('ci.CI = :ci', { ci })
      .getMany();

    for (const otraClase of clasesDelInstructor) {
      for (const h1 of otraClase.horarios) {
        for (const h2 of clase.horarios) {
          if (
            h1.diaSemana?.Dia === h2.diaSemana?.Dia &&
            ((h2.HoraIni >= h1.HoraIni && h2.HoraIni < h1.HoraFin) ||
              (h2.HoraFin > h1.HoraIni && h2.HoraFin <= h1.HoraFin) ||
              (h2.HoraIni <= h1.HoraIni && h2.HoraFin >= h1.HoraFin))
          ) {
            throw new ConflictException(
              `Conflicto de horario: ya tiene clase ese día entre ${h1.HoraIni} y ${h1.HoraFin}`,
            );
          }
        }
      }
    }

    const asignacion = repo.create({ clase, instructor });
    return repo.save(asignacion);
  }

  // ✅ Clases filtradas por instructor logueado
  async obtenerClasesPorInstructor(ci: string) {
    const clases = await this.clasesRepository
      .createQueryBuilder('clase')
      .leftJoinAndSelect('clase.claseInstructores', 'ci_rel')
      .leftJoinAndSelect('ci_rel.instructor', 'instructor')
      .leftJoinAndSelect('clase.horarios', 'horario')
      .leftJoinAndSelect('horario.diaSemana', 'diaSemana')
      .where('instructor.CI = :ci', { ci })
      .getMany();

    return clases.map((clase) => ({
      IDClase: clase.IDClase,
      Nombre: clase.Nombre,
      Estado: clase.Estado,
      Horarios: clase.horarios.map(
        (h) => `${h.diaSemana?.Dia}: ${h.HoraIni} a ${h.HoraFin}`,
      ),
    }));
  }

  // ✅ Clases disponibles para cliente (vista reducida)
  async obtenerClasesParaCliente() {
    const clases = await this.clasesRepository.find({
      where: { Estado: 'Activo' },
      relations: ['horarios', 'horarios.diaSemana'],
    });

    return clases.map((clase) => ({
      IDClase: clase.IDClase,
      Nombre: clase.Nombre,
      NumInscritos: clase.NumInscritos,
      Horarios: clase.horarios.map(
        (h) => `${h.diaSemana?.Dia}: ${h.HoraIni} a ${h.HoraFin}`,
      ),
    }));
  }
}
