import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from './asistencia.entity';
import { PersonaTipo } from 'paquete-1-usuarios-accesos/persona-tipo/persona-tipo.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
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
    const ahora = new Date(); // Fecha y hora actuales

    // Obtener solo la parte 'YYYY-MM-DD' como objeto Date (sin zona horaria)
    const fechaHoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
    );

    // Buscar persona
    const persona = await this.personaRepo.findOne({ where: { CI: ci } });
    if (!persona) {
      throw new BadRequestException('Persona no encontrada con CI: ' + ci);
    }

    // Definir el rango del día para evitar múltiples registros en el mismo día
    const fechaInicio = new Date(fechaHoy);
    const fechaFin = new Date(fechaHoy);
    fechaFin.setHours(23, 59, 59, 999);

    const asistenciaExistente = await this.asistenciaRepo.findOne({
      where: {
        fecha: Between(fechaInicio, fechaFin),
        persona,
      },
    });

    if (asistenciaExistente) {
      throw new BadRequestException('Ya registraste tu asistencia hoy');
    }

    // Hora de entrada en formato 'HH:mm:ss'
    const horaEntrada = ahora.toLocaleTimeString('en-GB', { hour12: false });

    // Crear nueva asistencia
    const nuevaAsistencia = this.asistenciaRepo.create({
      fecha: fechaHoy, // solo la parte de la fecha
      horaEntrada, // string en formato HH:mm:ss
      persona,
      idTipoPer: 1, // ajusta si tienes lógica dinámica
    });

    return this.asistenciaRepo.save(nuevaAsistencia);
  }

  async findAsistenciasPorDia(fecha: Date): Promise<Asistencia[]> {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 1);

    return this.asistenciaRepo.find({
      where: {
        fecha: Between(inicio, fin),
      },
      relations: ['persona'],
      order: {
        fecha: 'ASC',
      },
    });
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

    doc
      .fontSize(18)
      .text(`Historial de Asistencias - CI: ${ci}`, { align: 'center' });
    doc.moveDown();

    // Tabla simple
    doc.fontSize(12);
    asistencias.forEach((a, index) => {
      // Convertir a fecha Date para evitar errores
      const fechaObj = new Date(a.fecha);
      const fechaStr = isNaN(fechaObj.getTime())
        ? 'Fecha inválida'
        : fechaObj.toISOString().split('T')[0];

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
  async findAllAgrupadasPorCI(): Promise<
    { ci: string; nombre: string; asistencias: Asistencia[] }[]
  > {
    const todasAsistencias = await this.asistenciaRepo.find({
      relations: ['persona'],
      order: { fecha: 'ASC' }, // orden opcional
    });

    const mapAgrupado = new Map<
      string,
      { nombre: string; asistencias: Asistencia[] }
    >();

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

    const resultado: {
      ci: string;
      nombre: string;
      asistencias: Asistencia[];
    }[] = [];

    for (const [ci, datos] of mapAgrupado.entries()) {
      resultado.push({
        ci,
        nombre: datos.nombre,
        asistencias: datos.asistencias,
      });
    }

    return resultado;
  }

  async generarHistorialPDFTodos(): Promise<Buffer> {
    const todasAsistencias = await this.findAllAgrupadasPorCI();

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {});

    doc
      .fontSize(18)
      .text(`Historial de Asistencias - CI: todos`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);

    if (!todasAsistencias || todasAsistencias.length === 0) {
      doc.text('No se encontraron asistencias.');
    } else {
      todasAsistencias.forEach(({ ci, asistencias }) => {
        const persona = asistencias[0]?.persona;
        const nombreCompleto = persona
          ? `${persona.Nombre} ${persona.Apellido}`
          : `CI: ${ci}`;

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
            const fechaStr = isNaN(fechaObj.getTime())
              ? 'Fecha inválida'
              : fechaObj.toISOString().split('T')[0];

            doc.text(
              `${index + 1}. Fecha: ${fechaStr} | Entrada: ${a.horaEntrada} | Salida: ${a.horaSalida || '---'}`,
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
