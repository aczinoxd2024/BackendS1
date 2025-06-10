import { Test, TestingModule } from '@nestjs/testing';
import { RutinasService } from './rutinas.service';

describe('RutinasService', () => {
  let service: RutinasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RutinasService],
    }).compile();

    service = module.get<RutinasService>(RutinasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
