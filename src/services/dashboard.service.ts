import api from "../lib/axios";

export interface DashboardData {
  stats: {
    totalPendapatan: number;
    kavlingTerjual: number;
    totalKavling: number;
    tagihanJatuhTempo: number;
    customerJatuhTempo: number;
    proyekAktif: number;
    rataRataProgress: number;
  };
  recentTransactions: {
    id: string;
    customer: string;
    kavling: string;
    type: string;
    amount: number;
    status: string;
    date: string;
  }[];
  progressData: any[];
  topAgents: {
    name: string;
    closing: number;
    feeStatus: string;
  }[];
  documentAlerts: {
    customer: string;
    kavling: string;
    missing: string[];
  }[];
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardData> => {
    const response = await api.get("/dashboard/summary");
    return response.data.data;
  },
};
