import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Módulos funcionales de la aplicación
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

// Seguridad global con RolesGuard
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles/roles.guard';
import { HorariosModule } from './horarios/horarios.module';

@Module({
  imports: [
    // Configuración global de variables de entorno (.env o Railway variables)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuración dinámica de TypeORM con soporte para producción y desarrollo
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
        synchronize: false, // 🚨 IMPORTANTE: nunca usar true en producción para no perder datos
      }),
    }),

    // Registro de todos los módulos funcionales de la aplicación
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
  ],
  providers: [
    // Aplicar RolesGuard globalmente para manejar permisos en rutas protegidas
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
