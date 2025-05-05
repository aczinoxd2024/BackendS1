import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
import { TipoMembresia } from 'src/membresias/Tipos/menbresia.entity';
import { MetodoPago } from 'src/pagos/metodo-pago/metodo-pago.entity';
import { Pago } from 'src/pagos/pagos.entity';
import { ClienteListadoDto } from 'src/auth/dto/listadoCliente.dto';
import { ClienteActualizarDto } from 'src/auth/dto/clienteActualizar.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente) private clientesRepository: Repository<Cliente>,
    @InjectRepository(Persona) private personasRepository: Repository<Persona>,
    @InjectRepository(Usuario) private usuariosRepository: Repository<Usuario>,
    @InjectRepository(UsuarioPerfil)
    private usuarioPerfilRepository: Repository<UsuarioPerfil>,
    @InjectRepository(Perfil) private perfilesRepository: Repository<Perfil>,
    @InjectRepository(Bitacora)
    private bitacoraRepository: Repository<Bitacora>,
    @InjectRepository(TipoMembresia)
    private tipoMembresiaRepository: Repository<TipoMembresia>,
    @InjectRepository(Membresia)
    private membresiaRepository: Repository<Membresia>,
    @InjectRepository(MetodoPago)
    private metodoPagoRepository: Repository<MetodoPago>,
    @InjectRepository(Pago) private pagoRepository: Repository<Pago>,
  ) {}

  // --------------------------------------------
  // CREAR CLIENTE desde administrador o recepcionista
  // --------------------------------------------
  async create(
    clienteData: {
      ci: string;
      nombre: string;
      apellido: string;
      fechaNacimiento: Date;
      telefono: string;
      direccion: string;
      observacion?: string;
      correo: string;
      tipoMembresiaId: number;
      metodoPagoId: number;
    },
    rolCreador: string,
    idUsuario: string,
    ip: string,
  ) {
    if (
      !['recepcionista', 'administrador'].includes(rolCreador.toLowerCase())
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
      metodoPagoId,
    } = clienteData;

    const correoExistente = await this.usuariosRepository.findOneBy({ correo });
    if (correoExistente)
      throw new BadRequestException('El correo ya está registrado.');

    const persona = this.personasRepository.create({
      CI: ci,
      Nombre: nombre,
      Apellido: apellido,
      FechaNacimiento: new Date(fechaNacimiento),
      Telefono: telefono,
      Direccion: direccion,
    });
    await this.personasRepository.save(persona);

    const cliente = this.clientesRepository.create({
      CI: persona.CI,
      IDEstado: 1,
      Observacion: observacion ?? 'Sin observaciones',
    });
    await this.clientesRepository.save(cliente);

    const tempPassword = 'Cambiar123';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const usuario = this.usuariosRepository.create({
      id: ci,
      correo,
      contrasena: hashedPassword,
      idPersona: persona,
      idEstadoU: 1,
    });
    await this.usuariosRepository.save(usuario);

    const perfilCliente = await this.perfilesRepository.findOneBy({
      nombrePerfil: 'cliente',
    });
    if (!perfilCliente) throw new Error('No se encontró el perfil "cliente".');

    const usuarioPerfil = this.usuarioPerfilRepository.create({
      IDUsuario: usuario.id,
      IDPerfil: perfilCliente.id,
    });
    await this.usuarioPerfilRepository.save(usuarioPerfil);

    const tipoMembresia = await this.tipoMembresiaRepository.findOneBy({
      ID: tipoMembresiaId,
    });
    if (!tipoMembresia)
      throw new BadRequestException('La membresía seleccionada no existe.');

    const metodoPago = await this.metodoPagoRepository.findOneBy({
      id: metodoPagoId,
    });
    if (!metodoPago)
      throw new BadRequestException(
        'El método de pago seleccionado no existe.',
      );

    const hoy = new Date();
    const fechaFin = new Date(hoy);
    fechaFin.setDate(hoy.getDate() + tipoMembresia.DuracionDias);

    const membresia = this.membresiaRepository.create({
      FechaInicio: hoy,
      FechaFin: fechaFin,
      PlataformaWeb: 'Presencial',
      TipoMembresiaID: tipoMembresiaId,
    });
    await this.membresiaRepository.save(membresia);

    const pago = this.pagoRepository.create({
      Fecha: hoy,
      Monto: tipoMembresia.Precio,
      MetodoPago: metodoPagoId,
      CIPersona: persona.CI,
    });
    await this.pagoRepository.save(pago);

    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Se registró el cliente CI ${cliente.CI}, membresía "${tipoMembresia.NombreTipo}", método de pago "${metodoPago.metodoPago}"`,
      tablaAfectada: 'cliente / membresia / metodo_pago',
      ipMaquina: ip,
    });

    return {
      mensaje: 'Cliente creado exitosamente con membresía y método de pago',
      cliente,
      membresia,
      pago,
      usuario: { correo: usuario.correo, passwordTemporal: tempPassword },
    };
  }

  // --------------------------------------------
  // ADQUIRIR MEMBRESIA desde la web
  // --------------------------------------------
  async adquirirMembresia(
    data: {
      ci: string;
      nombre: string;
      apellido: string;
      fechaNacimiento: Date;
      telefono: string;
      direccion: string;
      observacion?: string;
      correo: string;
      tipoMembresiaId: number;
      metodoPagoId: number;
    },
    ip: string,
  ) {
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
      metodoPagoId,
    } = data;

    const correoExistente = await this.usuariosRepository.findOneBy({ correo });
    if (correoExistente)
      throw new BadRequestException('El correo ya está registrado.');

    const persona = this.personasRepository.create({
      CI: ci,
      Nombre: nombre,
      Apellido: apellido,
      FechaNacimiento: new Date(fechaNacimiento),
      Telefono: telefono,
      Direccion: direccion,
    });
    await this.personasRepository.save(persona);

    const cliente = this.clientesRepository.create({
      CI: persona.CI,
      IDEstado: 1,
      Observacion: observacion ?? 'Registrado desde adquisición en web',
    });
    await this.clientesRepository.save(cliente);

    const tempPassword = 'Cambiar123';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const usuario = this.usuariosRepository.create({
      id: persona.CI,
      correo,
      contrasena: hashedPassword,
      idPersona: persona,
      idEstadoU: 1,
    });
    await this.usuariosRepository.save(usuario);

    const perfilCliente = await this.perfilesRepository.findOneBy({
      nombrePerfil: 'cliente',
    });
    if (!perfilCliente) throw new Error('No se encontró el perfil "cliente".');

    const usuarioPerfil = this.usuarioPerfilRepository.create({
      IDUsuario: usuario.id,
      IDPerfil: perfilCliente.id,
    });
    await this.usuarioPerfilRepository.save(usuarioPerfil);

    const tipoMembresia = await this.tipoMembresiaRepository.findOneBy({
      ID: tipoMembresiaId,
    });
    if (!tipoMembresia)
      throw new BadRequestException('La membresía seleccionada no existe.');

    const metodoPago = await this.metodoPagoRepository.findOneBy({
      id: metodoPagoId,
    });
    if (!metodoPago)
      throw new BadRequestException(
        'El método de pago seleccionado no existe.',
      );

    const hoy = new Date();
    const fechaFin = new Date(hoy);
    fechaFin.setDate(hoy.getDate() + tipoMembresia.DuracionDias);

    const membresia = this.membresiaRepository.create({
      FechaInicio: hoy,
      FechaFin: fechaFin,
      PlataformaWeb: 'Web',
      TipoMembresiaID: tipoMembresiaId,
    });
    await this.membresiaRepository.save(membresia);

    const pago = this.pagoRepository.create({
      Fecha: hoy,
      Monto: tipoMembresia.Precio,
      MetodoPago: metodoPagoId,
      CIPersona: persona.CI,
    });
    await this.pagoRepository.save(pago);

    await this.bitacoraRepository.save({
      idUsuario: usuario.id,
      accion: `Cliente web adquirió membresía "${tipoMembresia.NombreTipo}" - Pago: ${tipoMembresia.Precio} - Método: "${metodoPago.metodoPago}"`,
      tablaAfectada: 'cliente / membresia / pago',
      ipMaquina: ip,
    });

    return {
      mensaje:
        'Cliente registrado desde la web correctamente con membresía y pago',
      cliente,
      membresia,
      pago,
      usuario: { correo: usuario.correo, passwordTemporal: tempPassword },
    };
  }
  async actualizarCliente(
    ci: string,
    data: ClienteActualizarDto,
    idUsuario: string,
    ip: string,
  ) {
    // Buscar la persona vinculada al cliente
    const persona = await this.personasRepository.findOneBy({ CI: ci });

    if (!persona) {
      throw new BadRequestException(
        `No se encontró ningún cliente con el CI: ${ci}`,
      );
    }
    // Actualizar los datos permitidos SOLO si vienen en el DTO
    if (data.nombre !== undefined) persona.Nombre = data.nombre;
    if (data.apellido !== undefined) persona.Apellido = data.apellido;
    if (data.telefono !== undefined) persona.Telefono = data.telefono;
    if (data.direccion !== undefined) persona.Direccion = data.direccion;

    await this.personasRepository.save(persona);

    // Registrar en la bitácora la modificación
    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Actualizó los datos del cliente CI ${ci} → Nombre, Apellido, Teléfono o Dirección.`,
      tablaAfectada: 'persona',
      ipMaquina: ip,
    });

    return {
      message: 'Cliente actualizado correctamente.',
    };
  }

  // --------------------------------------------
  // OBTENER TODOS LOS CLIENTES
  // --------------------------------------------
  async obtenerClientePorCI(ci: string) {
    const cliente = await this.clientesRepository.findOneBy({ CI: ci });
    if (!cliente) {
      throw new BadRequestException(`No se encontró el cliente CI: ${ci}`);
    }

    const persona = await this.personasRepository.findOneBy({ CI: ci });
    if (!persona) {
      throw new BadRequestException(
        `No se encontró datos personales para el cliente CI: ${ci}`,
      );
    }

    return {
      ci: cliente.CI,
      nombre: persona.Nombre,
      apellido: persona.Apellido,
      telefono: persona.Telefono,
      direccion: persona.Direccion,
      observacion: cliente.Observacion,
      estado: cliente.IDEstado,
    };
  }

  async eliminarCliente(ci: string, idUsuario: string, ip: string) {
    const cliente = await this.clientesRepository.findOneBy({ CI: ci });

    if (!cliente) {
      throw new BadRequestException(
        `No se encontró ningún cliente con CI: ${ci}`,
      );
    }

    // Cambiar estado a Inactivo (ID 2)
    cliente.IDEstado = 2;
    await this.clientesRepository.save(cliente);

    // Bitácora
    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Eliminó (desactivó) al cliente CI ${ci}.`,
      tablaAfectada: 'cliente',
      ipMaquina: ip,
    });

    return { message: 'Cliente eliminado (desactivado) correctamente.' };
  }

  async desactivarCliente(ci: string, idUsuario: string, ip: string) {
    const cliente = await this.clientesRepository.findOneBy({ CI: ci });

    if (!cliente) {
      throw new BadRequestException(
        `No se encontró ningún cliente con CI: ${ci}`,
      );
    }

    // Cambiar estado a Inactivo (ID 2)
    cliente.IDEstado = 2;
    await this.clientesRepository.save(cliente);

    // Bitácora
    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Desactivó al cliente CI ${ci} (marcado como inactivo)`,
      tablaAfectada: 'cliente',
      ipMaquina: ip,
    });

    return { message: 'Cliente desactivado correctamente.' };
  }
}
