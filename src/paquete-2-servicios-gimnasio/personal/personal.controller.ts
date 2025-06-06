import { Controller, Get, Param } from '@nestjs/common';
import { PersonalService } from './personal.service';

@Controller('personal')
export class PersonalController {
  constructor(private readonly personalService: PersonalService) {}

  @Get()
  getAll() {
    return this.personalService.findAll();
  }

  @Get(':ci')
  getByCi(@Param('ci') ci: string) {
    return this.personalService.findOne(ci);
  }
}

