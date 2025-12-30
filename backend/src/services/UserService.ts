import { Repository } from "typeorm";
import { User, UserRole } from "../models/User";
import {
  AuthUser,
  ForbiddenError,
  NotFoundError,
  assertAdmin,
  assertAuthenticated,
  isAdmin,
} from "./utils";

export type CreateUserInput = {
  name: string;
  email: string;
  role?: UserRole;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  role?: UserRole;
};

export class UserService {
  constructor(private userRepo: Repository<User>) {}

  async register(input: CreateUserInput): Promise<User> {
    const user = this.userRepo.create({
      name: input.name,
      email: input.email,
      role: UserRole.Member,
    });

    return this.userRepo.save(user);
  }

  async createUser(input: CreateUserInput, currentUser?: AuthUser): Promise<User> {
    assertAuthenticated(currentUser);
    assertAdmin(currentUser);

    const user = this.userRepo.create({
      name: input.name,
      email: input.email,
      role: input.role ?? UserRole.Member,
    });

    return this.userRepo.save(user);
  }

  async listAll(currentUser?: AuthUser): Promise<User[]> {
    assertAuthenticated(currentUser);
    assertAdmin(currentUser);

    return this.userRepo.find();
  }

  async getById(id: number, currentUser?: AuthUser): Promise<User> {
    assertAuthenticated(currentUser);

    if (!isAdmin(currentUser) && currentUser.id !== id) {
      throw new ForbiddenError("You can only view your own user");
    }

    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  async updateUser(
    id: number,
    input: UpdateUserInput,
    currentUser?: AuthUser
  ): Promise<User> {
    assertAuthenticated(currentUser);

    if (!isAdmin(currentUser) && currentUser.id !== id) {
      throw new ForbiddenError("You can only update your own user");
    }

    if (input.role && !isAdmin(currentUser)) {
      throw new ForbiddenError("Only admin can change roles");
    }

    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    Object.assign(user, input);
    return this.userRepo.save(user);
  }

  async deleteUser(id: number, currentUser?: AuthUser): Promise<void> {
    assertAuthenticated(currentUser);
    assertAdmin(currentUser);

    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await this.userRepo.remove(user);
  }
}
