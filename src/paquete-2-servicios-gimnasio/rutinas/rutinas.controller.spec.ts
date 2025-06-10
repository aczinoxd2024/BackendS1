import { Test, TestingModule } from '@nestjs/testing';
import { RutinasController } from './rutinas.controller';

describe('RutinasController', () => {
  let controller: RutinasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RutinasController],
    }).compile();

    controller = module.get<RutinasController>(RutinasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
