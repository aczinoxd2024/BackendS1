import { Test, TestingModule } from '@nestjs/testing';
import { MembresiasController } from './membresias.controller';

describe('MembresiasController', () => {
  let controller: MembresiasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembresiasController],
    }).compile();

    controller = module.get<MembresiasController>(MembresiasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
