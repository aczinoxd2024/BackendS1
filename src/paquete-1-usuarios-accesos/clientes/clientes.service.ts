import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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

    let pago: Pago | null = null;

    if (plataforma === 'Presencial') {
      pago = this.pagoRepository.create({
        Fecha: hoy,
        Monto: tipoMembresia.Precio,
        MetodoPago: data.metodoPagoId,
        CIPersona: persona.CI,
      });
      await this.pagoRepository.save(pago);
    }

    let accionBitacora = '';
    let idUsuarioBitacora = '';

    if (plataforma === 'Presencial') {
      // Buscar nombre del usuario (Recepcionista o Administrador)
      const usuarioQuienRegistra = await this.usuariosRepository.findOne({
        where: { id: idUsuario },
        relations: ['idPersona'],
      });

      const nombreUsuario =
        usuarioQuienRegistra?.idPersona?.Nombre ?? 'Desconocido';

      accionBitacora = `La recepcionista (Usuario ID: ${idUsuario} - ${nombreUsuario}) registró al cliente CI ${cliente.CI}, con membresía "${tipoMembresia.NombreTipo}" y método de pago "${metodoPago.metodoPago}".`;
      idUsuarioBitacora = idUsuario; // 👈 ID de la recepcionista
    } else {
      accionBitacora = `Se registró cliente CI ${cliente.CI} desde la Web, con membresía "${tipoMembresia.NombreTipo}" y método de pago "${metodoPago.metodoPago}".`;
      idUsuarioBitacora = usuario.id; // 👈 CI del cliente que se acaba de registrar
    }

    await this.bitacoraRepository.save({
      idUsuario: idUsuarioBitacora,
      accion: accionBitacora,
      tablaAfectada: 'cliente / membresia / pago',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
    });

    return {
      mensaje: 'Cliente registrado correctamente con membresía',
      cliente,
      membresia,
      ...(plataforma === 'Presencial' && pago ? { pago } : {}),
      usuario: { correo: usuario.correo, passwordTemporal: tempPassword },
    };
  }

  // ------------------------------
  async actualizarCliente(
    ci: string,
    data: ClienteActualizarDto,
    idUsuario: string,
    ip: string,
  ) {
    // Buscar persona por CI
    const persona = await this.personasRepository.findOneBy({ CI: ci });
    if (!persona) {
      throw new BadRequestException(`No se encontró el cliente CI: ${ci}`);
    }

    // 👉 Actualizar datos de la persona si se enviaron
    if (data.nombre !== undefined) persona.Nombre = data.nombre;
    if (data.apellido !== undefined) persona.Apellido = data.apellido;
    if (data.telefono !== undefined) persona.Telefono = data.telefono;
    if (data.direccion !== undefined) persona.Direccion = data.direccion;

    await this.personasRepository.save(persona);

    // 👉 Buscar el usuario relacionado (ID = CI del cliente)
    const usuario = await this.usuariosRepository.findOne({
      where: { id: ci },
      relations: ['idPersona'], // Muy importante para poder modificar idPersona
    });

    if (usuario) {
      // ✅ Actualizar en usuario.idPersona (es decir, la tabla persona desde el usuario)
      if (data.nombre !== undefined) usuario.idPersona.Nombre = data.nombre;
      if (data.apellido !== undefined)
        usuario.idPersona.Apellido = data.apellido;

      await this.usuariosRepository.save(usuario);
    }

    // 👉 Buscar quién está actualizando (Recepcionista o Administrador)
    const usuarioQuienActualiza = await this.usuariosRepository.findOne({
      where: { id: idUsuario },
      relations: ['idPersona'],
    });

    const nombreUsuario =
      usuarioQuienActualiza?.idPersona?.Nombre ?? 'Desconocido';

    // 👉 Registrar en bitácora
    await this.bitacoraRepository.save({
      idUsuario,
      accion: `La recepcionista (Usuario ID: ${idUsuario} - ${nombreUsuario}) actualizó los datos del cliente CI ${ci}.`,
      tablaAfectada: 'persona',
      ipMaquina: ip === '::1' ? 'localhost' : ip,
    });

    return { message: 'Cliente actualizado correctamente.' };
  }

  // ------------------------------
  // OBTENER CLIENTE POR CI
  // ------------------------------
  async obtenerClientePorCI(ci: string) {
    try {
      const cliente = await this.clientesRepository.findOneBy({ CI: ci });
      const persona = await this.personasRepository.findOneBy({ CI: ci });

      if (!cliente) {
        console.warn(`⚠️ Cliente no encontrado: ${ci}`);
      }
      if (!persona) {
        console.warn(`⚠️ Persona no encontrada: ${ci}`);
      }

      if (!cliente || !persona) {
        throw new NotFoundException(`No se encontró el cliente con CI ${ci}`);
      }

      return {
        ci: cliente.CI,
        nombre: persona.Nombre ?? '',
        apellido: persona.Apellido ?? '',
        telefono: persona.Telefono ?? '',
        direccion: persona.Direccion ?? '',
        observacion: cliente.Observacion ?? '',
        estado: cliente.IDEstado ?? 'Desconocido',
      };
    } catch (error) {
      console.error('❌ Error al obtener cliente por CI:', error);
      throw new InternalServerErrorException(
        'Error interno al obtener cliente.',
      );
    }
  }

  // Eliminar (desactivar) Cliente + Usuario relacionado
  async eliminarCliente(ci: string, idUsuario: string, ip: string) {
    console.log('➡️ Iniciando eliminación de cliente:', ci);

    const cliente = await this.clientesRepository.findOneBy({ CI: ci });
    console.log('🧐 Cliente encontrado:', cliente);

    if (!cliente)
      throw new BadRequestException(`No se encontró el cliente CI: ${ci}`);

    // Cambiar estado del Cliente a Inactivo
    const estadoInactivo = await this.estadoClienteRepository.findOneBy({
      Estado: 'Inactivo',
    });
    console.log('🟡 Estado inactivo encontrado:', estadoInactivo);

    if (!estadoInactivo)
      throw new BadRequestException('No se encontró el estado Inactivo.');

    cliente.IDEstado = estadoInactivo.ID;
    await this.clientesRepository.save(cliente);
    console.log('✅ Cliente desactivado y guardado:', cliente);

    // Buscar el usuario relacionado con este CI (IDPersona en Usuario)
    const usuario = await this.usuariosRepository.findOne({
      where: { idPersona: { CI: ci } },
    });
    console.log('👤 Usuario relacionado encontrado:', usuario);

    if (usuario) {
      usuario.idEstadoU = estadoInactivo.ID; // ✅ ✅ CAMBIADO - Bloquear con ID correcto
      await this.usuariosRepository.save(usuario);
      console.log('🚫 Usuario bloqueado:', usuario);
    }

    // Registrar en Bitácora
    await this.bitacoraRepository.save({
      idUsuario,
      accion: `Eliminó (desactivó) al cliente CI ${ci} (cliente y usuario bloqueado).`,
      tablaAfectada: 'cliente',
      ipMaquina: ip,
    });
    console.log('📒 Bitácora registrada.');

    return {
      message:
        'Cliente eliminado correctamente (desactivado junto con su usuario).',
    };
  }
  async listarClientes() {
    const clientes = await this.clientesRepository.find();

    const resultado = await Promise.all(
      clientes.map(async (cliente) => {
        const persona = await this.personasRepository.findOneBy({
          CI: cliente.CI,
        });

        const estadoCliente = await this.estadoClienteRepository.findOneBy({
          ID: cliente.IDEstado,
        });

        return {
          ci: cliente.CI,
          nombre: persona?.Nombre ?? '',
          apellido: persona?.Apellido ?? '',
          telefono: persona?.Telefono ?? '',
          direccion: persona?.Direccion ?? '',
          observacion: cliente.Observacion ?? '',
          estado: estadoCliente?.Estado ?? 'Desconocido', // ✅ Aquí ahora devuelve Activo, Inactivo, etc
        };
      }),
    );

    return resultado;
  }
  async obtenerMiPerfil(ci: string) {
    console.log('Buscando usuario con CI:', ci);

    const usuario = await this.usuariosRepository.findOne({
      where: { id: ci },
      relations: ['idPersona'],
    });

    if (!usuario) {
      console.log('Usuario no encontrado');
      throw new BadRequestException(`No se encontró el usuario CI: ${ci}`);
    }

    const persona = usuario.idPersona;
    console.log('Datos del perfil encontrados:', persona);

    return {
      ci: usuario.id,
      nombre: persona?.Nombre ?? '',
      apellido: persona?.Apellido ?? '',
      correo: usuario.correo,
      telefono: persona?.Telefono ?? '',
      direccion: persona?.Direccion ?? '',
    };
  }
}
