import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SeguimientoCliente } from './seguimiento-cliente.entity';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';

@Injectable()
export class SeguimientoClienteService {
  constructor(
    @InjectRepository(SeguimientoCliente)
    private readonly seguimientoRepo: Repository<SeguimientoCliente>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registra un nuevo seguimiento físico si:
   * - Tiene membresía tipo Gold activa
   * - No se registró otro seguimiento en los últimos 15 días
   */
  async registrarSeguimiento(dto: CreateSeguimientoDto): Promise<SeguimientoCliente> {
    // 1. Validar que el cliente tenga una membresía tipo Gold activa
    const [membresia] = await this.dataSource.query(`
      SELECT tm.NombreTipo, m.FechaFin
      FROM membresia m
      JOIN tipo_membresia tm ON m.TipoMembresiaID = tm.ID
      WHERE m.CICliente = ? AND m.FechaFin >= CURDATE()
      ORDER BY m.FechaFin DESC
      LIMIT 1
    `, [dto.ciCliente]);

    if (!membresia || membresia.NombreTipo.toLowerCase() !== 'gold') {
      throw new BadRequestException(
        'Solo los clientes con membresía Gold activa pueden registrar seguimientos físicos.'
      );
    }

    // 2. Validar que no tenga otro seguimiento en los últimos 15 días
    const ultimo = await this.seguimientoRepo.findOne({
      where: { IDCliente: dto.ciCliente },
      order: { Fecha: 'DESC' },
    });

    if (ultimo) {
      const fechaUltimo = new Date(ultimo.Fecha);
      const hoy = new Date();
      const diferenciaDias = Math.floor(
        (hoy.getTime() - fechaUltimo.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diferenciaDias < 15) {
        throw new BadRequestException(
          `Debe esperar ${15 - diferenciaDias} día(s) para registrar un nuevo seguimiento.`
        );
      }
    }

    // 3. IMC: usar el proporcionado o calcularlo automáticamente
    const imcCalculado = dto.peso / (dto.altura * dto.altura);
    const imcFinal = dto.imc ?? parseFloat(imcCalculado.toFixed(2));

    // 4. Crear y guardar el seguimiento
    const nuevoSeguimiento = this.seguimientoRepo.create({
      IDCliente: dto.ciCliente,
      CIInstructor: dto.ciInstructor,
      Peso: dto.peso,
      Altura: dto.altura,
      IMC: imcFinal,
      Pecho: dto.pecho,
      Abdomen: dto.abdomen,
      Cintura: dto.cintura,
      Cadera: dto.cadera,
      Pierna: dto.pierna,
      Biceps: dto.biceps,
      Espalda: dto.espalda,
    });

    return await this.seguimientoRepo.save(nuevoSeguimiento);
  }

  async obtenerHistorialCliente(ci: string): Promise<SeguimientoCliente[]> {
    return await this.seguimientoRepo.find({
      where: { IDCliente: ci },
      order: { Fecha: 'DESC' },
    });
  }

  async obtenerUltimoSeguimiento(ci: string): Promise<SeguimientoCliente> {
    const ultimo = await this.seguimientoRepo.findOne({
      where: { IDCliente: ci },
      order: { Fecha: 'DESC' },
    });
    if (!ultimo) {
      throw new NotFoundException('No hay seguimientos para este cliente.');
    }
    return ultimo;
  }

  async obtenerPorClienteYFecha(ci: string, fecha: string): Promise<SeguimientoCliente> {
    const seguimiento = await this.seguimientoRepo.findOne({
      where: {
        IDCliente: ci,
        Fecha: new Date(fecha),
      },
    });

    if (!seguimiento) {
      throw new NotFoundException('Seguimiento no encontrado para la fecha proporcionada.');
    }

    return seguimiento;
  }

  async actualizarSeguimiento(
    ci: string,
    fecha: string,
    dto: CreateSeguimientoDto,
  ): Promise<SeguimientoCliente> {
    const seguimiento = await this.obtenerPorClienteYFecha(ci, fecha);

    seguimiento.Peso = dto.peso;
    seguimiento.Altura = dto.altura;
    seguimiento.CIInstructor = dto.ciInstructor;
    seguimiento.Pecho = dto.pecho;
    seguimiento.Abdomen = dto.abdomen;
    seguimiento.Cintura = dto.cintura;
    seguimiento.Cadera = dto.cadera;
    seguimiento.Pierna = dto.pierna;
    seguimiento.Biceps = dto.biceps;
    seguimiento.Espalda = dto.espalda;

    // Si envía un nuevo IMC, se usa, si no se recalcula
    const imcCalculado = dto.peso / (dto.altura * dto.altura);
    seguimiento.IMC = dto.imc ?? parseFloat(imcCalculado.toFixed(2));

    return await this.seguimientoRepo.save(seguimiento);
  }

  async eliminarSeguimiento(ci: string, fecha: string): Promise<{ mensaje: string }> {
    const seguimiento = await this.obtenerPorClienteYFecha(ci, fecha);
    await this.seguimientoRepo.remove(seguimiento);
    return { mensaje: 'Seguimiento eliminado correctamente.' };
    console.log('✅ Asistencia registrada correctamente');
  }
}
