import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { PagosService } from './pagos.service';
import { RegistroPagoDto } from './registro-pago/registro-pago.dto';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // ✅ Registrar pago presencial (activado)
  @Roles('recepcionista')
  @Post('registrar')
  async registrarPago(@Body() data: RegistroPagoDto) {
    return await this.pagosService.registrarPago(data);
  }

  // ✅ Generar comprobante PDF
  @Get('comprobante/:nroPago')
  async generarComprobante(
    @Param('nroPago') nroPago: number,
    @Res() res: Response,
  ) {
    const buffer = await this.pagosService.generarComprobantePDF(nroPago);

    if (!buffer) {
      throw new NotFoundException('No se pudo generar el comprobante.');
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=comprobante_${nroPago}.pdf`,
    });

    res.send(buffer);
  }

  // ✅ Obtener pagos por CI del cliente
  @Get('cliente/:ci')
  findPagosPorCI(@Param('ci') ci: string) {
    return this.pagosService.obtenerPagosPorCI(ci);
  }
}
