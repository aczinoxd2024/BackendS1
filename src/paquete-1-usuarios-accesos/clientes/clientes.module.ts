import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './cliente.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';

// 🔥 IMPORTAR módulos necesarios
import { PersonasModule } from 'src/paquete-1-usuarios-accesos/personas/personas.module';
import { Usuario } from 'src/paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { UsuarioPerfil } from 'src/paquete-1-usuarios-accesos/usuarios/usuario-perfil.entity';
import { Perfil } from 'src/paquete-1-usuarios-accesos/usuarios/perfil.entity';
import { Bitacora } from 'src/paquete-1-usuarios-accesos/bitacora/bitacora.entity';
import { Membresia } from 'src/membresias/menbresia.entity';
import { TipoMembresiaModule } from 'src/membresias/Tipos/tipo-menbresia.module';
import { MetodoPagoModule } from 'src/pagos/metodo-pago/metodo-pago.module';
import { PagosModule } from 'src/pagos/pagos.module';
import { EstadoCliente } from './estado-cliente/estado-cliente.entity';
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
