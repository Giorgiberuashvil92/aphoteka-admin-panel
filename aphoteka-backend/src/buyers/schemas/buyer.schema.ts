import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BuyerDocument = HydratedDocument<Buyer>;

/**
 * მყიდველის პროფილი — იქმნება მობილური რეგისტრაციისას (consumer),
 * რათა შეკვეთებში/ზედნადებში იყოს ერთიანი „მყიდველის ინფო“ და საჭიროებისამებრ Balance-თან სინქი.
 */
@Schema({ timestamps: true })
export class Buyer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  /** E.164 თუ რეგისტრაციაზე მიუთითეს */
  @Prop()
  phone?: string;

  @Prop()
  fullName?: string;

  @Prop({ type: String, enum: ['individual', 'legal'], default: 'individual' })
  kind?: 'individual' | 'legal';

  /** ფიზიკური პირი — პირადი ნომერი (11 ციფრი) */
  @Prop()
  personalId?: string;

  /** იურიდიული პირი */
  @Prop()
  companyName?: string;

  @Prop()
  legalId?: string;

  @Prop()
  address?: string;

  @Prop()
  representative?: string;

  /** მომავალი: Balance მყიდველის ref (POST დამატება_მყიდველები) */
  @Prop()
  balanceBuyerUid?: string;

  /**
   * Balance Clients / კატალოგიდან — მყიდველზე მიბმული **დებიტორული** ანგარიში (Sale `ReceivablesAccount`).
   * ცარიელია → ინლაინის `receivablesAccount` (კომპანიის ნაგულისხმევი).
   */
  @Prop()
  balanceReceivablesAccount?: string;
}

export const BuyerSchema = SchemaFactory.createForClass(Buyer);

const transformId = (doc: any, ret: any) => {
  ret.id = ret._id?.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

BuyerSchema.set('toJSON', { transform: transformId });
BuyerSchema.set('toObject', { transform: transformId });
