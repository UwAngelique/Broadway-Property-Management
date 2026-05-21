import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateProductionEnv } from './config/env.validation';
import * as fs from 'fs';
import helmet from 'helmet';

const uploadDirs = [
  './uploads/payments',
  './uploads/contracts',
  './uploads/expenses',
  './uploads/ebm',
  './uploads/rdb',
  './uploads/statements',
  './uploads/invoices',
];
for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function bootstrap() {
  validateProductionEnv();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const origins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: origins?.length ? origins : process.env.NODE_ENV !== 'production',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
