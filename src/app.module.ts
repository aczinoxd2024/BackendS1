import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ClientesModule } from './clientes/clientes.module';
import { PersonasModule } from './personas/personas.module';
import { TipoPersonaModule } from './tipo-persona/tipo-persona.module';
import { PersonaTipoModule } from './persona-tipo/persona-tipo.module';
import { AuthModule } from './auth/auth.module';
import { MembresiasModule } from './membresias/membresias.module';
import { ClasesModule } from './clases/clases.module';
import { ReservasModule } from './reservas/reservas.module';
import { APP_GUARD } from '@nestjs/core';
// 🔥 Corrige la ruta si es necesario
import { JwtService } from '@nestjs/jwt'; // 🔥 El RolesGuard necesita JwtService
import { RolesGuard } from './auth/roles/roles.guard';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'BaseGym',
      autoLoadEntities: true,
      synchronize: false,
    }),
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    JwtService, // Necesario para el guard
  ],
})
export class AppModule {}
