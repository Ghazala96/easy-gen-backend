import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1'
  });

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Easygenerator API')
    .setDescription('Easygenerator take-home task')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  app
    .getHttpAdapter()
    .getInstance()
    .get('/api-json', (req, res) => res.json(document));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
