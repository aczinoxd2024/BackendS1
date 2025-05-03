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

@Module({
  imports: [
    // Configuración de la base de datos
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'BaseGym',
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
