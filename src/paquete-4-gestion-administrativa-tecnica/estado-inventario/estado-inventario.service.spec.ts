import { Test, TestingModule } from '@nestjs/testing';
import { EstadoInventarioService } from './estado-inventario.service';

describe('EstadoInventarioService', () => {
  let service: EstadoInventarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstadoInventarioService],
    }).compile();

    service = module.get<EstadoInventarioService>(EstadoInventarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
