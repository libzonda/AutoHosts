import { Injectable, Logger } from '@nestjs/common';
import { spawn, exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface DnsmasqStatus {
  isRunning: boolean;
  pid?: number;
  startTime?: Date;
  command?: string;
}

@Injectable()
export class DnsmasqService {
  private readonly logger = new Logger(DnsmasqService.name);
  private readonly pidFile = path.join(process.cwd(), 'dnsmasq.pid');
  private readonly logFile = path.join(process.cwd(), 'dnsmasq.log');

  async getStatus(): Promise<DnsmasqStatus> {
    try {
      if (await fs.pathExists(this.pidFile)) {
        const pid = parseInt(await fs.readFile(this.pidFile, 'utf8'));
        
        // Check if process is actually running
        const isRunning = await this.isProcessRunning(pid);
        
        if (isRunning) {
          const stats = await fs.stat(this.pidFile);
          return {
            isRunning: true,
            pid,
            startTime: stats.birthtime,
            command: 'dnsmasq --no-daemon'
          };
        } else {
          // Clean up stale PID file
          await fs.remove(this.pidFile);
        }
      }
      
      return { isRunning: false };
    } catch (error) {
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

      // Start dnsmasq process
      const child = spawn('dnsmasq', ['--no-daemon'], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Write PID to file
      await fs.writeFile(this.pidFile, child.pid.toString());
      
      // Redirect output to log file
      const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
      child.stdout.pipe(logStream);
      child.stderr.pipe(logStream);

      this.logger.log(`DNSMasq started with PID: ${child.pid}`);
      
      return { 
        success: true, 
        message: 'DNSMasq started successfully',
        pid: child.pid
      };
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
      const killed = await this.killProcess(status.pid);
      
      if (killed) {
        // Remove PID file
        await fs.remove(this.pidFile);
        this.logger.log(`DNSMasq stopped (PID: ${status.pid})`);
        return { success: true, message: 'DNSMasq stopped successfully' };
      } else {
        return { success: false, message: 'Failed to stop dnsmasq process' };
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
      const startResult = await this.start();
      return startResult;
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

  private async isProcessRunning(pid: number): Promise<boolean> {
    return new Promise((resolve) => {
      // Use different commands for Windows and Unix-like systems
      const isWindows = process.platform === 'win32';
      const command = isWindows ? `tasklist /FI "PID eq ${pid}"` : `ps -p ${pid}`;
      
      exec(command, (error, stdout) => {
        if (error) {
          resolve(false);
        } else {
          resolve(stdout.includes(pid.toString()));
        }
      });
    });
  }

  private async killProcess(pid: number): Promise<boolean> {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? `taskkill /PID ${pid} /F` : `kill ${pid}`;
      
      exec(command, (error) => {
        if (error) {
          this.logger.error(`Failed to kill process ${pid}:`, error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}
