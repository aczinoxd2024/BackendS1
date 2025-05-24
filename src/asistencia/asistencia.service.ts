import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from './asistencia.entity';
import { PersonaTipo } from '../persona-tipo/persona-tipo.entity';
import { Persona } from '../personas/persona.entity';
import { Between } from 'typeorm';
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

    @InjectRepository(Persona)
    private personaRepo: Repository<Persona>,
  ) {}
async registrarAsistencia(ci: string): Promise<Asistencia> {
  const ahora = new Date();
  const fechaHoy = ahora.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  const persona = await this.personaRepo.findOne({ where: { CI: ci } });
  if (!persona) {
    throw new BadRequestException('Persona no encontrada con CI: ' + ci);
  }

  const fechaInicio = new Date(`${fechaHoy}T00:00:00.000Z`);
  const fechaFin = new Date(`${fechaHoy}T23:59:59.999Z`);

  const asistenciaExistente = await this.asistenciaRepo.findOne({
    where: {
      fecha: Between(fechaInicio, fechaFin),
      persona,
    },
  });

  if (asistenciaExistente) {
    throw new BadRequestException('Ya registraste tu asistencia hoy');
  }

  const nuevaAsistencia = this.asistenciaRepo.create({
    fecha: ahora, // Guardar fecha completa con hora
    persona,
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
async findAllAgrupadasPorCI(): Promise<{ ci: string; nombre: string; asistencias: Asistencia[] }[]> {
  const todasAsistencias = await this.asistenciaRepo.find({
    relations: ['persona'],
    order: { fecha: 'ASC' }, // orden opcional
  });

  const mapAgrupado = new Map<string, { nombre: string; asistencias: Asistencia[] }>();

  todasAsistencias.forEach((asistencia) => {
    const ci = asistencia.persona?.CI ?? 'Desconocido';
    const nombre = asistencia.persona
      ? `${asistencia.persona.Nombre} ${asistencia.persona.Apellido}`
      : 'Sin nombre';

    if (!mapAgrupado.has(ci)) {
      mapAgrupado.set(ci, { nombre, asistencias: [] });
    }

    mapAgrupado.get(ci)!.asistencias.push(asistencia);
  });

  const resultado: { ci: string; nombre: string; asistencias: Asistencia[] }[] = [];

  for (const [ci, datos] of mapAgrupado.entries()) {
    resultado.push({ ci, nombre: datos.nombre, asistencias: datos.asistencias });
  }

  return resultado;
}

async generarHistorialPDFTodos(): Promise<Buffer> {
  const todasAsistencias = await this.findAllAgrupadasPorCI();

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {});

  doc.fontSize(18).text(`Historial de Asistencias - CI: todos`, { align: 'center' });
  doc.moveDown();

  doc.fontSize(12);

  if (!todasAsistencias || todasAsistencias.length === 0) {
    doc.text('No se encontraron asistencias.');
  } else {
    todasAsistencias.forEach(({ ci, asistencias }) => {
      const persona = asistencias[0]?.persona;
      const nombreCompleto = persona ? `${persona.Nombre} ${persona.Apellido}` : `CI: ${ci}`;

      // Mostrar nombre y CI
      doc.fontSize(14).text(nombreCompleto, { underline: true });
      if (persona) {
        doc.fontSize(12).text(`CI: ${ci}`);
      }
      doc.moveDown(0.3);

      if (!asistencias || asistencias.length === 0) {
        doc.text('No hay asistencias registradas.');
      } else {
        asistencias.forEach((a, index) => {
          const fechaObj = new Date(a.fecha);
          const fechaStr = isNaN(fechaObj.getTime()) ? 'Fecha inválida' : fechaObj.toISOString().split('T')[0];

          doc.text(
            `${index + 1}. Fecha: ${fechaStr} | Entrada: ${a.horaEntrada} | Salida: ${a.horaSalida || '---'}`
          );
        });
      }

      doc.moveDown();
    });
  }

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
  });
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
    order: { horaEntrada: 'DESC' },
  });
  }

  findAll(): Promise<Asistencia[]> {
    return this.asistenciaRepo.find({ relations: ['persona'] });
  }
}
 