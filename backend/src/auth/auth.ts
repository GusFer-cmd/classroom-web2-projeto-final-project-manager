import { Request } from "express";
import { UserRole } from "../models/User";
import { AuthUser } from "../services/utils";

export const getAuthUser = (req: Request): AuthUser | undefined => {
  const idHeader = req.header("x-user-id");

  if (!idHeader) {
    return undefined;
  }

  const id = Number(idHeader);
  if (!Number.isFinite(id)) {
    return undefined;
  }

  const roleHeader = req.header("x-user-role");
  if (!roleHeader) {
    return { id };
  }

  const role = roleHeader.toLowerCase() as UserRole;
  if (!Object.values(UserRole).includes(role)) {
    return { id };
  }

  return { id, role };
};
