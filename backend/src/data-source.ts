import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./models/User";
import { Project } from "./models/Project";
import { Sprint } from "./models/Sprint";
import { Task } from "./models/Task";
import { Comment } from "./models/Comment";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  entities: [User, Project, Sprint, Task, Comment],
  synchronize: true,
});
