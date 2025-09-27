import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface DnsmasqStatus {
  isRunning: boolean;
  pid?: number;
  startTime?: Date;
  command?: string;
  port?: number;
}

@Injectable()
export class DnsmasqService {
  private readonly logger = new Logger(DnsmasqService.name);
  private readonly logFile = path.join(process.cwd(), 'dnsmasq.log');
  private currentProcess: ReturnType<typeof spawn> | null = null;

  async getStatus(): Promise<DnsmasqStatus> {
    try {
      if (this.currentProcess && this.currentProcess.pid) {
        try {
          // 检查进程是否存在
          await fs.access(`/proc/${this.currentProcess.pid}`);
          // 获取启动时间
          const startTime = await this.getProcessStartTime(this.currentProcess.pid);
          // 检查端口
          const isPortBound = await this.checkPort53();

          return {
            isRunning: true,
            pid: this.currentProcess.pid,
            startTime: startTime || undefined,
            port: isPortBound ? 53 : undefined,
            command: 'dnsmasq'
          };
        } catch (error) {
          // 进程不存在，清理引用
          this.currentProcess = null;
        }
      }

      // 如果没有当前进程或进程不存在，尝试在系统中查找 dnsmasq
      const pid = await this.findDnsmasqPid();
      if (pid) {
        const startTime = await this.getProcessStartTime(pid);
        const isPortBound = await this.checkPort53();

        return {
          isRunning: true,
          pid,
          startTime: startTime || undefined,
          port: isPortBound ? 53 : undefined,
          command: 'dnsmasq'
        };
      }

      return { isRunning: false };
    } catch (error) {
      this.logger.error('Error getting dnsmasq status:', error);
      return { isRunning: false };
    }
  }

  private async findDnsmasqPid(): Promise<number | null> {
    try {
      const procDirs = await fs.readdir('/proc');
      
      for (const dir of procDirs) {
        if (/^\d+$/.test(dir)) {
          try {
            const cmdline = await fs.readFile(`/proc/${dir}/cmdline`, 'utf8');
            if (cmdline.includes('dnsmasq')) {
              return parseInt(dir);
            }
          } catch {
            continue;
          }
        }
      }
      return null;
    } catch (error) {
      this.logger.error('Error finding dnsmasq pid:', error);
      return null;
    }
  }

  private async getProcessStartTime(pid: number): Promise<Date | null> {
    try {
      const statContent = await fs.readFile(`/proc/${pid}/stat`, 'utf8');
      const startTime = parseInt(statContent.split(' ')[21]);
      const btime = await this.getSystemBootTime();
      
      if (btime === null) {
        return null;
      }

      const clockTicks = 100; // 标准 Linux 配置
      const startTimeMs = (btime + startTime / clockTicks) * 1000;
      
      return new Date(startTimeMs);
    } catch (error) {
      return null;
    }
  }

  private async getSystemBootTime(): Promise<number | null> {
    try {
      const statContent = await fs.readFile('/proc/stat', 'utf8');
      const btimeLine = statContent.split('\n').find(line => line.startsWith('btime'));
      if (btimeLine) {
        return parseInt(btimeLine.split(' ')[1]);
      }
      return null;
    } catch {
      return null;
    }
  }

  private async checkPort53(): Promise<boolean> {
    try {
      const [tcp, udp] = await Promise.all([
        fs.readFile('/proc/net/tcp', 'utf8'),
        fs.readFile('/proc/net/udp', 'utf8')
      ]);
      return tcp.includes(':0035') || udp.includes(':0035');
    } catch {
      return false;
    }
  }

  async start(): Promise<{ success: boolean; message: string; pid?: number }> {
    try {
      const status = await this.getStatus();
      
      if (status.isRunning) {
        return { success: false, message: 'DNSMasq is already running' };
      }

      const hostsFile = process.env.DNSMASQ_HOSTS || '/app/data/extra_hosts.conf';
      this.currentProcess = spawn('dnsmasq', [`--addn-hosts=${hostsFile}`], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
      this.currentProcess.stdout?.pipe(logStream);
      this.currentProcess.stderr?.pipe(logStream);

      await new Promise(resolve => setTimeout(resolve, 1000));
      const newStatus = await this.getStatus();

      if (newStatus.isRunning) {
        this.logger.log(`DNSMasq started with PID: ${newStatus.pid}`);
        return { 
          success: true, 
          message: 'DNSMasq started successfully',
          pid: newStatus.pid
        };
      } else {
        this.currentProcess = null;
        return { 
          success: false, 
          message: 'DNSMasq failed to start - process not found after launch'
        };
      }
    } catch (error) {
      this.currentProcess = null;
      this.logger.error('Error starting dnsmasq:', error);
      return { success: false, message: `Failed to start dnsmasq: ${error.message}` };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    try {
      const status = await this.getStatus();
      
      if (!status.isRunning) {
        return { success: false, message: 'DNSMasq is not running' };
      }

      if (this.currentProcess) {
        this.currentProcess.kill();
      } else if (status.pid) {
        process.kill(status.pid);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      const newStatus = await this.getStatus();
      
      if (!newStatus.isRunning) {
        this.logger.log(`DNSMasq stopped (PID: ${status.pid})`);
        return { success: true, message: 'DNSMasq stopped successfully' };
      } else {
        // 强制终止
        if (this.currentProcess) {
          this.currentProcess.kill('SIGKILL');
        } else if (status.pid) {
          process.kill(status.pid, 'SIGKILL');
        }
        this.currentProcess = null;
        return { success: true, message: 'DNSMasq force stopped' };
      }
    } catch (error) {
      this.logger.error('Error stopping dnsmasq:', error);
      return { success: false, message: `Failed to stop dnsmasq: ${error.message}` };
    }
  }

  async restart(): Promise<{ success: boolean; message: string; pid?: number }> {
    try {
      const stopResult = await this.stop();
      if (!stopResult.success && stopResult.message !== 'DNSMasq is not running') {
        return { success: false, message: `Failed to stop dnsmasq: ${stopResult.message}` };
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      return await this.start();
    } catch (error) {
      this.logger.error('Error restarting dnsmasq:', error);
      return { success: false, message: `Failed to restart dnsmasq: ${error.message}` };
    }
  }

  async getLogs(): Promise<string> {
    try {
      if (await fs.pathExists(this.logFile)) {
        return await fs.readFile(this.logFile, 'utf8');
      }
      return 'No logs available';
    } catch (error) {
      this.logger.error('Error reading logs:', error);
      return 'Error reading logs';
    }
  }
}