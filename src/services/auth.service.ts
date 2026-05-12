import api from "../lib/axios";
import type { ApiResponse } from "../types/api_response";
import type { LoginData } from "../types/models/user";

export interface RegisterAgentPayload {
  nik: string;
  nama: string;
  noHp: string;
  email: string;
  password: string;
  alamat?: string;
  type?: string;
  namaBank?: string;
  noRekening?: string;
  atasNamaRekening?: string;
}

export const authService = {
  login: async (email: string, pass: string, perumahan: string) => {
    const response = await api.post<ApiResponse<LoginData>>("/auth/login", {
      email,
      password: pass,
      perumahan: perumahan,
    });
    return response.data;
  },

  loginCustomer: async (username: string, pass: string) => {
    const response = await api.post<ApiResponse<LoginData>>(
      "/auth/login/customer",
      {
        username,
        password: pass,
      },
    );
    return response.data;
  },

  loginAgent: async (email: string, pass: string) => {
    const response = await api.post<ApiResponse<LoginData>>(
      "/auth/login/agent",
      {
        email,
        password: pass,
      },
    );
    return response.data;
  },

  updateSelf: async (data: { email?: string; password?: string }) => {
    const response = await api.patch("/auth/update-me", data);
    return response.data.data;
  },
  registerAgent: async (data: RegisterAgentPayload) => {
    const response = await api.post("/auth/register/agent", data);
    return response.data;
  },
};
