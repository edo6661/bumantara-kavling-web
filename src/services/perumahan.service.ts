import api from "../lib/axios";
import type { Perumahan } from "../types/models/perumahan";

export const perumahanService = {
  getAll: async (): Promise<Perumahan[]> => {
    const response = await api.get("/perumahan?limit=100");
    return response.data.data.items;
  },
};
