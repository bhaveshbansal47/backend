import { Request, Response } from "express";
import { SupabaseService } from "./supabase.service";
import Logger from "../../config/logger";
import { HttpStatus } from "../../common/http-status.enum";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class SupabaseController {
  private static readonly logger = Logger;
  private static readonly MISSING_TOKEN_MESSAGE = "Supabase token is required";

  public static getProjects = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    await SupabaseController.handleRequest(
      req,
      res,
      SupabaseService.fetchProjects
    );
  };

  public static getUsersByOrganisation = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { organisationId } = req.params;
    await SupabaseController.handleRequest(
      req,
      res,
      SupabaseService.fetchUsersByOrganisation,
      [organisationId]
    );
  };

  public static getTablesByProject = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { projectId } = req.params;
    await SupabaseController.handleRequest(
      req,
      res,
      SupabaseService.fetchTablesByProject,
      [projectId]
    );
  };

  public static enableRlsForTable = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { projectId, tableName } = req.params;
    await SupabaseController.handleRequest(
      req,
      res,
      SupabaseService.enableRlsForTable,
      [projectId, tableName]
    );
  }

  public static getAiResponse = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { message } = req.body;
    const response = await SupabaseService.fetchAiResponse(message);
    res.json(response);
  };

  private static validateToken = async (req: Request): Promise<string> => {
    const token = req.headers["supabase-token"] as string;
    if (!token) {
      throw new Error(SupabaseController.MISSING_TOKEN_MESSAGE);
    }
    return token;
  };

  private static handleRequest = async <T>(
    req: Request,
    res: Response,
    serviceMethod: (token: string, ...args: any[]) => Promise<T>,
    params: any[] = []
  ): Promise<void> => {
    try {
      const token = await SupabaseController.validateToken(req);
      const data = await serviceMethod(token, ...params);

      const response: ApiResponse<T> = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process request";
      SupabaseController.logger.error(`Error: ${errorMessage}`);

      const response: ApiResponse<null> = {
        success: false,
        message: errorMessage,
      };

      const statusCode =
        error instanceof Error &&
        error.message === SupabaseController.MISSING_TOKEN_MESSAGE
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json(response);
    }
  };
}
