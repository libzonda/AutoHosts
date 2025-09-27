import { Injectable, Logger } from '@nestjs/common';
import { spawn, exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  async getStatus(): Promise<DnsmasqStatus> {
    try {
      const { stdout } = await execAsync('ps aux | grep "[d]nsmasq"');
      if (!stdout.trim()) {
        return { isRunning: false };
      }

      // Parse process info
      const processInfo = stdout.trim().split('\n')[0].split(/\s+/);
      const pid = parseInt(processInfo[1]);

      // Get process start time
      const { stdout: timeInfo } = await execAsync(`ps -o lstart= -p ${pid}`);
      const startTime = new Date(timeInfo.trim());

      // Check if DNS port is bound
      const { stdout: portInfo } = await execAsync('netstat -lnp | grep dnsmasq');
      const port = portInfo.includes(':53 ') ? 53 : undefined;

      return {
        isRunning: true,
        pid,
        startTime,
        port,
        command: 'dnsmasq'
      };
    } catch (error) {
      // 如果执行命令失败，可能是因为进程不存在
      if (error.message.includes('no such process')) {
        return { isRunning: false };
      }
      this.logger.error('Error getting dnsmasq status:', error);
      return { isRunning: false };
    }
  }

  async start(): Promise<{ success: boolean; message: string; pid?: number }> {
    try {
      const status = await this.getStatus();
      
      if (status.isRunning) {
        return { success: false, message: 'DNSMasq is already running' };
      }

      // Start dnsmasq process with additional hosts file
      const hostsFile = process.env.DNSMASQ_HOSTS || '/app/data/extra_hosts.conf';
      const child = spawn('dnsmasq', [`--addn-hosts=${hostsFile}`], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Redirect output to log file
      const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
      child.stdout.pipe(logStream);
      child.stderr.pipe(logStream);

      // Wait a moment to check if process started successfully
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
        return { 
          success: false, 
          message: 'DNSMasq failed to start - process not found after launch'
        };
      }
    } catch (error) {
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

      // Kill the process
      await execAsync(`kill ${status.pid}`);
      
      // Wait a moment and check if process is really stopped
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newStatus = await this.getStatus();
      
      if (!newStatus.isRunning) {
        this.logger.log(`DNSMasq stopped (PID: ${status.pid})`);
        return { success: true, message: 'DNSMasq stopped successfully' };
      } else {
        // Try force kill if normal kill failed
        await execAsync(`kill -9 ${status.pid}`);
        return { success: true, message: 'DNSMasq force stopped' };
      }
    } catch (error) {
      this.logger.error('Error stopping dnsmasq:', error);
      return { success: false, message: `Failed to stop dnsmasq: ${error.message}` };
    }
  }

  async restart(): Promise<{ success: boolean; message: string; pid?: number }> {
    try {
      // Stop first
      const stopResult = await this.stop();
      if (!stopResult.success && stopResult.message !== 'DNSMasq is not running') {
        return { success: false, message: `Failed to stop dnsmasq: ${stopResult.message}` };
      }

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Start again
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
