import { Test, TestingModule } from '@nestjs/testing';
import { EstadoInventarioController } from './estado-inventario.controller';

describe('EstadoInventarioController', () => {
  let controller: EstadoInventarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstadoInventarioController],
    }).compile();

    controller = module.get<EstadoInventarioController>(
      EstadoInventarioController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
