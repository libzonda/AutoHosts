import { Controller, Get, Post, Body } from '@nestjs/common';
import { HostsService } from './hosts.service';
import { ConfigService } from '../config/config.service';

@Controller('api/hosts')
export class HostsController {
  constructor(
    private readonly hostsService: HostsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('content')
  async getHostsContent(): Promise<{ content: string }> {
    const content = await this.hostsService.getHostsContent();
    return { content };
  }

  @Get('stats')
  async getHostsStats() {
    return this.hostsService.getHostsStats();
  }

  @Post('fetch')
  async fetchHostsNow() {
    return this.hostsService.fetchHostsNow();
  }

  @Get('schedule')
  async getSchedule(): Promise<{ cron: string }> {
    const cron = await this.configService.getHostsFetchCron();
    return { cron };
  }

  @Post('schedule')
  async setSchedule(@Body() body: { cron: string }): Promise<{ success: boolean; message: string; cron?: string }> {
    const cron = (body?.cron || '').trim();
    if (!cron) {
      return { success: false, message: 'Cron expression is required' };
    }
    try {
      await this.configService.setHostsFetchCron(cron);
      // re-register job
      // HostsService will read from ConfigService when registering
      // and we expose a small internal method to re-register
      // Reuse existing method
      // @ts-ignore - call private method intentionally
      await this.hostsService['registerOrUpdateCron']();
      return { success: true, message: 'Schedule updated', cron };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to update schedule' };
    }
  }

  @Get('path')
  async getHostsPath(): Promise<{ path: string }> {
    const p = await this.configService.getHostsFilePath();
    return { path: p };
  }

  @Post('path')
  async setHostsPath(@Body() body: { path: string }): Promise<{ success: boolean; message: string; path?: string }> {
    const p = (body?.path || '').trim();
    if (!p) {
      return { success: false, message: 'Path is required' };
    }
    try {
      await this.configService.setHostsFilePath(p);
      await this.hostsService.setHostsFile(p);
      return { success: true, message: 'Hosts path updated', path: p };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to update hosts path' };
    }
  }
}
