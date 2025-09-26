import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UrlService, UrlEntry } from './url.service';

@Controller('api/urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Get()
  async getAllUrls(): Promise<UrlEntry[]> {
    return this.urlService.getAllUrls();
  }

  @Post()
  async addUrl(@Body() body: { url: string; name?: string }) {
    return this.urlService.addUrl(body.url, body.name);
  }

  @Put(':id')
  async updateUrl(@Param('id') id: string, @Body() updates: Partial<UrlEntry>) {
    return this.urlService.updateUrl(id, updates);
  }

  @Delete(':id')
  async deleteUrl(@Param('id') id: string) {
    return this.urlService.deleteUrl(id);
  }

  @Post(':id/toggle')
  async toggleUrl(@Param('id') id: string) {
    return this.urlService.toggleUrl(id);
  }
}
