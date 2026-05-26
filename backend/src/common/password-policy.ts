import { applyDecorators } from '@nestjs/common';
import { Matches, MinLength } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES_MESSAGE =
  'Password must be at least 8 characters and include a letter and a number';

/** Apply to new passwords (signup, reset, invited users). Login keeps legacy min length. */
export function ApplyPasswordPolicy() {
  return applyDecorators(
    MinLength(PASSWORD_MIN_LENGTH),
    Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, { message: PASSWORD_RULES_MESSAGE }),
  );
}
