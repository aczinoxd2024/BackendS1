import { Controller, Post, Body } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RegistroPagoDto } from './registro-pago/registro-pago.dto';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // ✅ Solo recepcionista puede registrar pagos
  @Roles('recepcionista')
  @Post('registrar')
  async registrarPago(@Body() data: RegistroPagoDto) {
    return await this.pagosService.registrarPago(data);
  }
}
