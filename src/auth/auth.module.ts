import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    UsuariosModule,
    JwtModule.register({
      secret: 'your_secret_key', // 👈 si quieres definirlo más explícito
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule], // 🔥 exporta JwtModule
})
export class AuthModule {}
