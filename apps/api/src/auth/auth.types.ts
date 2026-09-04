import type { UserRole } from '@studioemar/shared';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  typ: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  typ: 'refresh';
};
