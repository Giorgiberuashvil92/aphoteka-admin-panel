import { Module } from '@nestjs/common';
import { SenderGeService } from './sender-ge.service';

@Module({
  providers: [SenderGeService],
  exports: [SenderGeService],
})
export class SmsModule {}
