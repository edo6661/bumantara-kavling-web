import api from "../lib/axios";

export interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password?: string;
  role: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

export const userService = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await api.get("/users", { params });
    // Backend mengembalikan { items, meta } di dalam data
    return response.data.data;
  },

  create: async (data: CreateUserDTO) => {
    const response = await api.post("/users", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateUserDTO) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
