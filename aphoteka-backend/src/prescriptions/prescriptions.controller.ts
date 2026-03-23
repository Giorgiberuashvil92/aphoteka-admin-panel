import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePrescriptionDto, @Request() req: any) {
    const uid = req.user?.id ?? req.user?._id?.toString?.() ?? req.user?.sub;
    if (!uid) {
      throw new BadRequestException('Unauthorized');
    }
    return this.prescriptionsService.create(uid, dto);
  }
}
