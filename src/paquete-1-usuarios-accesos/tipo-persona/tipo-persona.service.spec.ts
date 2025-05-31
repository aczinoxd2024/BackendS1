import { Test, TestingModule } from '@nestjs/testing';
import { TipoPersonaService } from './tipo-persona.service';

describe('TipoPersonaService', () => {
  let service: TipoPersonaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipoPersonaService],
    }).compile();

    service = module.get<TipoPersonaService>(TipoPersonaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
