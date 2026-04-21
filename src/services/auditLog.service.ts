import api from "../lib/axios";

export const auditLogService = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await api.get("/audit-logs", {
      params: { limit: 100, ...params },
    });
    return response.data.data.items;
  },
};
