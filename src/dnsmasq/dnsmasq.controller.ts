import { Controller, Get, Post, Body } from '@nestjs/common';
import { DnsmasqService, DnsmasqStatus } from './dnsmasq.service';

@Controller('api/dnsmasq')
export class DnsmasqController {
  constructor(private readonly dnsmasqService: DnsmasqService) {}

  @Get('status')
  async getStatus(): Promise<DnsmasqStatus> {
    return this.dnsmasqService.getStatus();
  }

  @Post('start')
  async start() {
    return this.dnsmasqService.start();
  }

  @Post('stop')
  async stop() {
    return this.dnsmasqService.stop();
  }

  @Post('restart')
  async restart() {
    return this.dnsmasqService.restart();
  }

  @Get('logs')
  async getLogs(): Promise<{ logs: string }> {
    const logs = await this.dnsmasqService.getLogs();
    return { logs };
  }
}
