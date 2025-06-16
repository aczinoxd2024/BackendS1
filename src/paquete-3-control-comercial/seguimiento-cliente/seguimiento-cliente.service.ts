import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SeguimientoCliente } from './seguimiento-cliente.entity';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { toZonedTime, format } from 'date-fns-tz';

@Injectable()
export class SeguimientoClienteService {
  constructor(
    @InjectRepository(SeguimientoCliente)
    private readonly seguimientoRepo: Repository<SeguimientoCliente>,
    private readonly dataSource: DataSource,
  ) {}

  async registrarSeguimiento(dto: CreateSeguimientoDto): Promise<SeguimientoCliente> {
    const [membresia] = await this.dataSource.query(
      `
      SELECT tm.NombreTipo, m.FechaFin
      FROM membresia m
      JOIN tipo_membresia tm ON m.TipoMembresiaID = tm.ID
      WHERE m.CICliente = ? AND m.FechaFin >= CURDATE()
      ORDER BY m.FechaFin DESC
      LIMIT 1
      `,
      [dto.ciCliente],
    );

    if (!membresia || membresia.NombreTipo.toLowerCase() !== 'gold') {
      throw new BadRequestException(
        'Solo los clientes con membresía Gold activa pueden registrar seguimientos físicos.'
      );
    }
/*
    const ultimo = await this.seguimientoRepo.findOne({
      where: { IDCliente: dto.ciCliente },
      order: { Fecha: 'DESC' },
    });

    if (ultimo) {
      const fechaUltimo = new Date(ultimo.Fecha);
      const hoy = new Date();
      const diferenciaDias = Math.floor((hoy.getTime() - fechaUltimo.getTime()) / (1000 * 60 * 60 * 24));
      if (diferenciaDias < 15) {
        throw new BadRequestException(
          `Debe esperar ${15 - diferenciaDias} día(s) para registrar un nuevo seguimiento.`
        );
      }
    }
*/
     const imcCalculado = dto.peso / (dto.altura * dto.altura);
  const imcFinal = dto.imc ?? parseFloat(imcCalculado.toFixed(2));

  // ✅ Ajustar la hora local a Bolivia
  const zonaBolivia = 'America/La_Paz';
  const ahoraUtc = new Date();
  const fechaLocalBolivia = toZonedTime(ahoraUtc, zonaBolivia);

  const nuevo = this.seguimientoRepo.create({
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
    Fecha: fechaLocalBolivia, 
  });

  return await this.seguimientoRepo.save(nuevo);
  }

  async obtenerHistorialCliente(ci: string): Promise<SeguimientoCliente[]> {
    const resultados = await this.seguimientoRepo.find({
      where: { IDCliente: ci },
      order: { Fecha: 'DESC' },
    });

    console.log(`Seguimientos encontrados para ${ci}:`, resultados.length);
    return resultados;
  }

  async obtenerPorId(id: number): Promise<SeguimientoCliente> {
    const seguimiento = await this.seguimientoRepo.findOne({ where: { id } });
    if (!seguimiento) {
      throw new NotFoundException('Seguimiento no encontrado.');
    }
    return seguimiento;
  }

 async actualizarSeguimiento(ci: string, fecha: string, dto: CreateSeguimientoDto): Promise<SeguimientoCliente> {
  const seguimiento = await this.obtenerPorClienteYFecha(ci, fecha); // ← busca por CI + solo fecha

  seguimiento.Peso = dto.peso;
  seguimiento.Altura = dto.altura;
  seguimiento.Pecho = dto.pecho;
  seguimiento.Abdomen = dto.abdomen;
  seguimiento.Cintura = dto.cintura;
  seguimiento.Cadera = dto.cadera;
  seguimiento.Pierna = dto.pierna;
  seguimiento.Biceps = dto.biceps;
  seguimiento.Espalda = dto.espalda;

  seguimiento.IMC = dto.imc ?? parseFloat((dto.peso / (dto.altura * dto.altura)).toFixed(2));

  return await this.seguimientoRepo.save(seguimiento);
}

async obtenerPorClienteYFecha(ci: string, fecha: string): Promise<SeguimientoCliente> {
  const resultado = await this.seguimientoRepo
    .createQueryBuilder('seguimiento')
    .where('seguimiento.IDCliente = :ci', { ci })
    .andWhere('DATE(seguimiento.Fecha) = :fecha', { fecha }) // ❌ sin CONVERT_TZ
    .orderBy('seguimiento.Fecha', 'DESC')
    .getOne();

  if (!resultado) {
    throw new NotFoundException('No se encontró seguimiento para esa fecha.');
  }

  return resultado;
}



async eliminarSeguimiento(ci: string, fecha: string): Promise<{ mensaje: string }> {
  console.log('[🧪 DEBUG] Eliminando seguimiento de:', ci, 'Fecha:', fecha);
  const seguimiento = await this.obtenerPorClienteYFecha(ci, fecha); // ← busca por CI + solo fecha
  await this.seguimientoRepo.remove(seguimiento);
  return { mensaje: 'Seguimiento eliminado correctamente.' };
}


  async actualizarSeguimientoPorFecha(ci: string, fecha: string, dto: CreateSeguimientoDto): Promise<SeguimientoCliente> {
    const seguimiento = await this.obtenerPorClienteYFecha(ci, fecha);

    seguimiento.Peso = dto.peso;
    seguimiento.Altura = dto.altura;
    seguimiento.Pecho = dto.pecho;
    seguimiento.Abdomen = dto.abdomen;
    seguimiento.Cintura = dto.cintura;
    seguimiento.Cadera = dto.cadera;
    seguimiento.Pierna = dto.pierna;
    seguimiento.Biceps = dto.biceps;
    seguimiento.Espalda = dto.espalda;

    seguimiento.IMC = dto.imc ?? parseFloat((dto.peso / (dto.altura * dto.altura)).toFixed(2));

    return await this.seguimientoRepo.save(seguimiento);
  }
}
