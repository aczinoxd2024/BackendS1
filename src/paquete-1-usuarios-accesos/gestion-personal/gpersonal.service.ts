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
import { UpdatePersonalDto } from 'paquete-1-usuarios-accesos/auth/dto/update-personal.dto';

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
  ) {}

  async crearPersonal(
    dto: CreatePersonalDto,
    idUsuario: string,
    ip: string,
  ): Promise<string> {
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
      } = dto;

      if (Cargo.toLowerCase().includes('administrador')) {
        throw new BadRequestException(
          'No está permitido crear un administrador desde este módulo.',
        );
      }

      const persona = this.personaRepository.create({
        CI,
        Nombre,
        Apellido,
        FechaNacimiento,
        Telefono,
        Direccion,
      });
      await queryRunner.manager.save(Persona, persona);

      const personal = this.personalRepository.create({
        CI,
        Cargo,
        FechaContratacion,
        AreaP,
        Sueldo,
      });
      await queryRunner.manager.save(Personal, personal);

      const hashedPassword = await bcrypt.hash('Cambiar123', 10);

      const usuario = this.usuarioRepository.create({
        id: CI,
        correo,
        contrasena: hashedPassword,
        idPersona: persona,
        idEstadoU: 1,
      });
      await queryRunner.manager.save(Usuario, usuario);

      const nombrePerfil = Cargo.toLowerCase().includes('recepcionista')
        ? 'Recepcionista'
        : 'Instructor';

      const perfil = await this.perfilRepository.findOne({
        where: { nombrePerfil },
      });

      if (!perfil) {
        throw new NotFoundException(`No se encontró el perfil "${nombrePerfil}"`);
      }

      const usuarioPerfil = this.usuarioPerfilRepository.create({
        IDUsuario: usuario.id,
        IDPerfil: perfil.id,
      });
      await queryRunner.manager.save(UsuarioPerfil, usuarioPerfil);

      await queryRunner.commitTransaction();
      return `Personal registrado correctamente como ${nombrePerfil}`;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listarPersonal(): Promise<Personal[]> {
    return this.personalRepository.find({
      relations: ['persona'],
    });
  }

  async obtenerPersonal(ci: string): Promise<Personal> {
    const personal = await this.personalRepository.findOne({
      where: { CI: ci },
      relations: ['persona'],
    });

    if (!personal) {
      throw new NotFoundException('Personal no encontrado');
    }

    return personal;
  }

  async actualizarPersonal(
    ci: string,
    dto: UpdatePersonalDto,
    idUsuario: string,
    ip: string,
  ): Promise<string> {
    const persona = await this.personaRepository.findOne({ where: { CI: ci } });
    const personal = await this.personalRepository.findOne({ where: { CI: ci } });

    if (!persona || !personal) {
      throw new NotFoundException('Personal no encontrado');
    }

    Object.assign(persona, dto);
    Object.assign(personal, dto);

    await this.personaRepository.save(persona);
    await this.personalRepository.save(personal);

    return 'Personal actualizado correctamente';
  }

  async desactivarPersonal(
    ci: string,
    idUsuario: string,
    ip: string,
  ): Promise<string> {
    console.log(`➡️ Desactivando personal con CI: ${ci}`);
    console.log(`🧾 Usuario que realiza la acción (idUsuario): ${idUsuario}`);

    const usuario = await this.usuarioRepository.findOne({
      where: { idPersona: { CI: ci } },
    });

    console.log('👤 Usuario encontrado para desactivar:', usuario);

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado para este personal');
    }

    usuario.idEstadoU = 2; // Estado Inactivo
    await this.usuarioRepository.save(usuario);
    console.log('🚫 Usuario actualizado como inactivo');

    // Verificar que el idUsuario que ejecuta la acción exista
    const usuarioAdmin = await this.usuarioRepository.findOne({
      where: { id: idUsuario },
    });

    if (!usuarioAdmin) {
      console.warn(`⚠️ El idUsuario "${idUsuario}" no existe en la tabla usuario`);
      throw new NotFoundException('El usuario que realiza esta acción no existe');
    }

    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Eliminó/desactivó al personal con CI ${ci}`,
      tablaAfectada: 'usuario',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
    });

    console.log('📝 Bitácora registrada correctamente');

    return 'Personal desactivado correctamente (acceso denegado)';
  }
}
