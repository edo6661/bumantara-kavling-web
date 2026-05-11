import api from "../lib/axios";

export interface RolePermissionData {
  id: number;
  role: string;
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface UpsertRolePermissionDTO {
  role: string;
  resource: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export const rolePermissionService = {
  getAll: async (
    params?: Record<string, unknown>,
  ): Promise<RolePermissionData[]> => {
    const response = await api.get("/role-permissions", { params });
    return response.data.data;
  },

  upsert: async (data: UpsertRolePermissionDTO) => {
    const response = await api.post("/role-permissions/upsert", data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/role-permissions/${id}`);
    return response.data;
  },
};
