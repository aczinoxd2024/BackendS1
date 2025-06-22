import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import { RawBodyRequest } from './stripe/raw-body-request.interface';

// Módulos funcionales
import { SalaModule } from 'salas/sala.module';
import { ClasesModule } from 'paquete-2-servicios-gimnasio/clases/clases.module';
import { ReservasModule } from 'paquete-2-servicios-gimnasio/reservas/reservas.module';
import { DashboardModule } from 'dashboard/dashboard.module';
import { MetodoPagoModule } from 'pagos/metodo-pago/metodo-pago.module';
import { PersonalModule } from 'paquete-2-servicios-gimnasio/personal/personal.module';
import { DiaSemanaModule } from 'paquete-2-servicios-gimnasio/dia-semana/dia-semana.module';
import { HorariosModule } from 'paquete-2-servicios-gimnasio/horarios/horarios.module';
import { AsistenciaModule } from 'paquete-2-servicios-gimnasio/asistencia/asistencia.module';
import { StripeModule } from 'stripe/stripe.module';

import { AuthModule } from 'paquete-1-usuarios-accesos/auth/auth.module';
import { UsuariosModule } from 'paquete-1-usuarios-accesos/usuarios/usuarios.module';
import { ClientesModule } from 'paquete-1-usuarios-accesos/clientes/clientes.module';
import { PersonasModule } from 'paquete-1-usuarios-accesos/personas/personas.module';
import { TipoPersonaModule } from 'paquete-1-usuarios-accesos/tipo-persona/tipo-persona.module';
import { PersonaTipoModule } from 'paquete-1-usuarios-accesos/persona-tipo/persona-tipo.module';
import { BitacoraModule } from 'paquete-1-usuarios-accesos/bitacora/bitacora.module';

import { SeguimientoClienteModule } from 'paquete-3-control-comercial/seguimiento-cliente/seguimiento-cliente.module';
import { MembresiasModule } from './paquete-3-control-comercial/membresias/membresias.module';
import { TipoMembresiaModule } from './paquete-3-control-comercial/membresias/Tipos/tipo_membresia.module';


// Seguridad global
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
// Correo con templates
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

// comprobantePago
import { PagosModule } from './pagos/pagos.module';
import { GpersonalModule } from 'paquete-1-usuarios-accesos/gestion-personal/gpersonal.module';
//import { RutinasModule } from './paquete-2-servicios-instructor/rutinas/rutinas.module';
import { RutinasModule } from './paquete-2-servicios-gimnasio/rutinas/rutinas.module';
import { InventarioModule } from './paquete-4-gestion-administrativa-tecnica/inventario/inventario.module';
import { EstadoInventarioModule } from './paquete-4-gestion-administrativa-tecnica/estado-inventario/estado-inventario.module';
import { InventarioUsoModule } from './paquete-4-gestion-administrativa-tecnica/inventario-uso/inventario-uso.module';
import { InventarioResponsableModule } from './paquete-4-gestion-administrativa-tecnica/inventario-responsable/inventario-responsable.module';
import { ReportesEstadisticasModule } from 'paquete-4-gestion-administrativa-tecnica/reportes-estadisticas/reportes-estadisticas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StripeModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: `"GoFit GYM" <${configService.get<string>('EMAIL_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false, // Nunca en true en producción
      }),
    }),

    // Módulos funcionales
    UsuariosModule,
    ClientesModule,
    PersonasModule,
    TipoPersonaModule,
    PersonaTipoModule,
    AuthModule,
    MembresiasModule,
    ClasesModule,
    DashboardModule,
    ReservasModule,
    BitacoraModule,
    MetodoPagoModule,
    TipoMembresiaModule,
    HorariosModule,
    PersonalModule,
    DiaSemanaModule,
    AsistenciaModule,
    SalaModule,
    PagosModule,
    GpersonalModule,
    SeguimientoClienteModule,
    RutinasModule,
    AsistenciaModule,
    InventarioModule,
    EstadoInventarioModule,
    InventarioUsoModule,
    InventarioResponsableModule,
    ReportesEstadisticasModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        express.raw({ type: 'application/json' }),
        (req: Request, _res: Response, next: NextFunction) => {
          (req as RawBodyRequest).rawBody = req.body as Buffer;
          next();
        },
      )
      .forRoutes({ path: 'api/stripe/webhook', method: RequestMethod.POST });
  }
}
