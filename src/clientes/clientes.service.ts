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
import { ClienteActualizarDto } from 'src/auth/dto/clienteActualizar.dto';
import { EstadoCliente } from './estado-cliente/estado-cliente.entity';
import { ClienteCrearDto } from 'src/auth/dto/clienteCrear.dto';

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
    @InjectRepository(EstadoCliente)
    private estadoClienteRepository: Repository<EstadoCliente>,
  ) {}

  // ------------------------------
  // CREAR CLIENTE (Administrador / Recepcionista)
  // ------------------------------
  async create(
    data: ClienteCrearDto,
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

    // ✅ Convertir fechaNacimiento a Date
    const clienteData = {
      ...data,
      fechaNacimiento: new Date(data.fechaNacimiento),
    };

    return this.registrarCliente(clienteData, idUsuario, ip, 'Presencial');
  }

  async adquirirMembresia(data: ClienteCrearDto, ip: string) {
    const clienteData = {
      ...data,
      fechaNacimiento: new Date(data.fechaNacimiento),
    };

    return this.registrarCliente(clienteData, 'clienteWeb', ip, 'Web');
  }

  // ------------------------------
  // MÉTODO UNIFICADO PARA REGISTRO
  // ------------------------------
  private async registrarCliente(
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
    idUsuario: string,
    ip: string,
    plataforma: 'Presencial' | 'Web',
  ) {
    const correoExistente = await this.usuariosRepository.findOneBy({
      correo: data.correo,
    });
    if (correoExistente)
      throw new BadRequestException('El correo ya está registrado.');

    const persona = this.personasRepository.create({
      CI: data.ci,
      Nombre: data.nombre,
      Apellido: data.apellido,
      FechaNacimiento: new Date(data.fechaNacimiento),
      Telefono: data.telefono,
      Direccion: data.direccion,
    });
    await this.personasRepository.save(persona);

    const estadoActivo = await this.estadoClienteRepository.findOneBy({
      Estado: 'Activo',
    });
    if (!estadoActivo)
      throw new BadRequestException('No se encontró el estado "Activo".');

    const cliente = this.clientesRepository.create({
      CI: persona.CI,
      IDEstado: estadoActivo.ID,
      Observacion:
        data.observacion ??
        (plataforma === 'Web'
          ? 'Registrado desde la Web'
          : 'Sin observaciones'),
    });
    await this.clientesRepository.save(cliente);

    const tempPassword = 'Cambiar123';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const usuario = this.usuariosRepository.create({
      id: persona.CI,
      correo: data.correo,
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
      ID: data.tipoMembresiaId,
    });
    if (!tipoMembresia)
      throw new BadRequestException('La membresía seleccionada no existe.');

    const metodoPago = await this.metodoPagoRepository.findOneBy({
      id: data.metodoPagoId,
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
      PlataformaWeb: plataforma,
      TipoMembresiaID: data.tipoMembresiaId,
    });
    await this.membresiaRepository.save(membresia);

    const pago = this.pagoRepository.create({
      Fecha: hoy,
      Monto: tipoMembresia.Precio,
      MetodoPago: data.metodoPagoId,
      CIPersona: persona.CI,
    });
    await this.pagoRepository.save(pago);
    let accionBitacora = '';

    if (plataforma === 'Presencial') {
      accionBitacora = `La recepcionista (Usuario ID: ${idUsuario}) registró al cliente CI ${cliente.CI}, con membresía "${tipoMembresia.NombreTipo}" y método de pago "${metodoPago.metodoPago}".`;
    } else {
      accionBitacora = `Se registró cliente CI ${cliente.CI} desde la Web, con membresía "${tipoMembresia.NombreTipo}" y método de pago "${metodoPago.metodoPago}".`;
    }

    await this.bitacoraRepository.save({
      idUsuario: usuario.id,
      accion: accionBitacora,
      tablaAfectada: 'cliente / membresia / pago',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
    });

    return {
      mensaje: 'Cliente registrado correctamente con membresía y pago',
      cliente,
      membresia,
      pago,
      usuario: { correo: usuario.correo, passwordTemporal: tempPassword },
    };
  }

  // ------------------------------
  // ACTUALIZAR CLIENTE
  // ------------------------------
  async actualizarCliente(
    ci: string,
    data: ClienteActualizarDto,
    idUsuario: string,
    ip: string,
  ) {
    const persona = await this.personasRepository.findOneBy({ CI: ci });
    if (!persona)
      throw new BadRequestException(`No se encontró el cliente CI: ${ci}`);

    if (data.nombre !== undefined) persona.Nombre = data.nombre;
    if (data.apellido !== undefined) persona.Apellido = data.apellido;
    if (data.telefono !== undefined) persona.Telefono = data.telefono;
    if (data.direccion !== undefined) persona.Direccion = data.direccion;

    await this.personasRepository.save(persona);

    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Actualizó datos del cliente CI ${ci}`,
      tablaAfectada: 'persona',
      ipMaquina: ip,
    });

    return { message: 'Cliente actualizado correctamente.' };
  }

  // ------------------------------
  // OBTENER CLIENTE POR CI
  // ------------------------------
  async obtenerClientePorCI(ci: string) {
    const cliente = await this.clientesRepository.findOneBy({ CI: ci });
    const persona = await this.personasRepository.findOneBy({ CI: ci });

    if (!cliente || !persona)
      throw new BadRequestException(`No se encontró el cliente CI: ${ci}`);

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

  // ------------------------------
  // ELIMINAR / DESACTIVAR CLIENTE
  // ------------------------------
  async eliminarCliente(ci: string, idUsuario: string, ip: string) {
    return this.desactivarCliente(ci, idUsuario, ip, true);
  }

  async desactivarCliente(
    ci: string,
    idUsuario: string,
    ip: string,
    eliminado = false,
  ) {
    const cliente = await this.clientesRepository.findOneBy({ CI: ci });
    if (!cliente)
      throw new BadRequestException(`No se encontró el cliente CI: ${ci}`);

    const estadoInactivo = await this.estadoClienteRepository.findOneBy({
      Estado: 'Inactivo',
    });
    if (!estadoInactivo)
      throw new BadRequestException('No se encontró el estado Inactivo.');

    cliente.IDEstado = estadoInactivo.ID;
    await this.clientesRepository.save(cliente);

    await this.bitacoraRepository.save({
      idUsuario,
      accion: eliminado
        ? `Eliminó (desactivó) al cliente CI ${ci}.`
        : `Desactivó al cliente CI ${ci} (marcado como inactivo).`,
      tablaAfectada: 'cliente',
      ipMaquina: ip,
    });

    return {
      message: eliminado
        ? 'Cliente eliminado correctamente.'
        : 'Cliente desactivado correctamente.',
    };
  }
}
