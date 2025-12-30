import { Repository } from "typeorm";
import { Sprint } from "../models/Sprint";
import { Project } from "../models/Project";
import {
  AuthUser,
  ForbiddenError,
  NotFoundError,
  assertAuthenticated,
  assertManagerOrAdmin,
  isAdmin,
} from "./utils";

export type CreateSprintInput = {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  projectId: number;
};

export type UpdateSprintInput = {
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
};

export class SprintService {
  constructor(
    private sprintRepo: Repository<Sprint>,
    private projectRepo: Repository<Project>
  ) {}

  private async assertCanManageProject(
    projectId: number,
    currentUser: AuthUser
  ): Promise<Project> {
    const project = await this.projectRepo.findOneBy({ id: projectId });
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (!isAdmin(currentUser) && project.ownerId !== currentUser.id) {
      throw new ForbiddenError("Only project owner can manage sprints");
    }

    return project;
  }

  private async assertCanViewProject(
    projectId: number,
    currentUser?: AuthUser
  ): Promise<Project> {
    const project = await this.projectRepo.findOneBy({ id: projectId });
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

  async listByProject(
    projectId: number,
    currentUser?: AuthUser
  ): Promise<Sprint[]> {
    await this.assertCanViewProject(projectId, currentUser);

    return this.sprintRepo.find({ where: { projectId } });
  }

  async getById(id: number, currentUser?: AuthUser): Promise<Sprint> {
    const sprint = await this.sprintRepo.findOneBy({ id });
    if (!sprint) {
      throw new NotFoundError("Sprint not found");
    }

    await this.assertCanViewProject(sprint.projectId, currentUser);
    return sprint;
  }

  async createSprint(
    input: CreateSprintInput,
    currentUser?: AuthUser
  ): Promise<Sprint> {
    assertAuthenticated(currentUser);
    assertManagerOrAdmin(currentUser);

    const project = await this.assertCanManageProject(input.projectId, currentUser);

    const sprint = this.sprintRepo.create({
      name: input.name,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      project,
      projectId: project.id,
    });

    return this.sprintRepo.save(sprint);
  }

  async updateSprint(
    id: number,
    input: UpdateSprintInput,
    currentUser?: AuthUser
  ): Promise<Sprint> {
    assertAuthenticated(currentUser);
    assertManagerOrAdmin(currentUser);

    const sprint = await this.sprintRepo.findOneBy({ id });
    if (!sprint) {
      throw new NotFoundError("Sprint not found");
    }

    await this.assertCanManageProject(sprint.projectId, currentUser);

    if (input.name !== undefined) sprint.name = input.name;
    if (input.startDate !== undefined) sprint.startDate = input.startDate;
    if (input.endDate !== undefined) sprint.endDate = input.endDate;

    return this.sprintRepo.save(sprint);
  }

  async deleteSprint(id: number, currentUser?: AuthUser): Promise<void> {
    assertAuthenticated(currentUser);
    assertManagerOrAdmin(currentUser);

    const sprint = await this.sprintRepo.findOneBy({ id });
    if (!sprint) {
      throw new NotFoundError("Sprint not found");
    }

    await this.assertCanManageProject(sprint.projectId, currentUser);
    await this.sprintRepo.remove(sprint);
  }
}
