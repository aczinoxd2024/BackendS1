import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Módulos de la aplicación
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

// Seguridad global con RolesGuard
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles/roles.guard';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuración dinámica de la base de datos usando las variables de entorno
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT', '3306')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false, // 🚨 IMPORTANTE: NUNCA true en producción
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
