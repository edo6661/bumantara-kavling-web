import api from "../lib/axios";
import type { AgentData, CreateAgentDTO } from "../types/models/agent";

export interface AgentPaginatedResponse {
  items: AgentData[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const agentService = {
  getPaginated: async (
    params?: Record<string, unknown>,
  ): Promise<AgentPaginatedResponse> => {
    const response = await api.get("/agents", { params });
    return response.data.data;
  },

  /** Semua agent untuk dropdown/lookup (tanpa pagination UI). */
  getAll: async (): Promise<AgentData[]> => {
    const response = await agentService.getPaginated({ limit: 300, page: 1 });
    return response.items;
  },

  create: async (data: CreateAgentDTO) => {
    const response = await api.post("/agents", data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateAgentDTO>) => {
    const response = await api.patch(`/agents/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/agents/${id}`);
    return response.data;
  },

  uploadDoc: async (id: number, docType: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.patch(
      `/agents/${id}/upload/${docType}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },

  generateAccount: async (id: number, password: string) => {
    const response = await api.post(`/agents/${id}/generate-account`, {
      password,
    });
    return response.data;
  },
};
