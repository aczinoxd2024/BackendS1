import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Raw } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Membresia } from '../../paquete-3-control-comercial/membresias/membresia.entity';
import { TipoMembresia } from '../../paquete-3-control-comercial/membresias/Tipos/tipo_membresia.entity';

// Define la interfaz EmailResult directamente en este archivo
export interface EmailResult {
  recipient: string;
  status: 'success' | 'failed';
  message: string;
}

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Membresia)
    private readonly membresiaRepo: Repository<Membresia>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(TipoMembresia)
    private readonly tipoMembresiaRepo: Repository<TipoMembresia>,
    private readonly mailerService: MailerService,
  ) {}

  private esCorreoGmailValido(correo: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return regex.test(correo);
  }

  // Nueva función de guardia de tipo para manejar errores
  private isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    );
  }

  async sendMembershipExpirationAlerts(
    daysBeforeExpiration: number,
  ): Promise<EmailResult[]> {
    const today = new Date();
    const alertDate = new Date();
    alertDate.setDate(today.getDate() + daysBeforeExpiration);

    const expiring = await this.membresiaRepo.find({
      where: {
        FechaFin: LessThanOrEqual(alertDate),
        PlataformaWeb: Raw((alias) => `${alias} != 'Incluida'`),
      },
      relations: ['cliente'],
    });

    const results: EmailResult[] = [];

    for (const m of expiring) {
      const persona = await this.personaRepo.findOne({
        where: { CI: m.CICliente },
      });
      const usuario = await this.usuarioRepo.findOne({
        where: { idPersona: { CI: m.CICliente } },
      });
      const tipo = await this.tipoMembresiaRepo.findOne({
        where: { ID: m.TipoMembresiaID },
      });

      if (
        persona &&
        usuario?.correo &&
        this.esCorreoGmailValido(usuario.correo)
      ) {
        try {
          await this.mailerService.sendMail({
            to: usuario.correo,
            subject: `🔔 Tu membresía ${tipo?.NombreTipo || 'GoFit'} está por vencer`,
            html: `
              <p>Hola <strong>${persona.Nombre} ${persona.Apellido}</strong>,</p>
              <p>Tu membresía <strong>${tipo?.NombreTipo}</strong> vence el <strong>${new Date(m.FechaFin).toLocaleDateString('es-BO')}</strong>.</p>
              <p>No pierdas tu progreso. Puedes renovarla desde la web o en recepción.</p>
              <br><p><strong>GoFit GYM</strong></p>
            `,
          });
          results.push({
            recipient: usuario.correo,
            status: 'success',
            message: 'Correo enviado exitosamente.',
          });
        } catch (error: unknown) {
          let errorMessage = 'Error desconocido al enviar correo.';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (this.isErrorWithMessage(error)) {
            // Usar la nueva guardia de tipo
            errorMessage = error.message;
          }
          console.error(`❌ Error al enviar a ${usuario.correo}:`, error);
          results.push({
            recipient: usuario.correo,
            status: 'failed',
            message: `Error: ${errorMessage}`,
          });
        }
      } else {
        results.push({
          recipient: usuario?.correo || 'Correo no disponible',
          status: 'failed',
          message:
            'No se envió: correo no válido o datos de usuario incompletos.',
        });
      }
    }

    return results;
  }

  async obtenerMembresiasProximasAVencer(): Promise<any[]> {
    const hoy = new Date();
    const tresDiasDespues = new Date();
    tresDiasDespues.setDate(hoy.getDate() + 3);

    const membresias = await this.membresiaRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.cliente', 'cliente')
      .leftJoin('m.tipo', 'tipo')
      .where('m.FechaFin BETWEEN :hoy AND :tresDias', {
        hoy: hoy.toISOString().split('T')[0],
        tresDias: tresDiasDespues.toISOString().split('T')[0],
      })
      .andWhere("m.PlataformaWeb != 'Incluida'")
      .orderBy('m.FechaFin', 'ASC')
      .select([
        'm.IDMembresia AS IDMembresia',
        'm.CICliente AS CICliente',
        'm.FechaFin AS FechaFin',
        'm.TipoMembresiaID AS TipoMembresiaID',
        'm.PlataformaWeb AS PlataformaWeb',
        'tipo.NombreTipo AS tipoNombre',
      ])
      .addSelect(`DATEDIFF(m.FechaFin, CURDATE())`, 'diasRestantes')
      .getRawMany();

    return membresias;
  }

  async sendPromotionalEmail(
    subject: string,
    htmlContent: string,
  ): Promise<EmailResult[]> {
    const clientes = await this.clienteRepo.find();
    const results: EmailResult[] = [];

    for (const c of clientes) {
      const persona = await this.personaRepo.findOne({ where: { CI: c.CI } });
      const usuario = await this.usuarioRepo.findOne({
        where: { idPersona: { CI: c.CI } },
      });

      if (
        persona &&
        usuario?.correo &&
        this.esCorreoGmailValido(usuario.correo)
      ) {
        try {
          await this.mailerService.sendMail({
            to: usuario.correo,
            subject,
            html: htmlContent,
          });
          results.push({
            recipient: usuario.correo,
            status: 'success',
            message: 'Correo promocional enviado exitosamente.',
          });
        } catch (error: unknown) {
          let errorMessage = 'Error desconocido al enviar correo promocional.';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (this.isErrorWithMessage(error)) {
            // Usar la nueva guardia de tipo
            errorMessage = error.message;
          }
          console.error(`❌ Falló enviar a ${usuario.correo}:`, error);
          results.push({
            recipient: usuario.correo,
            status: 'failed',
            message: `Error: ${errorMessage}`,
          });
        }
      } else {
        results.push({
          recipient: usuario?.correo || 'Correo no disponible',
          status: 'failed',
          message:
            'No se envió: correo no válido o datos de usuario incompletos.',
        });
      }
    }

    return results;
  }
}
