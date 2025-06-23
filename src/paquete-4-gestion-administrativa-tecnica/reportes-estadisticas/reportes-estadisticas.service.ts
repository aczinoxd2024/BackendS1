import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Raw, Repository } from 'typeorm';
import { Pago } from 'pagos/pagos.entity';
import { Personal } from 'paquete-2-servicios-gimnasio/personal/personal.entity';
import { AsistenciaPersonal } from 'paquete-2-servicios-gimnasio/personal/asistencia_personal.entity';
import { Clase } from 'paquete-2-servicios-gimnasio/clases/clase.entity';
import { Reserva } from 'paquete-2-servicios-gimnasio/reservas/reserva.entity';
import { Membresia } from 'membresias/membresia.entity';
import { TipoMembresia } from 'membresias/Tipos/tipo_membresia.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';


@Injectable()
export class ReportesEstadisticasService {
  constructor(
    @InjectRepository(Membresia)
    private readonly membresiaRepo: Repository<Membresia>,

    @InjectRepository(TipoMembresia)
    private readonly tipoRepo: Repository<TipoMembresia>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

     @InjectRepository(Personal)
    private readonly personalRepo: Repository<Personal>,

    @InjectRepository(AsistenciaPersonal)
    private readonly asistenciaRepo: Repository<AsistenciaPersonal>, 

     @InjectRepository(Clase)
    private readonly claseRepo: Repository<Clase>,

    @InjectRepository(Reserva)
private readonly reservasRepository: Repository<Reserva>,

@InjectRepository(Persona)
private readonly personaRepo: Repository<Persona>,

  ) {}

  async obtenerResumenMembresias() {
    const hoy = new Date();

    // Excluir membresías "Incluidas" (gratuitas por Gold)
    const filtro = {
      PlataformaWeb: Not(In(['Incluida'])),
    };

    // Total real de membresías adquiridas
    const total = await this.membresiaRepo.count({ where: filtro });

    // Activas: FechaFin >= hoy
    const activas = await this.membresiaRepo.count({
      where: {
        ...filtro,
        FechaFin: Raw((alias) => `${alias} >= CURDATE()`),
      },
    });

    const expiradas = total - activas;

    // Resumen por tipo (sin contar las incluidas)
    const tipos = await this.membresiaRepo
      .createQueryBuilder('m')
      .innerJoin('m.tipo', 'tipo')
      .where("m.PlataformaWeb != 'Incluida'")
      .select('tipo.NombreTipo', 'tipo')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('tipo.NombreTipo')
      .getRawMany();

    const resumenPorTipo = {};
    tipos.forEach((t) => {
      resumenPorTipo[t.tipo.trim()] = parseInt(t.cantidad);
    });

    return {
      total,
      activas,
      expiradas,
      tipo: resumenPorTipo,
    };
  }

  async obtenerReportePagosMensuales() {
    const pagos = await this.pagoRepo
      .createQueryBuilder('p')
      .select([
        'MONTH(p.Fecha) AS mes',
        'COUNT(*) AS totalPagos',
        'SUM(p.Monto) AS montoTotal',
      ])
      .groupBy('MONTH(p.Fecha)')
      .orderBy('mes', 'ASC')
      .getRawMany();

    const meses = [
      '',
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    return pagos.map((p) => ({
      mes: meses[parseInt(p.mes)],
      totalPagos: parseInt(p.totalPagos),
      montoTotal: parseFloat(p.montoTotal),
    }));
  }

async obtenerAsistenciasPorCargo(cargo?: string, inicio?: string, fin?: string) {
  let query = this.asistenciaRepo
    .createQueryBuilder('a')
    .leftJoinAndSelect('a.persona', 'persona')
    .leftJoinAndSelect('a.responsable', 'responsable');

  if (cargo) {
    const personas = await this.personalRepo
      .createQueryBuilder('p')
      .where('LOWER(p.Cargo) LIKE LOWER(:cargo)', { cargo: `%${cargo}%` })
      .getMany();

    const ciList = personas.map((p) => p.CI);
    if (ciList.length === 0) {
      console.log('⚠️ No se encontró personal con ese cargo');
      return [];
    }

    query = query.andWhere('a.ci IN (:...ciList)', { ciList });
  }

  if (inicio && fin) {
    query = query.andWhere('a.fecha BETWEEN :inicio AND :fin', { inicio, fin });
  }

  return query.orderBy('a.fecha', 'DESC').getMany();
}


async generarReporteClases(nombreInstructor?: string) {
  const clases = await this.claseRepo.find({
    relations: [
      'sala',
      'horarios',
      'horarios.diaSemana',
      'claseInstructores',
      'claseInstructores.instructor',
      'claseInstructores.instructor.persona',
    ],
  });

  return clases
    .filter((clase) => {
      if (!nombreInstructor) return true;

      const filtroNormalizado = nombreInstructor
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const coincide = clase.claseInstructores.some((ci) => {
        const persona = ci.instructor.persona;
        if (!persona) return false;

        const nombreCompleto = `${persona.Nombre} ${persona.Apellido}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        return nombreCompleto.includes(filtroNormalizado);
      });

      return coincide;
    })
    .map((clase) => {
      const instructores = clase.claseInstructores.map((ci) => {
        const p = ci.instructor.persona;
        return p ? `${p.Nombre} ${p.Apellido}` : ci.instructor.CI;
      });

      const horarios = clase.horarios.map(
        (h) => `${h.diaSemana?.Dia}: ${h.HoraIni} - ${h.HoraFin}`,
      );

      return {
        IDClase: clase.IDClase,
        Nombre: clase.Nombre,
        Estado: clase.Estado,
        CupoMaximo: clase.CupoMaximo,
        NumInscritos: clase.NumInscritos,
        Instructores: instructores.join(', '),
        Horarios: horarios.join(' | '),
        Sala: clase.sala?.Descripcion || 'Sin sala asignada',
      };
    });
}



  async obtenerClasesActivas() {
  const clases = await this.claseRepo.find({
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
     CupoMaximo: clase.CupoMaximo,
    NumInscritos: clase.NumInscritos,
    Sala: clase.sala?.Descripcion || null,
    HorariosPorDia: clase.horarios.map(
      (h) => `${h.diaSemana?.Dia}: ${h.HoraIni} a ${h.HoraFin}`,
    ),
  }));
}

async generarReporteReservasClases(fechaInicio?: string, fechaFin?: string) {
  const query = this.reservasRepository
    .createQueryBuilder('reserva')
    .leftJoin('reserva.cliente', 'cliente')
    .leftJoin('persona', 'persona', 'persona.CI = cliente.CI')
    .leftJoin('reserva.estado', 'estado')
    .leftJoin('reserva.clase', 'clase')
    .leftJoin('reserva.horario', 'horario')
    .leftJoin('horario.diaSemana', 'diaSemana')
    .select([
      'reserva.IDReserva',
      'reserva.FechaReserva',
      'cliente.CI',
      'persona.Nombre',
      'persona.Apellido',
      'estado.Estado',
      'clase.Nombre',
      'diaSemana.Dia',
      'horario.HoraIni',
      'horario.HoraFin',
    ])
    .orderBy('reserva.FechaReserva', 'DESC');

  if (fechaInicio && fechaFin) {
    query.andWhere('reserva.FechaReserva BETWEEN :inicio AND :fin', {
      inicio: fechaInicio,
      fin: fechaFin,
    });
  }

  const reservas = await query.getRawMany();

  return reservas.map((r) => ({
    IDReserva: r.reserva_IDReserva,
    FechaReserva: r.reserva_FechaReserva,
    Estado: r.estado_Estado,
    Cliente: `${r.persona_Nombre} ${r.persona_Apellido}`,
    CICliente: r.cliente_CI,
    Clase: r.clase_Nombre,
    Dia: r.diaSemana_Dia,
    HoraIni: r.horario_HoraIni,
    HoraFin: r.horario_HoraFin,
  }));
}

async obtenerNombresInstructoresUnicos(): Promise<string[]> {
  const clases = await this.claseRepo.find({
    relations: [
      'claseInstructores',
      'claseInstructores.instructor',
      'claseInstructores.instructor.persona',
    ],
  });

  const nombresSet = new Set<string>();

  for (const clase of clases) {
    for (const ci of clase.claseInstructores) {
      const persona = ci.instructor.persona;
      if (persona) {
        const nombreCompleto = `${persona.Nombre} ${persona.Apellido}`;
        nombresSet.add(nombreCompleto);
      }
    }
  }

  return Array.from(nombresSet);
}


}