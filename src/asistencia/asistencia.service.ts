import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from './asistencia.entity';
import { CreateAsistenciaDto } from './create-asistencia.dto';
import { PersonaTipo } from '../persona-tipo/persona-tipo.entity';
import { Between } from 'typeorm';
import { UpdateHoraSalidaDto } from './update-salida.dto';
import * as moment from 'moment';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

@Injectable()
export class AsistenciaService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciaRepo: Repository<Asistencia>,

    @InjectRepository(PersonaTipo)
    private personaTipoRepo: Repository<PersonaTipo>,
  ) {}

  async create(createAsistenciaDto: CreateAsistenciaDto): Promise<Asistencia> {
    const esCliente = await this.personaTipoRepo.findOne({
      where: {
        CI: createAsistenciaDto.cipersona,
        ID_TipoPersona: 1, // cliente
      },
    });

    if (!esCliente) {
      throw new BadRequestException(
        `La persona con CI ${createAsistenciaDto.cipersona} no es cliente`,
      );
    }
    const fechaAsistencia = new Date(createAsistenciaDto.fecha);
  const yyyy = fechaAsistencia.getFullYear();
  const mm = fechaAsistencia.getMonth();
  const dd = fechaAsistencia.getDate();

  const fechaInicio = new Date(yyyy, mm, dd, 0, 0, 0);
  const fechaFin = new Date(yyyy, mm, dd, 23, 59, 59);
  const asistenciaExistente = await this.asistenciaRepo.findOne({
    where: {
      persona: { CI: createAsistenciaDto.cipersona },
      fecha: Between(fechaInicio, fechaFin),
    },
  });

  if (asistenciaExistente) {
    throw new BadRequestException(
      `La asistencia para la persona con CI ${createAsistenciaDto.cipersona} ya fue registrada el día ${fechaAsistencia.toDateString()}`,
    );
  }



    const nuevaAsistencia = this.asistenciaRepo.create({
      fecha: createAsistenciaDto.fecha,
      horaEntrada: createAsistenciaDto.horaEntrada,
      persona: { CI: createAsistenciaDto.cipersona },
      idTipoPer: 1,
    });

    return this.asistenciaRepo.save(nuevaAsistencia);
  }
async generarHistorialExcel(ci: string): Promise<Buffer> {
  const asistencias = await this.findByCIPersona(ci);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Historial');

  // Definir columnas
  sheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 15 },
    { header: 'Hora Entrada', key: 'horaEntrada', width: 15 },
    { header: 'Hora Salida', key: 'horaSalida', width: 15 },
  ];

  // Agregar datos
  asistencias.forEach((a) => {
    const fecha = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
    sheet.addRow({
      fecha: fecha.toISOString().split('T')[0],
      horaEntrada: a.horaEntrada,
      horaSalida: a.horaSalida || '',
    });
  });

  const uint8Array = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(uint8Array);
  return buffer;
}
   async generarHistorialPDF(ci: string): Promise<Buffer> {
  const asistencias = await this.findByCIPersona(ci);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {});

  doc.fontSize(18).text(`Historial de Asistencias - CI: ${ci}`, { align: 'center' });
  doc.moveDown();

  // Tabla simple
  doc.fontSize(12);
  asistencias.forEach((a, index) => {
    // Convertir a fecha Date para evitar errores
    const fechaObj = new Date(a.fecha);
    const fechaStr = isNaN(fechaObj.getTime()) ? 'Fecha inválida' : fechaObj.toISOString().split('T')[0];

    doc.text(
      `${index + 1}. Fecha: ${fechaStr} | Entrada: ${a.horaEntrada} | Salida: ${a.horaSalida || '---'}`,
    );
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
  });
}

  async registrarSalida(idAsistencia: number, dto: UpdateHoraSalidaDto): Promise<Asistencia> {
  const asistencia = await this.asistenciaRepo.findOne({ where: { id: idAsistencia } });

  if (!asistencia) {
    throw new BadRequestException('Asistencia no encontrada');
  }

  if (asistencia.horaSalida) {
    throw new BadRequestException('La salida ya fue registrada');
  }

  asistencia.horaSalida = dto.horaSalida;

  return this.asistenciaRepo.save(asistencia);
}
async contarTotalAsistencias(): Promise<number> {
    return this.asistenciaRepo.count();
  }

  async contarAsistenciasHoy(): Promise<number> {
  const inicioDelDia = moment().startOf('day').toDate();
  const finDelDia = moment().endOf('day').toDate();

  return this.asistenciaRepo.count({
    where: {
      fecha: Between(inicioDelDia, finDelDia),
    },
  });
}

  async asistenciasPorCliente(): Promise<{ ci: string; cantidad: number }[]> {
  const raw = await this.asistenciaRepo
    .createQueryBuilder('a')
    .select('a.persona.CI', 'ci')
    .addSelect('COUNT(*)', 'cantidad')
    .groupBy('a.persona.CI')
    .getRawMany();

  return raw.map((r) => ({
    ci: r.ci,
    cantidad: parseInt(r.cantidad, 10),
  }));
}

  async findByCIPersona(ci: string): Promise<Asistencia[]> {
  return this.asistenciaRepo.find({
    where: { persona: { CI: ci } },
    relations: ['persona'],
    order: { fecha: 'DESC' },
  });
}

  findAll(): Promise<Asistencia[]> {
    return this.asistenciaRepo.find({ relations: ['persona'] });
  }
}
 