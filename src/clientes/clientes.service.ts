import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Cliente } from './cliente.entity';
import { Persona } from '../personas/persona.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuarioPerfil } from '../usuarios/usuario-perfil.entity';
import { Perfil } from '../usuarios/perfil.entity';
import { Bitacora } from '../bitacora/bitacora.entity';
import { Membresia } from '../membresias/menbresia.entity';

import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TipoMembresia } from 'src/membresias/Tipos/menbresia.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,

    @InjectRepository(Persona)
    private personasRepository: Repository<Persona>,

    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,

    @InjectRepository(UsuarioPerfil)
    private usuarioPerfilRepository: Repository<UsuarioPerfil>,

    @InjectRepository(Perfil)
    private perfilesRepository: Repository<Perfil>,

    @InjectRepository(Bitacora)
    private bitacoraRepository: Repository<Bitacora>,

    @InjectRepository(TipoMembresia)
    private tipoMembresiaRepository: Repository<TipoMembresia>,

    @InjectRepository(Membresia)
    private membresiaRepository: Repository<Membresia>,
  ) {}

  async create(
    clienteData: {
      ci: string;
      nombre: string;
      apellido: string;
      fechaNacimiento: Date;
      telefono: string;
      direccion: string;
      observacion: string;
      correo: string;
      tipoMembresiaId: number;
    },
    rolCreador: string,
    idUsuario: string,
    ip: string,
  ) {
    // Validar rol
    if (
      rolCreador.toLowerCase() !== 'recepcionista' &&
      rolCreador.toLowerCase() !== 'administrador'
    ) {
      throw new ForbiddenException(
        'Solo recepcionistas o administradores pueden crear clientes.',
      );
    }

    const {
      ci,
      nombre,
      apellido,
      fechaNacimiento,
      telefono,
      direccion,
      observacion,
      correo,
      tipoMembresiaId,
    } = clienteData;

    // Validar correo
    const correoExistente = await this.usuariosRepository.findOneBy({ correo });
    if (correoExistente) {
      throw new BadRequestException('El correo ya está registrado.');
    }

    // Crear Persona
    const persona = this.personasRepository.create({
      CI: ci,
      Nombre: nombre,
      Apellido: apellido,
      FechaNacimiento: fechaNacimiento,
      Telefono: telefono,
      Direccion: direccion,
    });
    await this.personasRepository.save(persona);

    // Crear Cliente
    const cliente = this.clientesRepository.create({
      CI: persona.CI,
      IDEstado: 1,
      Observacion: observacion,
    });
    await this.clientesRepository.save(cliente);

    // Crear Usuario
    const tempPassword = 'Cambiar123';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const usuario = this.usuariosRepository.create({
      id: ci,
      correo: correo,
      contrasena: hashedPassword,
      idPersona: persona,
      idEstadoU: 1,
    });
    await this.usuariosRepository.save(usuario);

    // Asignar Perfil Cliente
    const perfilCliente = await this.perfilesRepository.findOneBy({
      nombrePerfil: 'cliente',
    });
    if (!perfilCliente) {
      throw new Error('No se encontró el perfil "cliente". Debes crearlo.');
    }

    const usuarioPerfil = this.usuarioPerfilRepository.create({
      IDUsuario: usuario.id,
      IDPerfil: perfilCliente.id,
    });
    await this.usuarioPerfilRepository.save(usuarioPerfil);

    // Verificar tipo de membresía
    const tipoMembresia = await this.tipoMembresiaRepository.findOneBy({
      ID: tipoMembresiaId,
    });

    if (!tipoMembresia) {
      throw new BadRequestException('La membresía seleccionada no existe.');
    }

    // Calcular fecha de inicio y fin
    const hoy = new Date();
    const fechaFin = new Date();
    fechaFin.setTime(
      hoy.getTime() + tipoMembresia.DuracionDias * 24 * 60 * 60 * 1000,
    );

    // Crear membresía asociada al cliente
    const membresia = this.membresiaRepository.create({
      FechaInicio: hoy,
      FechaFin: fechaFin,
      PlataformaWeb: 'Presencial',
      TipoMembresiaID: tipoMembresiaId,
    });
    await this.membresiaRepository.save(membresia);

    // Guardar en bitácora
    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Se registró el cliente CI ${cliente.CI} y se le asignó la membresía "${tipoMembresia.NombreTipo}" (ID ${tipoMembresia.ID})`,
      tablaAfectada: 'cliente / membresia',
      ipMaquina: ip,
    });

    return {
      mensaje: 'Cliente creado exitosamente con membresía',
      cliente,
      membresia,
      usuario: {
        correo: usuario.correo,
        passwordTemporal: tempPassword,
      },
    };
  }

  findAll(): Promise<Cliente[]> {
    return this.clientesRepository.find();
  }
}
