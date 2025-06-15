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
import { Request } from 'express';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { toZonedTime, format } from 'date-fns-tz';

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
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

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

    const horarios = await this.horarioTrabajoRepo
      .createQueryBuilder('ht')
      .innerJoin(HoraLaboral, 'hl', 'ht.IDHora = hl.ID')
      .where('ht.IDPersona = :ci AND ht.IDDia = :idDia', { ci, idDia })
      .select(['hl.HoraInicio as horaInicio', 'hl.HoraFinal as horaFin'])
      .getRawMany();

    const clase = (await this.personalRepo.query(
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
    )) as { clase: string; HoraIni: string }[];

    const asistenciaHabilitada = clase.length > 0;

    return {
      ci: persona.CI,
      nombre: `${persona.Nombre} ${persona.Apellido}`,
      cargo: personal.Cargo,
      fecha: hoy.toLocaleDateString('es-BO'),
      horarioHoy: horarios,
      asistenciaHabilitada,
      claseAsignada: asistenciaHabilitada ? clase[0].clase : null,
      qrData: JSON.stringify({
        ci: persona.CI,
        nombre: `${persona.Nombre} ${persona.Apellido}`,
        cargo: personal.Cargo,
      }),
    };
  }
  async registrarAsistenciaDesdeQR(
    ciEscaneado: string,
    ciResponsable: string,
    ip?: string,
  ) {
    const zonaBolivia = 'America/La_Paz';
    const nowUtc = new Date();
    const now = toZonedTime(nowUtc, zonaBolivia);
    const horaActualStr = format(now, 'HH:mm:ss'); // formato hora local
    const idDia = now.getDay() === 0 ? 7 : now.getDay();

    console.log(`📥 Iniciando registro de asistencia`);
    console.log(`CI escaneado: ${ciEscaneado}`);
    console.log(`Responsable (CI): ${ciResponsable}`);
    console.log(`Hora actual (BO): ${horaActualStr}`);
    console.log(`IP: ${ip || '127.0.0.1'}`);

    // 🔍 Buscar ID del usuario responsable
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .innerJoinAndSelect('usuario.idPersona', 'persona')
      .where('persona.CI = :ci', { ci: ciResponsable })
      .getOne();

    if (!usuario) {
      this.logger.warn(`⚠️ No se encontró usuario con CI ${ciResponsable}`);
      throw new NotFoundException('Usuario responsable no registrado');
    }

    const yaRegistrado = await this.asistenciaRepo.findOne({
      where: {
        ci: ciEscaneado,
        fecha: new Date(now.toDateString()),
      },
    });

    if (yaRegistrado) {
      this.logger.warn(
        `❌ Asistencia ya registrada hoy para CI ${ciEscaneado}`,
      );
      throw new UnauthorizedException('Ya registraste tu asistencia hoy');
    }

    const horario = (await this.horarioTrabajoRepo
      .createQueryBuilder('ht')
      .innerJoin(HoraLaboral, 'hl', 'ht.IDHora = hl.ID')
      .where('ht.IDPersona = :ci AND ht.IDDia = :idDia', {
        ci: ciEscaneado,
        idDia,
      })
      .select(['hl.HoraInicio as horaInicio'])
      .getRawOne()) as { horaInicio: string };

    if (!horario) {
      this.logger.warn(`⚠️ No se encontró horario para hoy CI ${ciEscaneado}`);
      throw new UnauthorizedException('No tienes horario registrado para hoy');
    }

    const horaInicio = new Date(`1970-01-01T${horario.horaInicio}:00Z`);
    const horaActual = new Date(`1970-01-01T${horaActualStr}Z`);
    const minutosDiferencia =
      (horaActual.getTime() - horaInicio.getTime()) / 60000;

    let estado = 'Puntual';
    if (minutosDiferencia > 10 && minutosDiferencia <= 30) {
      estado = 'Con Retraso';
    } else if (minutosDiferencia > 30) {
      this.logger.warn(
        `⛔ Fuera de rango (min: ${minutosDiferencia.toFixed(
          1,
        )}) para CI: ${ciEscaneado}`,
      );
      throw new UnauthorizedException(
        'Superaste el tiempo permitido para registrar asistencia',
      );
    }

    console.log(`⏱ Estado calculado: ${estado}`);

    const nuevaAsistencia = this.asistenciaRepo.create({
      ci: ciEscaneado,
      fecha: now,
      horaEntrada: horaActualStr,
      estado,
      idUsuario: usuario.id,
    });

    await this.asistenciaRepo.save(nuevaAsistencia);
    console.log(`✅ Asistencia guardada en BD`);

    const ipFinal = ip || '127.0.0.1';

    await this.bitacoraRepo.save({
      idUsuario: usuario.id,
      accion: `Registro de entrada (${estado}) del personal CI ${ciEscaneado} (escaneado por usuario CI ${ciResponsable})`,
      tablaAfectada: 'asistencia_personal',
      ipMaquina: ipFinal,
    });

    console.log(`📝 Bitácora registrada para usuario ${usuario.id}`);
    this.logger.log(
      `✅ Asistencia (${estado}) registrada correctamente para CI ${ciEscaneado}`,
    );

    return {
      mensaje: `✅ Asistencia (${estado}) registrada correctamente`,
      hora: horaActualStr,
    };
  }

  async obtenerAsistenciasDelPersonal(ci: string) {
    const asistencias = await this.asistenciaRepo.find({
      where: { ci },
      relations: ['persona', 'responsable'], // ✅ incluye el usuario que registró
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
    const zonaBolivia = 'America/La_Paz';
    const nowUtc = new Date();
    const now = toZonedTime(nowUtc, zonaBolivia);
    const fechaHoy = new Date(now.toDateString());

    const asistencias = await this.asistenciaRepo.find({
      where: { fecha: fechaHoy },
      relations: ['persona', 'responsable'],
      order: { horaEntrada: 'ASC' },
    });

    if (!asistencias || asistencias.length === 0) {
      throw new NotFoundException('No hay asistencias registradas hoy');
    }

    return asistencias;
  }
  probarZonaHoraria() {
    const nowUtc: Date = new Date();
    const zonaBolivia = 'America/La_Paz';

    // ✅ Usar toZonedTime en lugar de utcToZonedTime
    const fechaBolivia = toZonedTime(nowUtc, zonaBolivia);

    const fechaFormateada = format(fechaBolivia, 'yyyy-MM-dd HH:mm:ssXXX', {
      timeZone: zonaBolivia,
    });

    console.log('🕓 Hora UTC:', nowUtc.toISOString());
    console.log('🇧🇴 Hora Bolivia:', fechaFormateada);

    return {
      utc: nowUtc.toISOString(),
      bolivia: fechaFormateada,
    };
  }

  async registrarSalida(
    ciEscaneado: string,
    ciResponsable: string,
    ip?: string,
  ) {
    const zonaBolivia = 'America/La_Paz';
    const nowUtc = new Date();
    const now = toZonedTime(nowUtc, zonaBolivia);
    const fechaHoy = new Date(now.toDateString());
    const horaSalida = format(now, 'HH:mm:ss');

    console.log('📤 Iniciando registro de salida');
    console.log(`CI escaneado: ${ciEscaneado}`);
    console.log(`Responsable (CI): ${ciResponsable}`);
    console.log(`Hora salida (BO): ${horaSalida}`);
    console.log(`IP: ${ip || '127.0.0.1'}`);

    const asistencia = await this.asistenciaRepo.findOne({
      where: {
        ci: ciEscaneado,
        fecha: fechaHoy,
      },
    });

    if (!asistencia) {
      this.logger.warn(
        `⚠️ No se encontró asistencia registrada para CI ${ciEscaneado} hoy`,
      );
      throw new NotFoundException('No tienes una asistencia registrada hoy');
    }

    if (asistencia.horaSalida) {
      this.logger.warn(`⚠️ Ya se registró la salida para CI ${ciEscaneado}`);
      throw new UnauthorizedException('Ya registraste tu salida hoy');
    }

    const usuarioResponsable = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .innerJoinAndSelect('usuario.idPersona', 'persona')
      .where('persona.CI = :ci', { ci: ciResponsable })
      .getOne();

    if (!usuarioResponsable) {
      this.logger.warn(
        `⚠️ No se encontró usuario con CI responsable ${ciResponsable}`,
      );
      throw new NotFoundException('Usuario responsable no registrado');
    }

    asistencia.horaSalida = horaSalida;
    asistencia.idUsuario = usuarioResponsable.id;
    await this.asistenciaRepo.save(asistencia);

    const ipFinal = ip || '127.0.0.1';

    await this.bitacoraRepo.save({
      idUsuario: usuarioResponsable.id,
      accion: `Registro de salida del personal CI ${ciEscaneado} (escaneado por usuario CI ${ciResponsable})`,
      tablaAfectada: 'asistencia_personal',
      ipMaquina: ipFinal,
    });

    console.log(`📝 Bitácora registrada para salida de CI ${ciEscaneado}`);
    this.logger.log(
      `📤 Salida registrada correctamente para CI ${ciEscaneado}`,
    );

    return {
      mensaje: '📤 Salida registrada correctamente',
      hora: horaSalida,
    };
  }
}
