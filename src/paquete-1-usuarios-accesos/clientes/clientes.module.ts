import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './cliente.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';

// 🔥 IMPORTAR módulos necesarios
import { PersonasModule } from 'paquete-1-usuarios-accesos/personas/personas.module';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { UsuarioPerfil } from 'paquete-1-usuarios-accesos/usuarios/usuario-perfil.entity';
import { Perfil } from 'paquete-1-usuarios-accesos/usuarios/perfil.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';
import { Membresia } from 'paquete-3-control-comercial/membresias/membresia.entity';
import { EstadoCliente } from './estado-cliente/estado-cliente.entity';
import { TipoMembresiaModule } from 'paquete-3-control-comercial/membresias/Tipos/tipo_membresia.module';
import { MetodoPagoModule } from 'pagos/metodo-pago/metodo-pago.module';
import { PagosModule } from 'pagos/pagos.module';

// ✅ AÑADIDO ESTE

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente,
      Usuario,
      UsuarioPerfil,
      Perfil,
      Bitacora,
      Membresia,
      EstadoCliente,
    ]),
    PersonasModule,
    TipoMembresiaModule,
    MetodoPagoModule, // ✅ Correcto
    PagosModule, // ✅ AÑADIDO → Esto es lo único que faltaba
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
