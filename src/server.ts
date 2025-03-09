import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./api-docs/swagger.json";
import logger from "./config/logger";
import dotenv from "dotenv";
import router from "./api/routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "supabase-token"],
    credentials: true,
  })
);

app.options("*", cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api", router);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error(err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
);

app.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;
