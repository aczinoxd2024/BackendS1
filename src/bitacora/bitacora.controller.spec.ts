import { Test, TestingModule } from '@nestjs/testing';
import { BitacoraController } from './bitacora.controller';

describe('BitacoraController', () => {
  let controller: BitacoraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BitacoraController],
    }).compile();

    controller = module.get<BitacoraController>(BitacoraController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
