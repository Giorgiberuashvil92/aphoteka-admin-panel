import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SenderGeService } from './sms/sender-ge.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly senderGe: SenderGeService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** დიაგნოსტიკა — TestFlight/პროდზე SMS ჩართულია თუ არა (API key არ ბრუნდება) */
  @Get('health')
  getHealth() {
    return {
      ok: true,
      smsConfigured: this.senderGe.isConfigured(),
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }
}
