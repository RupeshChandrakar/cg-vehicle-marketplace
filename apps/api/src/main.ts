import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Customer web and admin web run on separate origins in development.
  app.enableCors();

  // EnquiriesGateway's chat rooms run over Socket.IO — explicit rather than
  // relying on Nest's default adapter selection.
  app.useWebSocketAdapter(new IoAdapter(app));

  // Never trust client-side validation alone: strip unknown fields and
  // reject requests that don't match a DTO's shape.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);

  Logger.log(`API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
