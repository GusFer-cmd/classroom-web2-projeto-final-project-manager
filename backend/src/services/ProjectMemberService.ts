import { Repository } from "typeorm";
import { ProjectMember, ProjectRole } from "../models/ProjectMember";
import { User } from "../models/User";
import { Project } from "../models/Project";
import { AuthUser, NotFoundError, ForbiddenError, assertAuthenticated } from "./utils";

export type CreateProjectMemberInput = {
  userId: number;
  role?: ProjectRole;
};

export type UpdateProjectMemberInput = {
  role: ProjectRole;
};

export class ProjectMemberService {
  constructor(
    private memberRepo: Repository<ProjectMember>,
    private projectRepo: Repository<Project>,
    private userRepo: Repository<User>
  ) {}

  async listByProject(projectId: number): Promise<ProjectMember[]> {
    return this.memberRepo.find({
      where: { projectId },
      relations: { user: true },
    });
  }

  async add(projectId: number, input: CreateProjectMemberInput, currentUser?: AuthUser) {
    assertAuthenticated(currentUser);
    const project = await this.projectRepo.findOneBy({ id: projectId });
    if (!project) throw new NotFoundError("Project not found");

    if (project.ownerId !== currentUser.id) {
      throw new ForbiddenError("Only project owner can add members");
    }

    const user = await this.userRepo.findOneBy({ id: input.userId });
    if (!user) throw new NotFoundError("User not found");

    const membership = this.memberRepo.create({
      projectId,
      userId: input.userId,
      role: input.role ?? ProjectRole.Member,
    });

    return this.memberRepo.save(membership);
  }

  async update(projectId: number, userId: number, input: UpdateProjectMemberInput, currentUser?: AuthUser) {
    assertAuthenticated(currentUser);

    const membership = await this.memberRepo.findOneBy({ projectId, userId });
    if (!membership) throw new NotFoundError("Membership not found");

    const project = await this.projectRepo.findOneBy({ id: projectId });
    if (!project) throw new NotFoundError("Project not found");
    if (project.ownerId !== currentUser.id) {
      throw new ForbiddenError("Only project owner can update member role");
    }

    membership.role = input.role;
    return this.memberRepo.save(membership);
  }

  async delete(projectId: number, userId: number, currentUser?: AuthUser) {
    assertAuthenticated(currentUser);

    const membership = await this.memberRepo.findOneBy({ projectId, userId });
    if (!membership) throw new NotFoundError("Membership not found");

    const project = await this.projectRepo.findOneBy({ id: projectId });
    if (!project) throw new NotFoundError("Project not found");

    if (project.ownerId !== currentUser.id) {
      throw new ForbiddenError("Only project owner can remove member");
    }

    await this.memberRepo.delete({ projectId, userId });
  }
}
