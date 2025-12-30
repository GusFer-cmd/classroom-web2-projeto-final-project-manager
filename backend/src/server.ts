import "reflect-metadata";
import express, { ErrorRequestHandler} from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { createRouter } from "./routes";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as any).status ?? 500;
  res.status(status).json({ message: err.message });
};

AppDataSource.initialize()
  .then(() => {
    app.use(createRouter(AppDataSource));

    app.use(errorHandler);

    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((error) => {
    console.error("Erro ao iniciar o banco:", error);
    process.exit(1);
  });
