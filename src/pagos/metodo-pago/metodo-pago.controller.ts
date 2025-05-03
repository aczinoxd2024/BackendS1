import { Controller, Get } from '@nestjs/common';
import { MetodoPagoService } from './metodo-pago.service';

@Controller('metodos-pago')
export class MetodoPagoController {
  constructor(private readonly metodoPagoService: MetodoPagoService) {}

  @Get()
  findAll() {
    return this.metodoPagoService.findAll();
  }
}
