import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GpersonalController } from './gpersonal.controller';
import { GpersonalService } from './gpersonal.service';

import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { Personal } from 'paquete-2-servicios-gimnasio/personal/personal.entity';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { UsuarioPerfil } from 'paquete-1-usuarios-accesos/usuarios/usuario-perfil.entity';
import { Perfil } from 'paquete-1-usuarios-accesos/usuarios/perfil.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity'; // ✅ Agregado

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Persona,
      Personal,
      Usuario,
      UsuarioPerfil,
      Perfil,
      Bitacora, // ✅ Necesario para registrar acciones en la bitácora
    ]),
  ],
  controllers: [GpersonalController],
  providers: [GpersonalService],
})
export class GpersonalModule {}
