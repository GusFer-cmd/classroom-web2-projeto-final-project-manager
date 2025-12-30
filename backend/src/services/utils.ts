import { UserRole } from "../models/User";

export type AuthUser = {
  id: number;
  role: UserRole;
};

export class ForbiddenError extends Error {
  status = 403;

  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  status = 404;

  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export const isAdmin = (user: AuthUser) => user.role === UserRole.Admin;
export const isManager = (user: AuthUser) => user.role === UserRole.Manager;
export const isMember = (user: AuthUser) => user.role === UserRole.Member;

export function assertAuthenticated(
  user?: AuthUser | null
): asserts user is AuthUser {
  if (!user) {
    throw new ForbiddenError("Authentication required");
  }
}

export const assertAdmin = (user: AuthUser) => {
  if (!isAdmin(user)) {
    throw new ForbiddenError("Admin access required");
  }
};

export const assertManagerOrAdmin = (user: AuthUser) => {
  if (!isAdmin(user) && !isManager(user)) {
    throw new ForbiddenError("Manager or admin access required");
  }
};
