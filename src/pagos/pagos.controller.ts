import { Controller, Post, Body } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RegistroPagoDto } from './registro-pago/registro-pago.dto';

//Para comprobante de pago
import { Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';

//para comprobante pdf
import { NotFoundException } from '@nestjs/common';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // ✅ Solo recepcionista puede registrar pagos en caso de ser presencial
  @Roles('recepcionista')
  @Post('registrar')
  async registrarPago(@Body() data: RegistroPagoDto) {
    return await this.pagosService.registrarPago(data);
  }

  //logica nueva para comprobante de pago
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
}
