import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Exercises the real Prisma connection, so the local Postgres from
// docker-compose.yml (or CI's equivalent service) must be running.
describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET) reports the database as up', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          status: string;
          info: { database: { status: string } };
        };
        expect(body.status).toBe('ok');
        expect(body.info.database.status).toBe('up');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
