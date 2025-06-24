// promociones.controller.ts
import { JwtAuthGuard } from '@auth/jwt.auth.guard';
import { Roles } from '@auth/roles/roles.decorator';
import { RolesGuard } from '@auth/roles/roles.guard';
import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Get,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PromocionesService } from './promociones.service';

@Controller('promociones')
export class PromocionesController {
  constructor(private readonly promocionesService: PromocionesService) {}

  @Post('enviar-con-imagen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = extname(file.originalname).toLowerCase();
        const mimetype = file.mimetype;

        if (allowedTypes.test(ext) && allowedTypes.test(mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Solo se permiten archivos .jpg, .jpeg o .png',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 1 * 1024 * 1024, // 1 MB
      },
    }),
  )
  async enviarPromocionConImagen(
    @UploadedFile() file: Express.Multer.File,
    @Body('mensaje') mensaje: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen.');
    }
    if (!mensaje) {
      throw new BadRequestException('El mensaje promocional es obligatorio.');
    }
    return this.promocionesService.enviarCorreosConImagen(file.path, mensaje);
  }
  @Get('clientes-vigentes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista')
  async listarClientesVigentes(): Promise<any[]> {
    return await this.promocionesService.obtenerClientesVigentes();
  }
}
