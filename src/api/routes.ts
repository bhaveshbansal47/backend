import express from "express";
import { supabaseRouter } from "./supabase/supabase.routes";
import { healthCheckRouter } from "./health-check/health-check.routes";

const router = express.Router();

router.use("/supabase", supabaseRouter);
router.use("/", healthCheckRouter);

export default router;
