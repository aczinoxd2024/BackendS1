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
import { Horario } from '../horarios/horario.entity';
import { DiaSemana } from '../dia-semana/dia-semana.entity';
import { CreateClaseDto } from './dto/create-clase.dto'; // 👈 asegúrate de importar
import { UpdateClaseDto } from './dto/update-clase.dto';
import { AccionBitacora } from '../bitacora/bitacora-actions.enum';
import { DeleteClaseDto } from './dto/delete-clase.dto';
import { BitacoraService } from '../bitacora/bitacora.service';


@Injectable()
export class ClasesService {
  constructor(
  @InjectRepository(Clase)
  private readonly clasesRepository: Repository<Clase>,
  private readonly dataSource: DataSource,
  private readonly bitacoraService: BitacoraService, // 👈 AÑADIDO
) {}


 findAll(): Promise<Clase[]> {
  return this.clasesRepository.find({
    relations: ['sala'], // ✅ Esto carga la sala relacionada
  });
}

  async findOne(id: number): Promise<Clase> {
    const clase = await this.clasesRepository.findOneBy({ IDClase: id });
    if (!clase) {
      throw new NotFoundException(`No se encontró la clase con ID ${id}`);
    }
    return clase;
  }
  

  async update(id: number, dto: UpdateClaseDto): Promise<Clase> {
  const clase = await this.clasesRepository.findOne({ where: { IDClase: id } });
  if (!clase) throw new NotFoundException('Clase no encontrada');

  Object.assign(clase, dto); // ✅ Copia los campos válidos del DTO

  return this.clasesRepository.save(clase); // Guarda los cambios
}


async create(data: CreateClaseDto): Promise<Clase> {
  const horarioRepo = this.dataSource.getRepository(Horario);
  const diaRepo = this.dataSource.getRepository(DiaSemana);

  // Obtener día
  const dia = await diaRepo.findOne({ where: { Dia: data.Dia } });
  if (!dia) throw new NotFoundException('Día inválido');

  // Validar conflicto de horario en la misma sala
  const horariosEnSala = await horarioRepo
    .createQueryBuilder('horario')
    .leftJoin('horario.clase', 'clase')
    .where('clase.IDSalaa = :sala', { sala: data.IDSalaa })
    .andWhere('horario.IDDia = :dia', { dia: dia.ID })
    .getMany();

  for (const h of horariosEnSala) {
    const conflicto =
      (data.HoraIni >= h.HoraIni && data.HoraIni < h.HoraFin) ||
      (data.HoraFin > h.HoraIni && data.HoraFin <= h.HoraFin) ||
      (data.HoraIni <= h.HoraIni && data.HoraFin >= h.HoraFin);

    if (conflicto) {
      throw new ConflictException(
        `⛔ Conflicto de horario en la sala: ya existe una clase entre ${h.HoraIni} y ${h.HoraFin}`
      );
    }
  }

// Validar conflicto de horario del instructor (usando ClaseInstructor)
const clasesDelInstructor = await this.clasesRepository
  .createQueryBuilder('clase')
  .leftJoin('clase.claseInstructores', 'ci')
  .leftJoinAndSelect('clase.horarios', 'horario')
  .leftJoinAndSelect('horario.diaSemana', 'diaSemana')
  .where('ci.instructor.CI = :ci', { ci: data.CIInstructor })
  .getMany();


  for (const clase of clasesDelInstructor) {
    for (const h of clase.horarios) {
      const mismoDia = h.diaSemana?.Dia === data.Dia;
      const conflicto =
        (data.HoraIni >= h.HoraIni && data.HoraIni < h.HoraFin) ||
        (data.HoraFin > h.HoraIni && data.HoraFin <= h.HoraFin) ||
        (data.HoraIni <= h.HoraIni && data.HoraFin >= h.HoraFin);

      if (mismoDia && conflicto) {
        throw new ConflictException(
          `⛔ El instructor ya tiene una clase el ${data.Dia} entre ${h.HoraIni} y ${h.HoraFin}`
        );
      }
    }
  }

  // Crear la clase
  const nuevaClase = this.clasesRepository.create({
  Nombre: data.Nombre,
  IDSalaa: data.IDSalaa,
  CupoMaximo: data.CupoMaximo,
  Estado: 'Pendiente',
  NumInscritos: 0,
});


  const claseGuardada = await this.clasesRepository.save(nuevaClase);

  // Crear horario asociado
  const nuevoHorario = horarioRepo.create({
  clase: claseGuardada,     // 👈 relación ManyToOne
  HoraIni: data.HoraIni,
  HoraFin: data.HoraFin,
  diaSemana: dia            // 👈 relación ManyToOne
});


  await horarioRepo.save(nuevoHorario);

  // Registrar relación clase-instructor
const claseInstructorRepo = this.dataSource.getRepository(ClaseInstructor);

const nuevaRelacion = claseInstructorRepo.create({
  IDClase: claseGuardada.IDClase,
  CI: data.CIInstructor
});

await claseInstructorRepo.save(nuevaRelacion);


  return claseGuardada;
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
      .leftJoinAndSelect('clase.sala', 'sala') // ⚠️ Agrega esta línea si no está
      .where('instructor.CI = :ci', { ci })
      .getMany();

    return clases.map((clase) => ({
  IDClase: clase.IDClase,
  Nombre: clase.Nombre,
  Estado: clase.Estado,
  Horarios: clase.horarios.map((h) => ({
    horaInicio: h.HoraIni,
    horaFin: h.HoraFin,
    dia: h.diaSemana?.Dia ?? null
  }))
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
  async obtenerClasesDisponibles(): Promise<any[]> {
  return this.clasesRepository.find({
  select: ['IDClase', 'Nombre', 'CupoMaximo', 'NumInscritos', 'Estado'],
  where: { Estado: 'Activo' },
  order: { Nombre: 'ASC' }, 
});

}
async obtenerClasesPermitidas(ci: string): Promise<Clase[]> {
  return this.clasesRepository
    .createQueryBuilder('clase')
    .innerJoin('detalle_pago', 'dp', 'dp.IDClase = clase.IDClase')
    .innerJoin('pago', 'p', 'p.NroPago = dp.IDPago')
    .leftJoinAndSelect('clase.horarios', 'horarios') // ✅ alias correcto
    .leftJoinAndSelect('clase.claseInstructores', 'claseInstructores')
    .leftJoinAndSelect('clase.sala', 'sala')
    .leftJoinAndSelect('horarios.diaSemana', 'diaSemana') // ✅ corregido alias
    .where('p.CIPersona = :ci', { ci })
    .getMany();
}


async suspenderClase(id: number, idUsuario: string, ip: string): Promise<Clase> {
  const clase = await this.clasesRepository.findOne({ where: { IDClase: id } });
  if (!clase) {
    throw new NotFoundException('Clase no encontrada');
  }

  clase.Estado = 'Suspendida';
  await this.clasesRepository.save(clase);
   await this.bitacoraService.registrar(
     idUsuario,
     AccionBitacora.SUSPENDER,
     'clase',
     ip,
    );
    return clase;
  }

  async reactivarClase(id: number, idUsuario: string, ip: string): Promise<Clase> {
  const clase = await this.clasesRepository.findOne({ where: { IDClase: id } });
  if (!clase) {
    throw new NotFoundException('Clase no encontrada');
  }

  clase.Estado = 'Activo';
  await this.clasesRepository.save(clase);
  await this.bitacoraService.registrar(
    idUsuario || 'admin',
    AccionBitacora.REACTIVAR,
    'clase',
    ip,
  );

  return clase;
}

async eliminarClase(id: number, deleteDto: DeleteClaseDto) {
  const clase = await this.clasesRepository.findOneBy({ IDClase: id });
  if (!clase) throw new NotFoundException('Clase no encontrada');

  clase.Estado = 'Suspendida';
  // registrar en bitácora si es necesario usando deleteDto.eliminadoPor y deleteDto.motivo
  return this.clasesRepository.save(clase);
}


}
