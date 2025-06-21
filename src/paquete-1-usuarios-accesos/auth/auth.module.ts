import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from 'paquete-1-usuarios-accesos/usuarios/usuarios.module';
import { BitacoraModule } from 'paquete-1-usuarios-accesos/bitacora/bitacora.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { JwtStrategy } from './jwt.strategy';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoCliente } from 'paquete-1-usuarios-accesos/clientes/estado-cliente/estado-cliente.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsuariosModule,
    BitacoraModule,
    TypeOrmModule.forFeature([EstadoCliente]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          secure: false,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"Soporte Gym" <${configService.get<string>('MAIL_FROM')}>`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RolesGuard, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
