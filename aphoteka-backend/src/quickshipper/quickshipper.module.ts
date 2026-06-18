import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuickshipperService } from './quickshipper.service';
import { QuickshipperController } from './quickshipper.controller';

@Module({
  imports: [ConfigModule],
  controllers: [QuickshipperController],
  providers: [QuickshipperService],
  exports: [QuickshipperService],
})
export class QuickshipperModule {}
