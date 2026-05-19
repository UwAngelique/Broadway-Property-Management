import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUserPayload } from './types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUserPayload | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    return request.user;
  },
);
