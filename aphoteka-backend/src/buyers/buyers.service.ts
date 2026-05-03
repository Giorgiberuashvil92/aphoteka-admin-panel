import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Buyer, BuyerDocument } from './schemas/buyer.schema';

export type CreateBuyerForUserInput = {
  kind: 'individual' | 'legal';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  personalId?: string;
  companyName?: string;
  legalId?: string;
  /** ფაქტიური მისამართი (ფ/პ) ან იურიდიული მისამართი (იურ. პირი) */
  address?: string;
  representative?: string;
  /** Balance.ge Exchange მყიდველის `uid` (POST დამატება_მყიდველები) */
  balanceBuyerUid?: string;
  /** Sale `ReceivablesAccount` — Balance მყიდველის ანგარიში (კატალოგიდან სინქი) */
  balanceReceivablesAccount?: string;
};

@Injectable()
export class BuyersService {
  constructor(
    @InjectModel(Buyer.name) private buyerModel: Model<BuyerDocument>,
  ) {}

  /**
   * ახალი consumer მომხმარებლისთვის მყიდველის ჩანაწერი (ერთი userId → ერთი Buyer).
   */
  async createForConsumerUser(
    userId: Types.ObjectId,
    data: CreateBuyerForUserInput,
  ): Promise<BuyerDocument> {
    const existing = await this.buyerModel.findOne({ userId }).exec();
    if (existing) {
      return existing;
    }
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const base = {
      userId,
      firstName,
      lastName,
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || undefined,
      fullName,
      kind: data.kind,
      ...(data.balanceBuyerUid?.trim()
        ? { balanceBuyerUid: data.balanceBuyerUid.trim() }
        : {}),
      ...(data.balanceReceivablesAccount?.trim()
        ? { balanceReceivablesAccount: data.balanceReceivablesAccount.trim() }
        : {}),
    };
    if (data.kind === 'individual') {
      return this.buyerModel.create({
        ...base,
        personalId: data.personalId?.trim(),
        ...(data.address?.trim() ? { address: data.address.trim() } : {}),
      });
    }
    return this.buyerModel.create({
      ...base,
      companyName: data.companyName?.trim(),
      legalId: data.legalId?.trim(),
      address: data.address?.trim(),
      representative: data.representative?.trim(),
    });
  }

  async findByUserId(userId: Types.ObjectId): Promise<BuyerDocument | null> {
    return this.buyerModel.findOne({ userId }).exec();
  }
}
