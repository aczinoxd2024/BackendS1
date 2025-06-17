// src/paquete-1-usuarios-accesos/gestion-personal/gpersonal.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Personal } from 'paquete-2-servicios-gimnasio/personal/personal.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { UsuarioPerfil } from 'paquete-1-usuarios-accesos/usuarios/usuario-perfil.entity';
import { Perfil } from 'paquete-1-usuarios-accesos/usuarios/perfil.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';

import { CreatePersonalDto } from 'paquete-1-usuarios-accesos/auth/dto/create-personal.dto';

// Importar nuevas entidades para la gestión de horarios
import { HorarioTrabajo } from 'paquete-2-servicios-gimnasio/asistencia/horario-trabajo.entity';
import { HoraLaboral } from 'paquete-2-servicios-gimnasio/asistencia/hora-laboral.entity';
import { DiaSemana } from 'paquete-2-servicios-gimnasio/asistencia/dia-semana.entity';
import { AccionBitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora-actions.enum'; // Importar AccionBitacora
import { UpdatePersonalDto } from '@auth/dto/update-personal.dto';

@Injectable()
export class GpersonalService {
  constructor(
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
    @InjectRepository(Personal)
    private personalRepository: Repository<Personal>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(UsuarioPerfil)
    private usuarioPerfilRepository: Repository<UsuarioPerfil>,
    @InjectRepository(Perfil)
    private perfilRepository: Repository<Perfil>,
    @InjectRepository(Bitacora)
    private bitacoraRepository: Repository<Bitacora>,
    private dataSource: DataSource,
    @InjectRepository(HorarioTrabajo) // Inyectar HorarioTrabajoRepository
    private horarioTrabajoRepository: Repository<HorarioTrabajo>,
    @InjectRepository(HoraLaboral) // Inyectar HoraLaboralRepository
    private horaLaboralRepository: Repository<HoraLaboral>,
    @InjectRepository(DiaSemana) // Inyectar DiaSemanaRepository
    private diaSemanaRepository: Repository<DiaSemana>,
  ) {}

  async crearPersonal(
    dto: CreatePersonalDto,
    idUsuario: string, // Esta variable será usada para la bitácora
    ip: string, // Esta variable será usada para la bitácora
  ): Promise<{ message: string }> {
    console.log('[SERVICIO] Crear Personal → Datos recibidos:', dto);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        CI,
        Nombre,
        Apellido,
        FechaNacimiento,
        Telefono,
        Direccion,
        Cargo,
        FechaContratacion,
        AreaP,
        Sueldo,
        correo,
        horariosTrabajo, // Desestructurar el nuevo campo
      } = dto;

      if (Cargo.toLowerCase().includes('administrador')) {
        console.warn('[❌] Intento de crear administrador no permitido');
        throw new BadRequestException(
          'No está permitido crear un administrador desde este módulo.',
        );
      }

      console.log('→ Creando persona...');
      const persona = this.personaRepository.create({
        CI,
        Nombre,
        Apellido,
        FechaNacimiento,
        Telefono,
        Direccion,
      });
      await queryRunner.manager.save(Persona, persona);
      console.log('✔️ Persona guardada');

      console.log('→ Creando personal...');
      const personal = this.personalRepository.create({
        CI,
        Cargo,
        FechaContratacion,
        AreaP,
        Sueldo,
      });
      await queryRunner.manager.save(Personal, personal);
      console.log('✔️ Personal guardado');

      const hashedPassword = await bcrypt.hash('Cambiar123', 10);

      console.log('→ Creando usuario...');
      const usuario = this.usuarioRepository.create({
        id: CI,
        correo,
        contrasena: hashedPassword,
        idPersona: persona,
        idEstadoU: 1,
      });
      await queryRunner.manager.save(Usuario, usuario);
      console.log('✔️ Usuario creado');

      const nombrePerfil = Cargo.toLowerCase().includes('recepcionista')
        ? 'Recepcionista'
        : 'Instructor';
      console.log(`→ Buscando perfil: ${nombrePerfil}`);
      const perfil = await this.perfilRepository.findOne({
        where: { nombrePerfil },
      });

      if (!perfil) {
        console.error('[❌] Perfil no encontrado');
        throw new NotFoundException(
          `No se encontró el perfil "${nombrePerfil}"`,
        );
      }

      console.log('→ Asignando perfil al usuario...');
      const usuarioPerfil = this.usuarioPerfilRepository.create({
        IDUsuario: usuario.id,
        IDPerfil: perfil.id,
      });
      await queryRunner.manager.save(UsuarioPerfil, usuarioPerfil);
      console.log('✔️ Perfil asignado');

      // NUEVO: Asignar horarios de trabajo
      if (horariosTrabajo && horariosTrabajo.length > 0) {
        console.log('→ Asignando horarios de trabajo...');
        for (const horarioDto of horariosTrabajo) {
          // MODIFICACIÓN 1: Cambiar 'ID' a 'IDDia' al buscar DiaSemana
          const diaSemana = await queryRunner.manager.findOne(DiaSemana, {
            where: { IDDia: horarioDto.idDia },
          });
          if (!diaSemana) {
            throw new BadRequestException(
              `Día de la semana con ID ${horarioDto.idDia} no encontrado.`,
            );
          }

          // Busca si la HoraLaboral ya existe, o crea una nueva
          let horaLaboral = await queryRunner.manager.findOne(HoraLaboral, {
            where: {
              HoraIni: horarioDto.horaInicio,
              HoraFin: horarioDto.horaFin,
            },
          });

          if (!horaLaboral) {
            horaLaboral = this.horaLaboralRepository.create({
              HoraIni: horarioDto.horaInicio,
              HoraFin: horarioDto.horaFin,
            });
            await queryRunner.manager.save(HoraLaboral, horaLaboral);
          }

          const nuevoHorarioTrabajo = this.horarioTrabajoRepository.create({
            IDPersona: CI,
            // MODIFICACIÓN 2: Cambiar 'ID' a 'IDDia' al asignar
            IDDia: diaSemana.IDDia,
            IDHora: horaLaboral.IDHora,
          });
          await queryRunner.manager.save(HorarioTrabajo, nuevoHorarioTrabajo);
        }
        console.log('✔️ Horarios de trabajo asignados.');
      } else {
        console.log('→ No se proporcionaron horarios de trabajo para asignar.');
      }

      // LÍNEA FINAL DE BITÁCORA: Añadir entrada de bitácora para la creación de personal
      await this.bitacoraRepository.save({
        idUsuario: idUsuario,
        accion: AccionBitacora.CREAR_PERSONAL, // Asumiendo que existe esta acción en tu enum
        tablaAfectada: 'persona/personal/usuario/horario_trabajo',
        ipMaquina: ip === '::1' ? 'localhost' : ip,
      });

      await queryRunner.commitTransaction();
      console.log(
        `[✔️] Personal registrado correctamente como ${nombrePerfil}`,
      );

      return {
        message: `Personal registrado correctamente como ${nombrePerfil}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('[❌] Error durante la creación del personal:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ... (rest of the methods) ...

  // ... (resto de los métodos) ...

  //  async listarPersonal(): Promise<Personal[]> {
  //    console.log('[SERVICIO] Listar Personal');
  //    return this.personalRepository.find({ relations: ['persona', 'usuario'] });
  //  }

  async listarPersonal(): Promise<any[]> {
    return this.personalRepository
      .createQueryBuilder('personal')
      .leftJoinAndSelect('personal.persona', 'persona')
      .leftJoinAndMapOne(
        'personal.usuario',
        Usuario,
        'usuario',
        'usuario.idPersona = persona.CI',
      )
      .getMany();
  }

  async obtenerPersonal(ci: string): Promise<Personal> {
    console.log(`[SERVICIO] Obtener Personal CI: ${ci}`);
    const personal = await this.personalRepository.findOne({
      where: { CI: ci },
      relations: ['persona'],
    });

    if (!personal) {
      console.warn(`[⚠️] Personal no encontrado CI: ${ci}`);
      throw new NotFoundException('Personal no encontrado');
    }

    return personal;
  }

  async actualizarPersonal(
    ci: string,
    dto: UpdatePersonalDto,
    idUsuario: string,
    ip: string,
  ): Promise<{ message: string }> {
    console.log(`[SERVICIO] Actualizar Personal CI: ${ci}`);
    console.log('→ Datos recibidos:', dto);

    const persona = await this.personaRepository.findOne({ where: { CI: ci } });
    const personal = await this.personalRepository.findOne({
      where: { CI: ci },
    });

    if (!persona || !personal) {
      console.warn(`[⚠️] Personal o persona no encontrado para CI: ${ci}`);
      throw new NotFoundException('Personal no encontrado');
    }

    Object.assign(persona, {
      ...(dto.Nombre && { Nombre: dto.Nombre }),
      ...(dto.Apellido && { Apellido: dto.Apellido }),
      ...(dto.FechaNacimiento && { FechaNacimiento: dto.FechaNacimiento }),
      ...(dto.Telefono && { Telefono: dto.Telefono }),
      ...(dto.Direccion && { Direccion: dto.Direccion }),
    });

    Object.assign(personal, {
      ...(dto.Cargo && { Cargo: dto.Cargo }),
      ...(dto.FechaContratacion && {
        FechaContratacion: dto.FechaContratacion,
      }),
      ...(dto.AreaP && { AreaP: dto.AreaP }),
      ...(dto.Sueldo !== undefined && { Sueldo: dto.Sueldo }),
    });

    await this.personaRepository.save(persona);
    await this.personalRepository.save(personal);

    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Actualizó datos del personal con CI ${ci}`,
      tablaAfectada: 'persona/personal',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
    });

    console.log('✔️ Personal actualizado y bitácora registrada');
    return { message: 'Personal actualizado correctamente' };
  }

  async desactivarPersonal(
    ci: string,
    idUsuario: string,
    ip: string,
  ): Promise<{ message: string }> {
    console.log(`[SERVICIO] Desactivar personal CI: ${ci}`);
    const usuario = await this.usuarioRepository.findOne({
      where: { idPersona: { CI: ci } },
    });

    if (!usuario) {
      console.warn('[⚠️] Usuario no encontrado para desactivación');
      throw new NotFoundException('Usuario no encontrado para este personal');
    }

    usuario.idEstadoU = 2;
    await this.usuarioRepository.save(usuario);

    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Eliminó/desactivó al personal con CI ${ci}`,
      tablaAfectada: 'usuario',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
    });

    console.log('✔️ Personal desactivado y bitácora registrada');
    return { message: 'Personal desactivado correctamente (acceso denegado)' };
  }

  async reactivarPersonal(
    ci: string,
    idUsuario: string,
    ip: string,
  ): Promise<{ message: string }> {
    console.log(`[SERVICIO] Reactivar personal CI: ${ci}`);
    const usuario = await this.usuarioRepository.findOne({
      where: { idPersona: { CI: ci } },
    });

    if (!usuario) {
      console.warn('[⚠️] Usuario no encontrado para reactivación');
      throw new NotFoundException('Usuario no encontrado para este personal');
    }

    usuario.idEstadoU = 1;
    await this.usuarioRepository.save(usuario);

    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Reactivó al personal con CI ${ci}`,
      tablaAfectada: 'usuario',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
    });

    console.log('✔️ Personal reactivado y bitácora registrada');
    return { message: 'Personal reactivado correctamente' };
  }
}
