import 'reflect-metadata'

import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser = require('cookie-parser')

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import type { AppEnvironment } from './config/environment'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  })
  const config = app.get<ConfigService<AppEnvironment, true>>(ConfigService)
  const prefix = config.get('API_PREFIX', { infer: true })
  const port = config.get('PORT', { infer: true })
  const origins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.set('trust proxy', 1)
  app.setGlobalPrefix(prefix)
  app.enableCors({
    origin: origins,
    credentials: true,
  })
  app.use(cookieParser())
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
  app.enableShutdownHooks()

  await app.listen(port, '0.0.0.0')
  console.log(`[api] listening on http://localhost:${port}/${prefix}`)
}

void bootstrap()
