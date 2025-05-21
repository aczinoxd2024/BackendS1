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
import { UsuariosModule } from './usuarios/usuarios.module';
import { ClientesModule } from './clientes/clientes.module';
import { PersonasModule } from './personas/personas.module';
import { TipoPersonaModule } from './tipo-persona/tipo-persona.module';
import { PersonaTipoModule } from './persona-tipo/persona-tipo.module';
import { AuthModule } from './auth/auth.module';
import { MembresiasModule } from './membresias/membresias.module';
import { ClasesModule } from './clases/clases.module';
import { ReservasModule } from './reservas/reservas.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BitacoraModule } from './bitacora/bitacora.module';
import { TipoMembresiaModule } from './membresias/Tipos/tipo-menbresia.module';
import { MetodoPagoModule } from './pagos/metodo-pago/metodo-pago.module';
import { PersonalModule } from './personal/personal.module';
import { DiaSemanaModule } from './dia-semana/dia-semana.module';
import { HorariosModule } from './horarios/horarios.module';
import { AsistenciaModule } from './asistencia/asistencia.module';
import { StripeModule } from './stripe/stripe.module';

// Seguridad global
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles/roles.guard';

// Correo con templates
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

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
