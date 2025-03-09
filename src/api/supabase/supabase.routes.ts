import { Router } from "express";
import { SupabaseController } from "./supabase.controller";

const router: Router = Router();

router.get("/projects", SupabaseController.getProjects);

router.get(
  "/organisation/:organisationId/users",
  SupabaseController.getUsersByOrganisation
);

router.get("/project/:projectId/tables", SupabaseController.getTablesByProject);

router.put(
  "/project/:projectId/table/:tableName/enableRls",
  SupabaseController.enableRlsForTable
);

router.post("/ai-assistant", SupabaseController.getAiResponse);

export { router as supabaseRouter };
