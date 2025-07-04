import { BadRequestException, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface ClienteVigente {
  Nombre: string;
  Apellido: string;
  Correo: string;
  TipoMembresia: string;
  FechaInicio: string;
  FechaFin: string;
}

@Injectable()
export class PromocionesService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly dataSource: DataSource,
  ) {}

  async enviarCorreosConImagen(
    imagenRelativa: string,
    mensaje: string,
    tipoMembresia?: string,
  ) {
    const clientes: ClienteVigente[] = await this.dataSource.query(`
      SELECT Nombre, Apellido, Correo, TipoMembresia, FechaInicio, FechaFin
      FROM (
        SELECT 
          p.Nombre,
          p.Apellido,
          u.Correo,
          tm.NombreTipo AS TipoMembresia,
          m.FechaInicio,
          m.FechaFin,
          ROW_NUMBER() OVER (PARTITION BY u.Correo ORDER BY m.FechaInicio DESC) as rn
        FROM membresia m
        JOIN tipo_membresia tm ON m.TipoMembresiaID = tm.ID
        JOIN cliente c ON c.CI = m.CICliente
        JOIN persona p ON p.CI = c.CI
        JOIN usuario u ON u.IDPersona = p.CI
        WHERE CURDATE() <= m.FechaFin
      ) t
      WHERE t.rn = 1
    `);

    const clientesFiltrados = tipoMembresia
      ? clientes.filter(
          (c) =>
            c.TipoMembresia?.toLowerCase().trim() ===
            tipoMembresia.toLowerCase().trim(),
        )
      : clientes;

    const imagenPath = path.resolve(process.cwd(), imagenRelativa);
    if (!fs.existsSync(imagenPath)) {
      throw new BadRequestException(`No se encontró la imagen: ${imagenPath}`);
    }

    for (const c of clientesFiltrados) {
      if (/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(c.Correo)) {
        try {
          await this.mailerService.sendMail({
            to: c.Correo,
            subject: '¡Promoción exclusiva para ti en GoFit GYM!',
            html: `
              <p>Hola ${c.Nombre} ${c.Apellido},</p>
              <p>${mensaje}</p>
              <p>¡Te esperamos en GoFit GYM!</p>
              <div style="text-align:center;">
                <img src="cid:promo-img" style="max-width:100%; border-radius:10px;"/>
              </div>
            `,
            attachments: [
              {
                filename: 'promo.jpg',
                path: imagenPath,
                cid: 'promo-img',
              },
            ],
          });
        } catch (error) {
          console.error(`❌ Error al enviar a ${c.Correo}:`, error);
        }
      }
    }

    return {
      mensaje: `Promociones enviadas con imagen ${
        tipoMembresia
          ? `a miembros tipo "${tipoMembresia}"`
          : 'a todos los clientes vigentes'
      }.`,
    };
  }

  async obtenerClientesVigentes(): Promise<any[]> {
    try {
      return await this.dataSource.query(`
        SELECT Nombre, Apellido, Correo, TipoMembresia, FechaInicio, FechaFin
        FROM (
          SELECT 
            p.Nombre,
            p.Apellido,
            u.Correo,
            tm.NombreTipo AS TipoMembresia,
            m.FechaInicio,
            m.FechaFin,
            ROW_NUMBER() OVER (PARTITION BY u.Correo ORDER BY m.FechaInicio DESC) as rn
          FROM membresia m
          JOIN tipo_membresia tm ON m.TipoMembresiaID = tm.ID
          JOIN cliente c ON c.CI = m.CICliente
          JOIN persona p ON p.CI = c.CI
          JOIN usuario u ON u.IDPersona = p.CI
          WHERE CURDATE() <= m.FechaFin
        ) t
        WHERE t.rn = 1;
      `);
    } catch {
      throw new BadRequestException('Error al obtener clientes vigentes');
    }
  }
}
