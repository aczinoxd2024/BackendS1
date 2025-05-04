import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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

// Seguridad global con RolesGuard
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles/roles.guard';
import { TipoMembresiaModule } from './membresias/Tipos/tipo-menbresia.module';
import { MetodoPagoModule } from './pagos/metodo-pago/metodo-pago.module';

@Module({
  imports: [
    // Configuración de la base de datos
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'centerbeam.proxy.rlwy.net',
      port: 41437,
      username: 'root',
      password: 'eFtVsqohJVjCqNGzPhDyTYGYjgdoeoRL',
      database: 'railway',
      autoLoadEntities: true,
      synchronize: false, // Producción recomendado en false
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
