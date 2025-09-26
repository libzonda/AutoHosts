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

  async getAllUrls(): Promise<UrlEntry[]> {
    try {
      if (await fs.pathExists(this.urlsFile)) {
        const data = await fs.readFile(this.urlsFile, 'utf8');
        return JSON.parse(data);
      }
      return [];
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
    await fs.writeFile(this.urlsFile, JSON.stringify(urls, null, 2));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
