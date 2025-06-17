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
// Asegúrate de que esta sea la entidad Personal correcta (la que tiene relaciones con clases, etc.)
import { Personal } from 'paquete-2-servicios-gimnasio/personal/personal.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { UsuarioPerfil } from 'paquete-1-usuarios-accesos/usuarios/usuario-perfil.entity';
import { Perfil } from 'paquete-1-usuarios-accesos/usuarios/perfil.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';

import { CreatePersonalDto } from 'paquete-1-usuarios-accesos/auth/dto/create-personal.dto';

// Importar nuevas entidades para la gestión de horarios
import { HorarioTrabajo } from 'paquete-2-servicios-gimnasio/asistencia/horario-trabajo.entity';
import { HoraLaboral } from 'paquete-2-servicios-gimnasio/asistencia/hora-laboral.entity';
import { DiaSemana } from 'paquete-2-servicios-gimnasio/dia-semana/dia-semana.entity';
import { AccionBitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora-actions.enum';
import { UpdatePersonalDto } from '@auth/dto/update-personal.dto'; // Asegúrate de que esta ruta sea correcta

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
    @InjectRepository(HorarioTrabajo)
    private horarioTrabajoRepository: Repository<HorarioTrabajo>,
    @InjectRepository(HoraLaboral)
    private horaLaboralRepository: Repository<HoraLaboral>,
    @InjectRepository(DiaSemana)
    private diaSemanaRepository: Repository<DiaSemana>,
  ) {}

  async crearPersonal(
    dto: CreatePersonalDto,
    idUsuario: string,
    ip: string,
  ): Promise<{ message: string }> {
    console.log('--- INICIO DE CREACIÓN DE PERSONAL ---');
    console.log(
      '[SERVICIO] Crear Personal → Datos recibidos completos (DTO):',
      JSON.stringify(dto, null, 2),
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    console.log('--- Transacción iniciada ---');

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
        horariosTrabajo,
      } = dto;

      console.log(
        `[DEBUG] Desestructuración - CI: ${CI}, Correo: ${correo}, Horarios: ${horariosTrabajo ? horariosTrabajo.length : 0}`,
      );

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
      console.log('✔️ Persona guardada. CI de Persona:', persona.CI);

      console.log('→ Creando personal...');
      const personal = this.personalRepository.create({
        CI,
        Cargo,
        FechaContratacion,
        AreaP,
        Sueldo,
      });
      await queryRunner.manager.save(Personal, personal);
      console.log('✔️ Personal guardado. CI de Personal:', personal.CI);

      const hashedPassword = await bcrypt.hash('Cambiar123', 10);
      console.log('→ Contraseña hasheada.');

      console.log('→ Creando usuario...');
      const usuario = this.usuarioRepository.create({
        id: CI, // Asumimos que el ID de usuario es el CI
        correo,
        contrasena: hashedPassword,
        idPersona: persona,
        idEstadoU: 1,
      });
      await queryRunner.manager.save(Usuario, usuario);
      console.log(
        '✔️ Usuario creado. ID de Usuario:',
        usuario.id,
        ' Correo:',
        usuario.correo,
      );

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
      console.log(
        '✔️ Perfil asignado. IDUsuarioPerfil:',
        usuarioPerfil.IDUsuario,
      );

      // NUEVO: Asignar horarios de trabajo
      if (horariosTrabajo && horariosTrabajo.length > 0) {
        console.log('→ Asignando horarios de trabajo...');
        for (const [index, horarioDto] of horariosTrabajo.entries()) {
          console.log(
            `[DEBUG] Procesando Horario #${index + 1}: IDDia=${horarioDto.idDia}, HoraInicio=${horarioDto.horaInicio}, HoraFin=${horarioDto.horaFin}`,
          );

          // CORRECCIÓN: Buscar DiaSemana por su ID de columna 'ID'
          const diaSemana = await queryRunner.manager.findOne(DiaSemana, {
            where: { ID: horarioDto.idDia }, // <-- ¡CORREGIDO AQUÍ! (usa DiaSemana.ID)
          });
          if (!diaSemana) {
            console.error(
              `[❌] Día de la semana con ID ${horarioDto.idDia} no encontrado en la BD.`,
            );
            throw new BadRequestException(
              `Día de la semana con ID ${horarioDto.idDia} no encontrado.`,
            );
          }
          console.log(
            `[DEBUG] Día Semana encontrado: ID=${diaSemana.ID}, Nombre=${diaSemana.Dia}`,
          );

          // Busca si la HoraLaboral ya existe, o crea una nueva
          let horaLaboral = await queryRunner.manager.findOne(HoraLaboral, {
            where: {
              HoraIni: horarioDto.horaInicio,
              HoraFin: horarioDto.horaFin,
            },
          });

          if (!horaLaboral) {
            console.log(
              `[DEBUG] HoraLaboral no existente, creando nueva: ${horarioDto.horaInicio}-${horarioDto.horaFin}`,
            );
            horaLaboral = this.horaLaboralRepository.create({
              HoraIni: horarioDto.horaInicio,
              HoraFin: horarioDto.horaFin,
            });
            await queryRunner.manager.save(HoraLaboral, horaLaboral);
            console.log('✔️ HoraLaboral creada. IDHora:', horaLaboral.IDHora);
          } else {
            console.log(
              `[DEBUG] HoraLaboral existente encontrada. IDHora: ${horaLaboral.IDHora}`,
            );
          }

          const nuevoHorarioTrabajo = this.horarioTrabajoRepository.create({
            IDPersona: CI,
            // CORRECCIÓN: Asignar a IDDia el ID de la entidad DiaSemana
            IDDia: diaSemana.ID, // <-- ¡CORREGIDO AQUÍ! (usa DiaSemana.ID)
            // CORRECCIÓN: Asignar a IDHora el IDHora de la entidad HoraLaboral
            IDHora: horaLaboral.IDHora, // <-- ¡CORREGIDO AQUÍ! (usa HoraLaboral.IDHora)
          });
          await queryRunner.manager.save(HorarioTrabajo, nuevoHorarioTrabajo);
          console.log(
            `✔️ HorarioTrabajo guardado para IDPersona: ${nuevoHorarioTrabajo.IDPersona}, IDDia: ${nuevoHorarioTrabajo.IDDia}, IDHora: ${nuevoHorarioTrabajo.IDHora}`,
          );
        }
        console.log('✔️ Horarios de trabajo asignados.');
      } else {
        console.log('→ No se proporcionaron horarios de trabajo para asignar.');
      }

      // LÍNEA FINAL DE BITÁCORA: Añadir entrada de bitácora para la creación de personal
      await this.bitacoraRepository.save({
        idUsuario: idUsuario,
        accion: AccionBitacora.CREAR_PERSONAL,
        tablaAfectada: 'persona/personal/usuario/horario_trabajo',
        ipMaquina: ip === '::1' ? 'localhost' : ip,
      });
      console.log('✔️ Entrada de bitácora registrada.');

      await queryRunner.commitTransaction();
      console.log('--- Transacción confirmada (COMMIT) ---');
      console.log(
        `[✔️] Personal registrado correctamente como ${nombrePerfil}`,
      );

      return {
        message: `Personal registrado correctamente como ${nombrePerfil}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('--- TRANSACCIÓN REVERTIDA (ROLLBACK) ---');
      console.error('[❌] Error durante la creación del personal:', error);
      // Para errores específicos de DB, puedes loguear más detalles:
      if (error.code === 'ER_DUP_ENTRY') {
        // Ejemplo para MySQL: clave duplicada
        console.error(`[DB ERROR] Clave duplicada: ${error.sqlMessage}`);
      }
      throw error;
    } finally {
      await queryRunner.release();
      console.log('--- QueryRunner liberado ---');
      console.log('--- FIN DE CREACIÓN DE PERSONAL ---');
    }
  }

  // ... (resto de los métodos como listarPersonal, obtenerPersonal, actualizarPersonal, desactivarPersonal, reactivarPersonal) ...
  // No hay cambios en los métodos restantes de este archivo
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
