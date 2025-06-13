import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personal } from './personal.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { HoraLaboral } from 'paquete-2-servicios-gimnasio/asistencia/hora-laboral.entity';
import { HorarioTrabajo } from 'paquete-2-servicios-gimnasio/asistencia/horario-trabajo.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';
import { AsistenciaPersonal } from './asistencia_personal.entity';

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

    @InjectRepository(AsistenciaPersonal)
    private readonly asistenciaRepo: Repository<AsistenciaPersonal>,

    @InjectRepository(Bitacora)
    private readonly bitacoraRepo: Repository<Bitacora>,
  ) {}

  async findAll(): Promise<Personal[]> {
    this.logger.log('Listando todo el personal');
    return this.personalRepo.find();
  }

  async findOne(ci: string): Promise<Personal> {
    const persona = await this.personalRepo.findOneBy({ CI: ci });
    if (!persona) {
      this.logger.warn(`No se encontró personal con CI ${ci}`);
      throw new NotFoundException('Personal no encontrado');
    }
    return persona;
  }

  async generarTarjetaPersonal(ci: string) {
    const personal = await this.personalRepo.findOne({ where: { CI: ci } });
    const persona = await this.personaRepo.findOne({ where: { CI: ci } });

    if (!personal || !persona) {
      this.logger.error(`Datos de personal no encontrados para CI ${ci}`);
      throw new NotFoundException('Datos de personal no encontrados');
    }

    const hoy = new Date();
    const dia = hoy.getDay();
    const idDia = dia === 0 ? 7 : dia;
    const horaActual = hoy.toTimeString().split(' ')[0];

    const horarios = await this.horarioTrabajoRepo
      .createQueryBuilder('ht')
      .innerJoin(HoraLaboral, 'hl', 'ht.IDHora = hl.ID')
      .where('ht.IDPersona = :ci AND ht.IDDia = :idDia', { ci, idDia })
      .select(['hl.HoraInicio as horaInicio', 'hl.HoraFinal as horaFin'])
      .getRawMany();

    const clase = await this.personalRepo.query(
      `
      SELECT c.Nombre AS clase, h.HoraIni
      FROM clase_instructor ci
      JOIN clase c ON c.IDClase = ci.IDClase
      JOIN horario h ON h.IDClases = c.IDClase
      JOIN dia_semana ds ON h.IDDia = ds.ID
      WHERE ci.CI = ?
        AND ds.Dia = ELT(WEEKDAY(CURDATE())+1, 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo')
        AND TIME(NOW()) BETWEEN SUBTIME(h.HoraIni, '00:30:00') AND h.HoraIni
      LIMIT 1
      `,
      [ci],
    );

    const asistenciaHabilitada = clase.length > 0;

    return {
      ci: persona.CI,
      nombre: `${persona.Nombre} ${persona.Apellido}`,
      cargo: personal.Cargo,
      fecha: hoy.toLocaleDateString('es-BO'),
      horarioHoy: horarios,
      asistenciaHabilitada,
      claseAsignada: asistenciaHabilitada ? clase[0].clase : null,
      qrData: persona.CI,
    };
  }

  async registrarAsistenciaDesdeQR(ci: string) {
    const now = new Date();
    const dia = now.getDay();
    const idDia = dia === 0 ? 7 : dia;
    const horaActualStr = now.toTimeString().split(' ')[0];
    const horaActual = new Date(`1970-01-01T${horaActualStr}Z`);

    const yaRegistrado = await this.asistenciaRepo.findOne({
      where: {
        ci: ci,
        fecha: new Date(now.toDateString()),
      },
    });

    if (yaRegistrado) {
      this.logger.warn(`❌ Asistencia ya registrada hoy para CI ${ci}`);
      throw new UnauthorizedException('Ya registraste tu asistencia hoy');
    }

    const horario = await this.horarioTrabajoRepo
      .createQueryBuilder('ht')
      .innerJoin(HoraLaboral, 'hl', 'ht.IDHora = hl.ID')
      .where('ht.IDPersona = :ci AND ht.IDDia = :idDia', { ci, idDia })
      .select(['hl.HoraInicio as horaInicio'])
      .getRawOne();

    if (!horario) {
      throw new UnauthorizedException('No tienes horario registrado para hoy');
    }

    const horaInicio = new Date(`1970-01-01T${horario.horaInicio}Z`);
    const minutosDiferencia =
      (horaActual.getTime() - horaInicio.getTime()) / 60000;

    let estado = 'Puntual';
    if (minutosDiferencia > 10 && minutosDiferencia <= 30) {
      estado = 'Con Retraso';
    } else if (minutosDiferencia > 30) {
      this.logger.warn(
        `⛔ Asistencia fuera del rango permitido para CI ${ci} (Minutos: ${minutosDiferencia})`,
      );
      throw new UnauthorizedException(
        'Superaste el tiempo permitido para registrar asistencia',
      );
    }

    const nuevaAsistencia = this.asistenciaRepo.create({
      ci,
      fecha: now,
      horaEntrada: horaActualStr,
      estado,
    });

    await this.asistenciaRepo.save(nuevaAsistencia);

    await this.bitacoraRepo.save({
      idUsuario: ci,
      accion: `Registro de entrada (${estado}) por QR`,
      tablaAfectada: 'asistencia_personal',
      ipMaquina: '127.0.0.1',
    });

    this.logger.log(
      `✅ Asistencia (${estado}) registrada correctamente para CI ${ci}`,
    );
    return {
      mensaje: `✅ Asistencia (${estado}) registrada correctamente`,
      hora: horaActualStr,
    };
  }

  async obtenerAsistenciasDelPersonal(ci: string) {
    const asistencias = await this.asistenciaRepo.find({
      where: { ci },
      order: { fecha: 'DESC' },
    });

    if (!asistencias || asistencias.length === 0) {
      throw new NotFoundException(
        'Este personal no tiene asistencias registradas',
      );
    }

    return asistencias;
  }

  async obtenerAsistenciasDelDia() {
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];

    const asistencias = await this.asistenciaRepo
      .createQueryBuilder('asis')
      .where('asis.fecha = :fecha', { fecha: fechaHoy })
      .orderBy('asis.horaEntrada', 'ASC')
      .getMany();

    if (!asistencias || asistencias.length === 0) {
      throw new NotFoundException('No hay asistencias registradas hoy');
    }

    return asistencias;
  }

  async registrarSalidaDesdeQR(ci: string) {
    const now = new Date();
    const horaActual = now.toTimeString().split(' ')[0];
    const fechaHoy = new Date(now.toDateString());

    const asistencia = await this.asistenciaRepo.findOne({
      where: {
        ci,
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
      tablaAfectada: 'asistencia_personal',
      ipMaquina: '127.0.0.1',
    });

    this.logger.log(`✅ Salida registrada correctamente para CI ${ci}`);
    return {
      mensaje: '✅ Salida registrada correctamente',
      hora: horaActual,
    };
  }
}
