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

    const patient = await this.usersService.lookupByEmail(dto.patientEmail);

    const lines = await Promise.all(
      dto.items.map(async (line) => {
        let productName = 'პროდუქტი';
        try {
          const p = await this.productsService.findOne(line.productId);
          productName = p.name;
        } catch {
          /* პროდუქტი არ მოიძებნა — ID მაინც ვინახავთ */
        }
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
      patientEmail: patient.email ?? dto.patientEmail.trim().toLowerCase(),
      prescribedByUserId: new Types.ObjectId(prescribedByUserId),
      items: lines,
    });

    return doc.toObject();
  }
}
