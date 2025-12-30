import { Repository } from "typeorm";
import { Project } from "../models/Project";
import { User } from "../models/User";
import {
  AuthUser,
  ForbiddenError,
  NotFoundError,
  assertAuthenticated,
  assertManagerOrAdmin,
  isAdmin,
} from "./utils";

export type CreateProjectInput = {
  name: string;
  description?: string | null;
  isPublic?: boolean;
  ownerId?: number;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
  ownerId?: number;
};

export class ProjectService {
  constructor(
    private projectRepo: Repository<Project>,
    private userRepo: Repository<User>
  ) {}

  async listPublicProjects(): Promise<Project[]> {
    return this.projectRepo.find({ where: { isPublic: true } });
  }

  async listAccessibleProjects(currentUser?: AuthUser): Promise<Project[]> {
    if (!currentUser) {
      return this.listPublicProjects();
    }

    if (isAdmin(currentUser)) {
      return this.projectRepo.find();
    }

    return this.projectRepo.find({
      where: [{ isPublic: true }, { ownerId: currentUser.id }],
    });
  }

  async getById(id: number, currentUser?: AuthUser): Promise<Project> {
    const project = await this.projectRepo.findOneBy({ id });
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (project.isPublic) {
      return project;
    }

    if (!currentUser) {
      throw new ForbiddenError("Authentication required");
    }

    if (!isAdmin(currentUser) && project.ownerId !== currentUser.id) {
      throw new ForbiddenError("You do not have access to this project");
    }

    return project;
  }

  async createProject(
    input: CreateProjectInput,
    currentUser?: AuthUser
  ): Promise<Project> {
    assertAuthenticated(currentUser);
    assertManagerOrAdmin(currentUser);

    let ownerId = currentUser.id;
    if (input.ownerId !== undefined) {
      if (!isAdmin(currentUser)) {
        throw new ForbiddenError("Only admin can set project owner");
      }
      ownerId = input.ownerId;
    }

    const owner = await this.userRepo.findOneBy({ id: ownerId });
    if (!owner) {
      throw new NotFoundError("Owner user not found");
    }

    const project = this.projectRepo.create({
      name: input.name,
      description: input.description ?? null,
      isPublic: input.isPublic ?? false,
      owner,
      ownerId: owner.id,
    });

    return this.projectRepo.save(project);
  }

  async updateProject(
    id: number,
    input: UpdateProjectInput,
    currentUser?: AuthUser
  ): Promise<Project> {
    assertAuthenticated(currentUser);
    assertManagerOrAdmin(currentUser);

    const project = await this.projectRepo.findOneBy({ id });
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (!isAdmin(currentUser) && project.ownerId !== currentUser.id) {
      throw new ForbiddenError("Only project owner can update this project");
    }

    if (input.ownerId !== undefined) {
      if (!isAdmin(currentUser)) {
        throw new ForbiddenError("Only admin can change project owner");
      }

      const newOwner = await this.userRepo.findOneBy({ id: input.ownerId });
      if (!newOwner) {
        throw new NotFoundError("Owner user not found");
      }
      project.ownerId = newOwner.id;
      project.owner = newOwner;
    }

    if (input.name !== undefined) project.name = input.name;
    if (input.description !== undefined) project.description = input.description;
    if (input.isPublic !== undefined) project.isPublic = input.isPublic;

    return this.projectRepo.save(project);
  }

  async deleteProject(id: number, currentUser?: AuthUser): Promise<void> {
    assertAuthenticated(currentUser);
    assertManagerOrAdmin(currentUser);

    const project = await this.projectRepo.findOneBy({ id });
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (!isAdmin(currentUser) && project.ownerId !== currentUser.id) {
      throw new ForbiddenError("Only project owner can delete this project");
    }

    await this.projectRepo.remove(project);
  }
}
