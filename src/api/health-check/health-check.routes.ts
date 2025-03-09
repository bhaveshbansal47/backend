import { Router } from 'express';
import { HealthCheckController } from "./health-check.controller";

const router: Router = Router();

router.get("/", HealthCheckController.healthCheck);

export { router as healthCheckRouter };