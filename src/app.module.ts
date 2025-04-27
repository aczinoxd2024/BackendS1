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

@Module({
  imports: [
    // Configuración de la conexión a la base de datos con TypeORM
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root', // Cambia aquí tu usuario
      password: 'root', // Cambia aquí tu contraseña
      database: 'BaseGym', // Nombre de la base de datos
      autoLoadEntities: true, // Carga automática de todas las entidades
      synchronize: false, // Establecer en 'true' solo en desarrollo para que se sincronice automáticamente
    }),

    // Módulos de la aplicación
    UsuariosModule,
    ClientesModule,
    PersonasModule,
    TipoPersonaModule,
    PersonaTipoModule,
    AuthModule,
    MembresiasModule,
    ClasesModule,
    ReservasModule,
  ],
})
export class AppModule {}
