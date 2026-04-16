import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';

export const ROLES_KEY = 'roles';

/** მაგ. `@Roles(UserRole.ADMIN)` — `RolesGuard`-თან ერთად */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
