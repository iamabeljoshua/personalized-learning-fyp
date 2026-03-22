import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { getQueueToken } from '@nestjs/bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { AppModule } from './app.module';
import { setupSwagger } from './infrastructure/setup/swagger';
import { CONTENT_GENERATION_QUEUE } from './api/content/content.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve media files (audio, video, images) at /media
  // In Docker: media is at /media. Locally: at ../../media relative to backend dist
  const mediaPath = process.env.MEDIA_STORAGE_PATH || join(__dirname, '..', '..', '..', 'media');
  app.useStaticAssets(mediaPath, {
    prefix: '/media',
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  // Bull Board — queue dashboard at /admin/queues
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const contentQueue = app.get(getQueueToken(CONTENT_GENERATION_QUEUE));
  createBullBoard({
    queues: [new BullMQAdapter(contentQueue)],
    serverAdapter,
  });

  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.use('/admin/queues', serverAdapter.getRouter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
  console.log(`Queue dashboard at http://localhost:${port}/admin/queues`);
}
bootstrap();
