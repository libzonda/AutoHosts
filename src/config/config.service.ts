import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface AppConfigShape {
  hostsFetchCron: string;
  hostsFilePath: string;
}

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly configFilePath = path.join(process.cwd(), 'config.json');
  private readonly defaultConfig: AppConfigShape = {
    hostsFetchCron: '*/5 * * * *',
    hostsFilePath: process.env.DNSMASQ_HOSTS || path.join(process.cwd(), 'extra_hosts.conf'),
  };

  async getConfig(): Promise<AppConfigShape> {
    try {
      const exists = await fs.pathExists(this.configFilePath);
      if (!exists) {
        await this.saveConfig(this.defaultConfig);
        return this.defaultConfig;
      }
      const raw = await fs.readFile(this.configFilePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<AppConfigShape>;
      return { ...this.defaultConfig, ...parsed } as AppConfigShape;
    } catch (error) {
      this.logger.error('Failed to read config.json, using defaults', error as Error);
      return this.defaultConfig;
    }
  }

  async getHostsFetchCron(): Promise<string> {
    const cfg = await this.getConfig();
    return cfg.hostsFetchCron || this.defaultConfig.hostsFetchCron;
  }

  async setHostsFetchCron(cron: string): Promise<void> {
    const current = await this.getConfig();
    current.hostsFetchCron = cron;
    await this.saveConfig(current);
  }

  async getHostsFilePath(): Promise<string> {
    const cfg = await this.getConfig();
    return cfg.hostsFilePath || this.defaultConfig.hostsFilePath;
  }

  async setHostsFilePath(p: string): Promise<void> {
    const resolved = p.trim();
    const current = await this.getConfig();
    current.hostsFilePath = resolved || this.defaultConfig.hostsFilePath;
    await this.saveConfig(current);
  }

  private async saveConfig(cfg: AppConfigShape): Promise<void> {
    await fs.writeFile(this.configFilePath, JSON.stringify(cfg, null, 2));
  }
}


