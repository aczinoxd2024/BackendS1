import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// Asegúrate de importar Between, Not, IsNull, y And
import {
  Repository,
  Raw,
  LessThanOrEqual,
  Not,
  IsNull,
  And,
  Between,
} from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Cliente } from '../../paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Persona } from '../../paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from '../../paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Membresia } from '../../paquete-3-control-comercial/membresias/membresia.entity';
import { TipoMembresia } from '../../paquete-3-control-comercial/membresias/Tipos/tipo_membresia.entity';

export interface EmailResult {
  recipient: string;
  status: 'success' | 'failed';
  message: string;
}

export interface MembresiaVencimientoData {
  IDMembresia: number;
  CICliente: string;
  FechaFin: string;
  TipoMembresiaID: number;
  PlataformaWeb: string;
  tipoNombre: string;
  diasRestantes: number;
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

    const memberships = await this.membresiaRepo.find({
      where: {
        FechaFin: LessThanOrEqual(alertDate),
        PlataformaWeb: Raw((alias) => `${alias} != 'Incluida'`),
        CICliente: And(Not(IsNull()), Not('')), // Filtra CICliente no NULL ni vacío
      },
      relations: ['cliente', 'tipo'],
    });

    const clientsToNotify = new Map<string, Membresia[]>();
    for (const m of memberships) {
      if (m.CICliente && m.CICliente.trim() !== '') {
        if (!clientsToNotify.has(m.CICliente)) {
          clientsToNotify.set(m.CICliente, []);
        }
        clientsToNotify.get(m.CICliente)!.push(m);
      } else {
        console.warn(
          `⚠️ Membresía ${m.IDMembresia} descartada: CICliente es nulo o vacío.`,
        );
      }
    }

    const results: EmailResult[] = [];

    for (const [ciCliente, clientMemberships] of clientsToNotify.entries()) {
      const persona = await this.personaRepo.findOne({
        where: { CI: ciCliente },
      });
      const usuario = await this.usuarioRepo.findOne({
        where: { idPersona: { CI: ciCliente } },
      });

      if (
        persona &&
        usuario?.correo &&
        this.esCorreoGmailValido(usuario.correo)
      ) {
        const membershipsSummary = clientMemberships
          .map((m) => {
            const diasRestantes = Math.ceil(
              (new Date(m.FechaFin).getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return `<li>
      Membresía: <strong>${m.tipo?.NombreTipo || 'Desconocido'}</strong> - 
      Vence el: <strong>${new Date(m.FechaFin).toLocaleDateString('es-BO')}</strong> 
      (<strong>${diasRestantes} día(s)</strong> restante${diasRestantes !== 1 ? 's' : ''}).
    </li>`;
          })
          .join('');

        try {
          await this.mailerService.sendMail({
            to: usuario.correo,
            subject: `🔔 Alerta de Vencimiento: Tu(s) membresía(s) GoFit está(n) por vencer`,
            html: `
              <p>Hola <strong>${persona.Nombre} ${persona.Apellido}</strong>,</p>
              <p>Queremos recordarte que la(s) siguiente(s) membresía(s) que tienes con GoFit GYM está(n) próxima(s) a vencer:</p>
              <ul>${membershipsSummary}</ul>
              <p>Para no perder tu progreso ni tus beneficios, te invitamos a renovar tu(s) membresía(s) lo antes posible.</p>
             <p>Puedes renovar fácilmente tu membresía haciendo clic en el siguiente botón:</p>
<p>
  <a href="https://proyectosis120252.netlify.app/renovar-membresia?ci=${ciCliente}" 
     style="background-color: #ff4b5c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
    Renovar Membresía
  </a>
</p>
<p>O si lo prefieres, visítanos en la recepción del gimnasio.</p>

              <br><p>¡Gracias por ser parte de la comunidad GoFit GYM! 💪</p>
            `,
          });
          results.push({
            recipient: usuario.correo,
            status: 'success',
            message: 'Correo enviado exitosamente.',
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : this.isErrorWithMessage(error)
                ? error.message
                : 'Error desconocido al enviar correo.';
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
          message: `No se envió: ${usuario?.correo ? 'correo no válido o no es Gmail' : 'datos de usuario/persona incompletos'}.`,
        });
      }
    }

    return results;
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
            subject: subject,
            html: htmlContent,
            /* template: 'promocional_email',*/
            context: {
              subject: subject,
              htmlContent: htmlContent,
              nombrePersona: persona?.Nombre || 'Cliente',
              currentYear: new Date().getFullYear(),
            },
          });
          results.push({
            recipient: usuario.correo,
            status: 'success',
            message: 'Correo promocional enviado exitosamente.',
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : this.isErrorWithMessage(error)
                ? error.message
                : 'Error desconocido al enviar correo promocional.';
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

  async obtenerMembresiasProximasAVencer(): Promise<
    MembresiaVencimientoData[]
  > {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establecer la hora a 00:00:00.000 para 'hoy'

    const tresDiasDespues = new Date();
    tresDiasDespues.setDate(hoy.getDate() + 3);
    // Establecer la hora a 23:59:59.999 para incluir todo el día de 'tresDiasDespues'
    tresDiasDespues.setHours(23, 59, 59, 999);

    const membresias = await this.membresiaRepo.find({
      where: {
        // CAMBIO: Filtrar por FechaFin entre hoy y tresDiasDespues (inclusive)
        FechaFin: Between(hoy, tresDiasDespues),
        PlataformaWeb: Raw((alias) => `${alias} != 'Incluida'`),
        // CAMBIO: Filtrar CICliente que no sea NULL ni cadena vacía para la visualización de la tabla
        CICliente: And(Not(IsNull()), Not('')),
      },
      relations: ['tipo'],
    });

    return membresias.map((m) => ({
      IDMembresia: m.IDMembresia,
      CICliente: m.CICliente,
      FechaFin: new Date(m.FechaFin).toISOString().split('T')[0],
      TipoMembresiaID: m.TipoMembresiaID,
      PlataformaWeb: m.PlataformaWeb,
      tipoNombre: m.tipo?.NombreTipo || 'Desconocido',
      diasRestantes: Math.ceil(
        (new Date(m.FechaFin).getTime() - hoy.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }

  // Métodos de pagos, etc. (se mantienen como están en tu archivo)
}
