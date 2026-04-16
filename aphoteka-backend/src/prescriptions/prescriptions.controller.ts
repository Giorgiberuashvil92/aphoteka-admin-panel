import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

function extractUserId(user: unknown): string {
  if (!user || typeof user !== 'object') {
    return '';
  }
  const u = user as Record<string, unknown>;
  if (typeof u.id === 'string' && u.id.trim()) {
    return u.id.trim();
  }
  if (typeof u.sub === 'string' && u.sub.trim()) {
    return u.sub.trim();
  }
  const oid = u._id;
  if (oid != null) {
    if (typeof oid === 'string' && oid.trim()) {
      return oid.trim();
    }
    if (
      typeof oid === 'object' &&
      oid !== null &&
      typeof (oid as { toString?: () => string }).toString === 'function'
    ) {
      return String((oid as { toString: () => string }).toString()).trim();
    }
  }
  return '';
}

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  my(@Request() req: { user?: unknown }) {
    const uid = extractUserId(req.user);
    if (!uid) {
      throw new UnauthorizedException();
    }
    return this.prescriptionsService.findForPatient(uid);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreatePrescriptionDto,
    @Request() req: { user?: unknown },
  ) {
    const uid = extractUserId(req.user);
    if (!uid) {
      throw new UnauthorizedException();
    }
    return this.prescriptionsService.create(uid, dto);
  }
}
