import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personal } from './personal.entity';
import { Persona } from '../../paquete-1-usuarios-accesos/personas/persona.entity';
import { HoraLaboral } from 'paquete-2-servicios-gimnasio/asistencia/hora-laboral.entity';
import { HorarioTrabajo } from 'paquete-2-servicios-gimnasio/asistencia/horario-trabajo.entity';
import { Asistencia } from 'paquete-2-servicios-gimnasio/asistencia/asistencia.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';

@Injectable()
export class PersonalService {
  private readonly logger = new Logger(PersonalService.name);

  constructor(
    @InjectRepository(Personal)
    private readonly personalRepo: Repository<Personal>,

    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,

    @InjectRepository(HorarioTrabajo)
    private readonly horarioTrabajoRepo: Repository<HorarioTrabajo>,

    @InjectRepository(HoraLaboral)
    private readonly horaLaboralRepo: Repository<HoraLaboral>,

    @InjectRepository(Asistencia)
    private readonly asistenciaRepo: Repository<Asistencia>,

    @InjectRepository(Bitacora)
    private readonly bitacoraRepo: Repository<Bitacora>,
  ) {}

  // ✅ Listar todo el personal
  findAll(): Promise<Personal[]> {
    this.logger.log('Listando todo el personal');
    return this.personalRepo.find();
  }

  // ✅ Buscar personal por CI
  async findOne(ci: string): Promise<Personal> {
    const persona = await this.personalRepo.findOneBy({ CI: ci });
    if (!persona) {
      this.logger.warn(`No se encontró personal con CI ${ci}`);
      throw new NotFoundException('Personal no encontrado');
    }
    return persona;
  }

  // ✅ Generar datos para tarjeta virtual del personal
  async generarTarjetaPersonal(ci: string) {
    const personal = await this.personalRepo.findOne({ where: { CI: ci } });
    const persona = await this.personaRepo.findOne({ where: { CI: ci } });

    if (!personal || !persona) {
      this.logger.error(`Datos de personal no encontrados para CI ${ci}`);
      throw new NotFoundException('Datos de personal no encontrados');
    }

    const dia = new Date().getDay(); // Domingo = 0
    const idDia = dia === 0 ? 7 : dia;

    const horarios = await this.horarioTrabajoRepo
      .createQueryBuilder('ht')
      .innerJoin(HoraLaboral, 'hl', 'ht.IDHora = hl.ID')
      .where('ht.IDPersona = :ci AND ht.IDDia = :idDia', { ci, idDia })
      .select(['hl.HoraInicio as horaInicio', 'hl.HoraFinal as horaFin'])
      .getRawMany();

    return {
      ci: persona.CI,
      nombre: `${persona.Nombre} ${persona.Apellido}`,
      cargo: personal.Cargo,
      fecha: new Date().toLocaleDateString('es-BO'),
      horarioHoy: horarios,
      qrData: persona.CI,
    };
  }

  // ✅ Registrar entrada
  async registrarAsistenciaDesdeQR(ci: string) {
    const now = new Date();
    const dia = now.getDay();
    const idDia = dia === 0 ? 7 : dia;
    const horaActual = now.toTimeString().split(' ')[0]; // HH:MM:SS

    const yaRegistrado = await this.asistenciaRepo.findOne({
      where: {
        CI: ci,
        fecha: new Date(now.toDateString()),
      },
    });

    if (yaRegistrado) {
      this.logger.warn(`❌ Asistencia ya registrada hoy para CI ${ci}`);
      throw new UnauthorizedException('Ya registraste tu asistencia hoy');
    }

    const coincidencias = await this.horarioTrabajoRepo
      .createQueryBuilder('ht')
      .innerJoin(HoraLaboral, 'hl', 'ht.IDHora = hl.ID')
      .where('ht.IDPersona = :ci AND ht.IDDia = :idDia', { ci, idDia })
      .andWhere(':horaActual BETWEEN hl.HoraInicio AND hl.HoraFinal', {
        horaActual,
      })
      .getCount();

    if (coincidencias === 0) {
      this.logger.warn(
        `⛔ Intento de asistencia fuera de horario para CI ${ci} a las ${horaActual}`,
      );
      throw new UnauthorizedException(
        'No estás dentro de tu horario laboral para registrar asistencia',
      );
    }

    const nuevaAsistencia = this.asistenciaRepo.create({
      CI: ci,
      fecha: now,
      horaEntrada: horaActual,
      idTipoPer: 2, // Personal
    });

    await this.asistenciaRepo.save(nuevaAsistencia);

    await this.bitacoraRepo.save({
      idUsuario: ci,
      accion: 'Registro de entrada por QR',
      tablaAfectada: 'asistencia',
      ipMaquina: '127.0.0.1',
    });

    this.logger.log(`✅ Asistencia registrada correctamente para CI ${ci}`);
    return {
      mensaje: '✅ Asistencia registrada correctamente',
      hora: horaActual,
    };
  }

  // ✅ Registrar salida
  async registrarSalidaDesdeQR(ci: string) {
    const now = new Date();
    const horaActual = now.toTimeString().split(' ')[0];
    const fechaHoy = new Date(now.toDateString());

    const asistencia = await this.asistenciaRepo.findOne({
      where: {
        CI: ci,
        fecha: fechaHoy,
      },
    });

    if (!asistencia) {
      this.logger.warn(
        `⛔ No se encontró asistencia previa para salida de CI ${ci}`,
      );
      throw new NotFoundException('No se encontró asistencia registrada hoy');
    }

    if (asistencia.horaSalida) {
      this.logger.warn(`⚠️ El personal con CI ${ci} ya registró su salida`);
      throw new UnauthorizedException('Ya registraste tu salida hoy');
    }

    asistencia.horaSalida = horaActual;
    await this.asistenciaRepo.save(asistencia);

    await this.bitacoraRepo.save({
      idUsuario: ci,
      accion: 'Registro de salida por QR',
      tablaAfectada: 'asistencia',
      ipMaquina: '127.0.0.1',
    });

    this.logger.log(`✅ Salida registrada correctamente para CI ${ci}`);
    return {
      mensaje: '✅ Salida registrada correctamente',
      hora: horaActual,
    };
  }
}
