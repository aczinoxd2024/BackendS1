import { Test, TestingModule } from '@nestjs/testing';
import { PersonaTipoService } from './persona-tipo.service';

describe('PersonaTipoService', () => {
  let service: PersonaTipoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonaTipoService],
    }).compile();

    service = module.get<PersonaTipoService>(PersonaTipoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
