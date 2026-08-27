import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

/** The authenticated staff user, as attached to the request by JwtStrategy. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request: { user: AuthenticatedUser } = ctx
      .switchToHttp()
      .getRequest();
    return request.user;
  },
);
