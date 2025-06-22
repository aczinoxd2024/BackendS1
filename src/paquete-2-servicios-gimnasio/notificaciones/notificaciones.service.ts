import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Raw } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { Membresia } from '../../paquete-3-control-comercial/membresias/membresia.entity';
import { TipoMembresia } from '../../paquete-3-control-comercial/membresias/Tipos/tipo_membresia.entity';

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
    // Expresión regular estricta para correos @gmail.com válidos
    const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return regex.test(correo);
  }

  async sendMembershipExpirationAlerts(
    daysBeforeExpiration: number,
  ): Promise<string> {
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

    let enviados = 0;

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
          enviados++;
        } catch (error) {
          console.error(`❌ Error al enviar a ${usuario.correo}:`, error);
        }
      }
    }

    return `✔️ Correos enviados: ${enviados}`;
  }
  async obtenerMembresiasProximasAVencer(): Promise<any[]> {
    const hoy = new Date();
    const tresDiasDespues = new Date();
    tresDiasDespues.setDate(hoy.getDate() + 3);

    const membresias = await this.membresiaRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.cliente', 'cliente')
      .where('m.FechaFin BETWEEN :hoy AND :tresDias', {
        hoy: hoy.toISOString().split('T')[0],
        tresDias: tresDiasDespues.toISOString().split('T')[0],
      })
      .andWhere("m.PlataformaWeb != 'Incluida'")
      .orderBy('m.FechaFin', 'ASC')
      .getMany();

    return membresias.map((m) => ({
      IDMembresia: m.IDMembresia,
      CICliente: m.CICliente,
      FechaFin: m.FechaFin,
      TipoMembresiaID: m.TipoMembresiaID,
      PlataformaWeb: m.PlataformaWeb,
      diasRestantes: Math.ceil(
        (new Date(m.FechaFin).getTime() - hoy.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }

  async sendPromotionalEmail(
    subject: string,
    htmlContent: string,
  ): Promise<string> {
    const clientes = await this.clienteRepo.find();
    let enviados = 0;

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
          enviados++;
        } catch (error) {
          console.error(`❌ Falló enviar a ${usuario.correo}:`, error);
        }
      }
    }

    return `📢 Promociones enviadas: ${enviados}`;
  }
}
