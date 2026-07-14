import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeCategoryCardDto } from './create-home-category-card.dto';

export class UpdateHomeCategoryCardDto extends PartialType(
  CreateHomeCategoryCardDto,
) {}
