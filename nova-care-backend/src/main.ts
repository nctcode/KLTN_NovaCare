import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ── Security ─────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global Validation Pipe ───────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // ── Global Exception Filter ──────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global Logging Interceptor ───────────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Global JWT Guard ─────────────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // ── Swagger ──────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('NovaCare API')
    .setDescription(
      `## API cho nền tảng đặt lịch khám trực tuyến NovaCare

### Hướng dẫn sử dụng:
1. Đăng ký tài khoản: \`POST /api/v1/auth/register\`
2. Đăng nhập để lấy token: \`POST /api/v1/auth/login\`
3. Nhấn nút **Authorize** và nhập access token vào ô \`Bearer\`
4. Sử dụng các API khác với token đã xác thực`
    )
    .setVersion('1.0.0')
    .setContact('NovaCare Team', 'https://novacare.vn', 'support@novacare.vn')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập access token JWT',
        in: 'header',
      },
      'access-token'
    )
    .addTag('Xác thực', 'Đăng ký, đăng nhập, refresh token')
    .addTag('Người dùng', 'Quản lý thông tin người dùng')
    .addTag('Hồ sơ người đi khám', 'CRUD hồ sơ người đi khám')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
    customCss: `
      .swagger-ui .topbar { background-color: #66FF33; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
    customSiteTitle: 'NovaCare API Docs',
  });

  // ── Start Server ─────────────────────────────────────────────────────
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 NovaCare API đang chạy tại: http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api-docs`);
  logger.log(`🌍 Môi trường: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
