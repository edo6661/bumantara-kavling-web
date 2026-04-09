import api from "../lib/axios";

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authService = {
  login: async (email: string, pass: string, perumahan: string) => {
    const response = await api.post<LoginResponse>("/api/auth/login", {
      email,
      password: pass,
      perumahan,
    });
    return response.data;
  },
};
