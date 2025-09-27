import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure extra_hosts.conf exists, if not, copy from example
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(__dirname, '..', 'data');
  const hostsFile = path.join(dataDir, 'extra_hosts.conf');
  const exampleFile = path.join(__dirname, '..', 'extra_hosts.conf.example');
  if (!fs.existsSync(hostsFile)) {
    // Ensure data dir exists
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (fs.existsSync(exampleFile)) {
      fs.copyFileSync(exampleFile, hostsFile);
    } else {
      fs.writeFileSync(hostsFile, '# example: 127.0.0.1 my.custom.domain\n');
    }
  }

  // Serve static files (auto-detect src/public for dev, dist/public for prod)
  const devPublic = join(__dirname, '..', 'src', 'public');
  const prodPublic = join(__dirname, 'public');
  const staticDir = fs.existsSync(devPublic) ? devPublic : prodPublic;
  app.useStaticAssets(staticDir, {
    index: 'index.html',
  });

  // Enable CORS for development
  app.enableCors();

  await app.listen(3000);
  console.log('DNSMasq Manager is running on http://localhost:3000');
}
bootstrap();
