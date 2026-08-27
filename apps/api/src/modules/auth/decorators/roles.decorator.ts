import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/** Marks a route as restricted to the given roles; enforced by RolesGuard. */
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
