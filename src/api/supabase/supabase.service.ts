import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import logger from "../../config/logger";

interface SupabaseRequestParams {
  url: string;
  token: string;
  data?: unknown;
}

interface Project {
  id: string;
  organization_id: string;
  name: string;
  region: string;
  status: string;
  database: {
    host: string;
    version: string;
    postgres_engine: string;
    release_channel: string;
  };
  created_at: string;
}

interface User {
  user_id: string;
  user_name: string;
  email: string;
  role_name: string;
  mfa_enabled: boolean;
}

interface Table {
  schema_name: string;
  table_name: string;
  rls_enabled: boolean;
  rls_forced: boolean;
}

interface Backup {
  region: string;
  pitr_enabled: boolean;
  walg_enabled: boolean;
  backups: any[];
  physical_backup_data: Record<string, unknown>;
}

export class SupabaseService {
  private static readonly SUPABASE_API_URL = "https://api.supabase.com/v1";
  private static readonly GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  public static fetchProjects = async (
    token: string
  ): Promise<
    {
      id: string;
      name: string;
      organizationId: string;
      pitrEnabled: boolean;
    }[]
  > => {
    const projects: Project[] = await SupabaseService.makeRequest({
      method: "get",
      url: "/projects",
      token,
    });
    const backups: Backup[] = await Promise.all(
      projects.map(async (project) => {
        return SupabaseService.makeRequest({
          method: "get",
          url: `/projects/${project.id}/database/backups`,
          token,
        });
      })
    );
    return projects.map(({ id, name, organization_id }, index) => ({
      id,
      name,
      organizationId: organization_id,
      pitrEnabled: backups[index].pitr_enabled,
    }));
  };

  public static fetchUsersByOrganisation = async (
    token: string,
    organisationSlug: string
  ): Promise<
    {
      username: string;
      email: string;
      mfaEnabled: boolean;
    }[]
  > => {
    const users: User[] = await SupabaseService.makeRequest({
      method: "get",
      url: `/organizations/${organisationSlug}/members`,
      token,
    });
    return users.map((user) => ({
      username: user.user_name,
      email: user.email,
      mfaEnabled: user.mfa_enabled,
    }));
  };

  public static fetchTablesByProject = async (
    token: string,
    projectId: string
  ): Promise<
    {
      projectId: string;
      name: string;
      rlsEnabled: boolean;
    }[]
  > => {
    const query = `
            SELECT 
                n.nspname AS schema_name,
                c.relname AS table_name,
                c.relrowsecurity AS rls_enabled,
                c.relforcerowsecurity AS rls_forced
            FROM pg_catalog.pg_class c
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'r' AND n.nspname = 'public'
            ORDER BY n.nspname, c.relname;
        `;

    const tables: Table[] = await SupabaseService.makeRequest({
      method: "post",
      url: `/projects/${projectId}/database/query`,
      token,
      data: { query },
    });
    return tables.map((table) => ({
      projectId,
      name: table.table_name,
      rlsEnabled: table.rls_enabled,
    }));
  };

  public static enableRlsForTable = async (
    token: string,
    projectId: string,
    tableName: string
  ): Promise<void> => {
    const query = `
            ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;
        `;
    await SupabaseService.makeRequest({
      method: "post",
      url: `/projects/${projectId}/database/query`,
      token,
      data: { query },
    });
  };

  public static fetchAiResponse = async (
    message: string
  ): Promise<{ message: string }> => {
    try {
      const response = await axios.post(SupabaseService.GEMINI_API_URL, {
        systemInstruction: {
          parts: [
            {
              text: "You are an expert of supabase who helps only with the queries regarding the supabase. No coding answers, always tell answers doable from dashboard. Keep your answers very short and to the point. Never leave answers open ended always help with complete answers.",
            },
          ],
        },
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      });
      logger.info("Successful POST request to GEMINI API");
      return { message: response.data.candidates[0].content.parts[0].text };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error making request to GEMINI API: ${errorMessage}`);
      return {
        message:
          "Unable to process your request at the moment. Please try again later.",
      };
    }
  };

  private static makeRequest = async <T>({
    method,
    url,
    token,
    data,
  }: SupabaseRequestParams & { method: "get" | "post" }): Promise<T> => {
    const config: AxiosRequestConfig = {
      method,
      url: `${SupabaseService.SUPABASE_API_URL}${url}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data,
    };

    try {
      const response: AxiosResponse<T> = await axios(config);
      logger.info(`Successful ${method.toUpperCase()} request to ${url}`);
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error making request to ${url}: ${errorMessage}`);
      throw new Error(`Failed to make request to ${url}`);
    }
  };
}

export default SupabaseService;
