import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../../infra/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let health: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check: jest.fn() } },
        { provide: PrismaHealthIndicator, useValue: { pingCheck: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(HealthController);
    health = module.get(HealthCheckService);
  });

  it('delegates the readiness check to HealthCheckService', async () => {
    const checkSpy = jest.spyOn(health, 'check').mockResolvedValue({
      status: 'ok',
      info: {},
      error: {},
      details: {},
    });

    await controller.check();

    expect(checkSpy).toHaveBeenCalledWith([expect.any(Function)]);
  });
});
