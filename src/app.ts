import { BACK_END_URL, NODE_ENV, PORT } from "@config";
import errorMiddleware from "@middlewares/error.middleware";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import database, { type PostGres } from "./databases/postgres";
import { Route } from "./interfaces";
import authMiddleware from "./middlewares/auth.middleware";
import jsonMiddleware from "./middlewares/json.middleware";

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public database: PostGres;

  constructor(routes: Route[]) {
    this.app = express();
    this.env = NODE_ENV || "development";
    this.port = PORT || 5000;
    this.database = database;

    this.dbConnect();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(PORT, () => {
      console.log(`App started listening on port ${PORT}`);
    });
  }

  public getServer() {
    return this.app;
  }

  public async dbDisconnect(): Promise<void> {
    try {
      await this.database.disconnect();
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
  }

  private async dbConnect() {
    await this.database.connect();
  }

  private initializeMiddlewares() {
    this.app.use(cors({ origin: BACK_END_URL, credentials: true, allowedHeaders: "Authorization" }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan("combined"));
    this.app.use(compression());
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(jsonMiddleware);
    this.app.use(authMiddleware);
  }

  private initializeRoutes(routes: Route[]) {
    routes.forEach(({ path, router }) => this.app.use(path, router));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;
