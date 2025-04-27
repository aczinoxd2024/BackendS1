import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller'; // Importa el controlador
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module'; // Asegúrate de importar este módulo

@Module({
  imports: [
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1h' },
    }),
    UsuariosModule,
  ],
  controllers: [AuthController], // Asegúrate de que el controlador esté declarado aquí
  providers: [AuthService],
})
export class AuthModule {}
