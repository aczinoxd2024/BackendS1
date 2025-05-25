import { Controller, Get } from '@nestjs/common';
import { SalaService } from './sala.service';

@Controller('salas')
export class SalaController {
  constructor(private readonly salaService: SalaService) {}

  @Get()
  findAll() {
    return this.salaService.findAll();
  }
}
