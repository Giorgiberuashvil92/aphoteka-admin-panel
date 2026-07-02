import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Prescription,
  PrescriptionDocument,
} from './schemas/prescription.schema';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<PrescriptionDocument>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async create(prescribedByUserId: string, dto: CreatePrescriptionDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('მინიმუმ ერთი წამალი უნდა აირჩიო');
    }

    const patient = await this.usersService.lookupByPersonalId(
      dto.patientPersonalId,
    );

    const lines = await Promise.all(
      dto.items.map(async (line) => {
        let productName = 'პროდუქტი';
        try {
          const p = await this.productsService.findOne(line.productId);
          productName = p.name;
        } catch {}
        return {
          productId: new Types.ObjectId(line.productId),
          productName,
          quantity: line.quantity,
          notes: line.notes,
        };
      }),
    );

    const doc = await this.prescriptionModel.create({
      patientId: new Types.ObjectId(patient.id),
      patientEmail: patient.email ?? '',
      prescribedByUserId: new Types.ObjectId(prescribedByUserId),
      items: lines,
    });

    return doc.toObject();
  }

  async findForPatient(patientUserId: string) {
    if (!Types.ObjectId.isValid(patientUserId)) {
      return [];
    }
    const rows = await this.prescriptionModel
      .find({ patientId: new Types.ObjectId(patientUserId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('prescribedByUserId', 'fullName email')
      .lean()
      .exec();
    return rows.map((doc) => {
      const created = (doc as { createdAt?: Date }).createdAt;
      const prescriber = doc.prescribedByUserId as
        | { fullName?: string; email?: string }
        | Types.ObjectId
        | null
        | undefined;
      let prescribedByName: string | undefined;
      let prescribedByEmail: string | undefined;
      if (
        prescriber &&
        typeof prescriber === 'object' &&
        'fullName' in prescriber
      ) {
        prescribedByName = prescriber.fullName?.trim() || undefined;
        prescribedByEmail = prescriber.email?.trim() || undefined;
      }
      return {
        id: String(doc._id),
        createdAt: created ? new Date(created).toISOString() : undefined,
        prescribedByName,
        prescribedByEmail,
        items: (doc.items ?? []).map((it) => ({
          productId: it.productId?.toString() ?? '',
          productName: it.productName,
          quantity: it.quantity,
          notes: it.notes,
        })),
      };
    });
  }
}
