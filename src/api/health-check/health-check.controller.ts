import { Request, Response } from "express";

export class HealthCheckController {
  public static async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(200).send("OK");
  }
}
