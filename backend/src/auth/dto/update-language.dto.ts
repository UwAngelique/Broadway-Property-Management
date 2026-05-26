import { IsIn } from 'class-validator';
import { USER_LANGUAGES } from '../../common/languages';

export class UpdateLanguageDto {
  @IsIn(USER_LANGUAGES)
  language: (typeof USER_LANGUAGES)[number];
}
