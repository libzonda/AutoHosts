import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { DnsmasqService } from './dnsmasq/dnsmasq.service';
import { DnsmasqController } from './dnsmasq/dnsmasq.controller';
import { UrlService } from './url/url.service';
import { UrlController } from './url/url.controller';
import { HostsService } from './hosts/hosts.service';
import { HostsController } from './hosts/hosts.controller';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [DnsmasqController, UrlController, HostsController],
  providers: [DnsmasqService, UrlService, HostsService, ConfigService],
})
export class AppModule {}
