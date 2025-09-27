import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { HttpService } from '@nestjs/axios';
import { UrlService } from '../url/url.service';
import { ConfigService } from '../config/config.service';
import * as fs from 'fs-extra';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HostsService implements OnModuleInit {
  private readonly logger = new Logger(HostsService.name);
  private hostsFile = process.env.DNSMASQ_HOSTS || path.join(process.cwd(), 'extra_hosts.conf');

  private readonly jobName = 'hosts-fetch-job';

  constructor(
    private readonly urlService: UrlService,
    private readonly httpService: HttpService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // resolve hosts file from config
    this.hostsFile = await this.configService.getHostsFilePath();
    await this.registerOrUpdateCron();
  }

  async setHostsFile(pathStr: string): Promise<void> {
    this.hostsFile = pathStr;
  }

  async fetchHostsFromUrls(timeoutOverride?: number, returnStats = false): Promise<{hostsCount: number, errorsCount: number}|void> {
    this.logger.log('Starting scheduled hosts fetch...');
    try {
      const urls = await this.urlService.getEnabledUrls();
      if (urls.length === 0) {
        this.logger.log('No enabled URLs to fetch');
        return returnStats ? { hostsCount: 0, errorsCount: 0 } : undefined;
      }

      let allHosts: string[] = [];
      const errors: string[] = [];

      // 获取全局 timeout 配置
      let timeout = timeoutOverride;
      if (!timeout) {
        timeout = await this.configService.getHostsFetchTimeout();
      }
      if (!timeout || timeout < 1000) timeout = 10000;

      for (const urlEntry of urls) {
        try {
          this.logger.log(`Fetching hosts from: ${urlEntry.url}`);

          const response = await firstValueFrom(
            this.httpService.get(urlEntry.url, {
              timeout,
              headers: {
                'User-Agent': 'DNSMasq-Manager/1.0'
              }
            })
          );

          const hosts = this.parseHostsContent(response.data as string);
          allHosts = allHosts.concat(hosts);

          // Update last fetch time
          await this.urlService.updateUrl(urlEntry.id, {
            lastFetch: new Date(),
            lastError: undefined
          });

          this.logger.log(`Fetched ${hosts.length} hosts from ${urlEntry.url}`);
        } catch (error) {
          // 提取详细错误信息
          let details = error?.message || String(error);
          if (error?.response) {
            details += ` | status: ${error.response.status}`;
            if (error.response.data) {
              details += ` | data: ${JSON.stringify(error.response.data)}`;
            }
          }
          if (error?.stack) {
            details += `\nStack: ${error.stack}`;
          }
          const errorMsg = `Failed to fetch from ${urlEntry.url}: ${details}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);

          // Update error status
          await this.urlService.updateUrl(urlEntry.id, {
            lastError: details
          });
        }
      }

      // Write all hosts to file
      if (allHosts.length > 0) {
        await this.writeHostsFile(allHosts);
        this.logger.log(`Successfully wrote ${allHosts.length} hosts to ${this.hostsFile}`);
      }

      if (errors.length > 0) {
        this.logger.warn(`Completed with ${errors.length} errors`);
      }
      if (returnStats) {
        return { hostsCount: allHosts.length, errorsCount: errors.length };
      }
    } catch (error) {
      this.logger.error('Error in scheduled hosts fetch:', error);
      if (returnStats) {
        return { hostsCount: 0, errorsCount: 0 };
      }
    }
  }

  private async registerOrUpdateCron(): Promise<void> {
    const cronExp = await this.configService.getHostsFetchCron();
    // Remove old job if exists
    try {
      const old = this.schedulerRegistry.getCronJob(this.jobName);
      old.stop();
      this.schedulerRegistry.deleteCronJob(this.jobName);
    } catch (_) {}

    const job = new CronJob(cronExp, async () => {
      try {
        await this.fetchHostsFromUrls();
      } catch (e) {
        this.logger.error('Cron job execution failed', e as Error);
      }
    });
    this.schedulerRegistry.addCronJob(this.jobName, job as unknown as any);
    job.start();
    this.logger.log(`Registered cron job '${this.jobName}' with schedule: ${cronExp}`);
  }

  async fetchHostsNow(timeoutOverride?: number): Promise<{ success: boolean; message: string; hostsCount?: number }> {
    try {
      this.logger.log('Manual hosts fetch triggered...');
      const result = await this.fetchHostsFromUrls(timeoutOverride, true) as { hostsCount: number, errorsCount: number } | void;
      if (!result) {
        return { success: true, message: 'No enabled URLs to fetch', hostsCount: 0 };
      }
      const message = result.errorsCount > 0
        ? `Fetched ${result.hostsCount} hosts with ${result.errorsCount} errors`
        : `Successfully fetched ${result.hostsCount} hosts`;
      return {
        success: true,
        message,
        hostsCount: result.hostsCount
      };
    } catch (error) {
      this.logger.error('Error in manual hosts fetch:', error);
      return { success: false, message: `Failed to fetch hosts: ${error.message}` };
    }
  }

  async getHostsContent(): Promise<string> {
    try {
      if (await fs.pathExists(this.hostsFile)) {
        return await fs.readFile(this.hostsFile, 'utf8');
      }
      return '# No hosts file found';
    } catch (error) {
      this.logger.error('Error reading hosts file:', error);
      return '# Error reading hosts file';
    }
  }

  async getHostsStats(): Promise<{ filePath: string; exists: boolean; size?: number; lastModified?: Date; lineCount?: number }> {
    try {
      const exists = await fs.pathExists(this.hostsFile);
      if (!exists) {
        return { filePath: this.hostsFile, exists: false };
      }

      const stats = await fs.stat(this.hostsFile);
      const content = await fs.readFile(this.hostsFile, 'utf8');
      const lineCount = content.split('\n').filter(line => line.trim() && !line.startsWith('#')).length;

      return {
        filePath: this.hostsFile,
        exists: true,
        size: stats.size,
        lastModified: stats.mtime,
        lineCount
      };
    } catch (error) {
      this.logger.error('Error getting hosts stats:', error);
      return { filePath: this.hostsFile, exists: false };
    }
  }

  private parseHostsContent(content: string): string[] {
    const lines = content.split('\n');
    const hosts: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse hosts line (IP address followed by hostnames)
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const ip = parts[0];
        const hostnames = parts.slice(1);
        
        // Validate IP address (basic check)
        if (this.isValidIp(ip)) {
          hosts.push(trimmedLine);
        }
      }
    }

    return hosts;
  }

  private async writeHostsFile(hosts: string[]): Promise<void> {
    const header = `# DNSMasq hosts file
# Generated by AutoHosts
# Last updated: ${new Date().toISOString()}
# Total entries: ${hosts.length}

`;
    
    const content = header + hosts.join('\n') + '\n';
    await fs.writeFile(this.hostsFile, content);
  }

  private isValidIp(ip: string): boolean {
    // Basic IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    // Basic IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(ip);
  }
}
