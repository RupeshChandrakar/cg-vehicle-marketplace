// Must run before anything below it: EnquiriesGateway's @WebSocketGateway
// decorator reads process.env.CORS_ORIGINS at module-import time (see
// config/cors-origins.util.ts), which happens as a side effect of the
// `AppModule` import just below. Loading dotenv first guarantees
// process.env is already populated when that decorator evaluates.
import 'dotenv/config';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { getCorsOrigins } from './config/cors-origins.util';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Customer web and admin web run on separate origins — restricted to an
  // explicit allowlist (CORS_ORIGINS) rather than the previous
  // app.enableCors() default, which reflected any calling origin.
  app.enableCors({ origin: getCorsOrigins() });

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

bootstrap().catch((error: unknown) => {
  // Without this, a thrown/rejected bootstrap() (e.g. env.validation.ts's
  // Joi schema failing) becomes an *unhandled promise rejection* instead
  // of a normal caught error — Node 15+ terminates the process for those
  // by default, which is what actually happens here, just via a much
  // less informative path than a deliberate, logged exit.
  Logger.error(
    'Fatal error during bootstrap — the app never started listening.',
    undefined,
    'Bootstrap',
  );
  Logger.error(
    error instanceof Error ? error.stack : error,
    undefined,
    'Bootstrap',
  );
  process.exit(1);
});
