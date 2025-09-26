import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface UrlEntry {
  id: string;
  url: string;
  name?: string;
  enabled: boolean;
  lastFetch?: Date;
  lastError?: string;
}

@Injectable()
export class UrlService {
  private readonly logger = new Logger(UrlService.name);
  private readonly urlsFile = path.join(process.cwd(), 'urls.json');

  private async initializeUrlsFile(): Promise<void> {
    try {
      // Create an empty array if file doesn't exist
      if (!(await fs.pathExists(this.urlsFile))) {
        this.logger.log('URLs file not found, creating empty file');
        await fs.writeJson(this.urlsFile, [], { spaces: 2 });
      } else {
        // Validate file content
        const content = await fs.readFile(this.urlsFile, 'utf8');
        try {
          const data = JSON.parse(content);
          if (!Array.isArray(data)) {
            this.logger.warn('Invalid URLs file format, resetting to empty array');
            await fs.writeJson(this.urlsFile, [], { spaces: 2 });
          }
        } catch (parseError) {
          this.logger.error('URLs file contains invalid JSON, resetting to empty array');
          await fs.writeJson(this.urlsFile, [], { spaces: 2 });
        }
      }
    } catch (error) {
      this.logger.error('Error initializing URLs file:', error);
      throw new Error('Failed to initialize URLs file');
    }
  }

  async getAllUrls(): Promise<UrlEntry[]> {
    try {
      await this.initializeUrlsFile();
      const data = await fs.readFile(this.urlsFile, 'utf8');
      const urls = JSON.parse(data);
      return Array.isArray(urls) ? urls : [];
    } catch (error) {
      this.logger.error('Error reading URLs file:', error);
      return [];
    }
  }

  async addUrl(url: string, name?: string): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      const urls = await this.getAllUrls();
      
      // Check if URL already exists
      if (urls.some(entry => entry.url === url)) {
        return { success: false, message: 'URL already exists' };
      }

      const newEntry: UrlEntry = {
        id: this.generateId(),
        url: url.trim(),
        name: name?.trim() || '',
        enabled: true,
      };

      urls.push(newEntry);
      await this.saveUrls(urls);

      this.logger.log(`Added URL: ${url}`);
      return { success: true, message: 'URL added successfully', id: newEntry.id };
    } catch (error) {
      this.logger.error('Error adding URL:', error);
      return { success: false, message: `Failed to add URL: ${error.message}` };
    }
  }

  async updateUrl(id: string, updates: Partial<UrlEntry>): Promise<{ success: boolean; message: string }> {
    try {
      const urls = await this.getAllUrls();
      const index = urls.findIndex(entry => entry.id === id);

      if (index === -1) {
        return { success: false, message: 'URL not found' };
      }

      // Check if URL already exists (excluding current entry)
      if (updates.url && urls.some((entry, i) => i !== index && entry.url === updates.url)) {
        return { success: false, message: 'URL already exists' };
      }

      urls[index] = { ...urls[index], ...updates };
      await this.saveUrls(urls);

      this.logger.log(`Updated URL: ${id}`);
      return { success: true, message: 'URL updated successfully' };
    } catch (error) {
      this.logger.error('Error updating URL:', error);
      return { success: false, message: `Failed to update URL: ${error.message}` };
    }
  }

  async deleteUrl(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const urls = await this.getAllUrls();
      const index = urls.findIndex(entry => entry.id === id);

      if (index === -1) {
        return { success: false, message: 'URL not found' };
      }

      const deletedUrl = urls[index];
      urls.splice(index, 1);
      await this.saveUrls(urls);

      this.logger.log(`Deleted URL: ${deletedUrl.url}`);
      return { success: true, message: 'URL deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting URL:', error);
      return { success: false, message: `Failed to delete URL: ${error.message}` };
    }
  }

  async toggleUrl(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const urls = await this.getAllUrls();
      const index = urls.findIndex(entry => entry.id === id);

      if (index === -1) {
        return { success: false, message: 'URL not found' };
      }

      urls[index].enabled = !urls[index].enabled;
      await this.saveUrls(urls);

      const status = urls[index].enabled ? 'enabled' : 'disabled';
      this.logger.log(`URL ${status}: ${urls[index].url}`);
      return { success: true, message: `URL ${status} successfully` };
    } catch (error) {
      this.logger.error('Error toggling URL:', error);
      return { success: false, message: `Failed to toggle URL: ${error.message}` };
    }
  }

  async getEnabledUrls(): Promise<UrlEntry[]> {
    const urls = await this.getAllUrls();
    return urls.filter(entry => entry.enabled);
  }

  private async saveUrls(urls: UrlEntry[]): Promise<void> {
    try {
      // Ensure urls is always an array
      const safeUrls = Array.isArray(urls) ? urls : [];
      // Use writeJson for better error handling and consistent formatting
      await fs.writeJson(this.urlsFile, safeUrls, { spaces: 2 });
    } catch (error) {
      this.logger.error('Error saving URLs file:', error);
      throw new Error('Failed to save URLs file');
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
