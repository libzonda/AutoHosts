import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure extra_hosts.conf and config.json exist, if not, copy from example
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(__dirname, '..', 'data');
  // extra_hosts.conf
  const hostsFile = path.join(dataDir, 'extra_hosts.conf');
  const hostsExampleFile = path.join(__dirname, '..', 'extra_hosts.conf.example');
  if (!fs.existsSync(hostsFile)) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (fs.existsSync(hostsExampleFile)) {
      fs.copyFileSync(hostsExampleFile, hostsFile);
    } else {
      fs.writeFileSync(hostsFile, '# example: 127.0.0.1 my.custom.domain\n');
    }
  }
  // config.json
  const configFile = path.join(__dirname, '..', 'config.json');
  const configExampleFile = path.join(__dirname, '..', 'config.json.example');
  if (!fs.existsSync(configFile)) {
    if (fs.existsSync(configExampleFile)) {
      fs.copyFileSync(configExampleFile, configFile);
    } else {
      fs.writeFileSync(configFile, JSON.stringify({
        hostsFetchCron: "*/5 * * * *",
        hostsFilePath: "/app/data/extra_hosts.conf",
        hostsFetchTimeout: 20000
      }, null, 2));
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
  console.log('AutoHosts is running on http://localhost:3000');
}
bootstrap();
