import api from "../lib/axios";

export type DashboardKpiPeriod = "month" | "quarter" | "year";
export type DashboardDrilldownCategory = "kavling" | "penjualan" | "tagihan" | "progress";

export interface DashboardFilters {
  trendMonths: number;
  kpiPeriod: DashboardKpiPeriod;
  kpiPeriodLabel: string;
  comparisonLabel: string;
}

export interface DashboardQueryParams {
  months?: number;
  period?: DashboardKpiPeriod;
}

export interface KavlingRekeningBreakdown {
  rekeningId: number;
  label: string;
  atasNama: string;
  total: number;
  terjual: number;
}

export interface KpiComparison {
  current: number;
  previous: number;
  changePercent: number | null;
  trend: "up" | "down" | "flat";
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface CollectionTrendPoint {
  label: string;
  terkumpul: number;
  menungguKonfirmasi: number;
}

export interface StatusBreakdown {
  status: string;
  label: string;
  count: number;
  nominal?: number;
}

export interface ProgressRangeBreakdown {
  range: string;
  count: number;
}

export interface BlokHeatmapItem {
  blok: string;
  total: number;
  terjual: number;
  available: number;
  booking: number;
  hold: number;
  soldPercent: number;
}

export interface KpiAlert {
  type: "revenue_decline" | "sales_decline";
  message: string;
  severity: "warning" | "critical";
  actionHint: string;
}

export interface DrilldownItem {
  id: string;
  label: string;
  sublabel?: string;
  value?: string;
  status?: string;
}

export interface DashboardData {
  stats: {
    totalPendapatan: number;
    kavlingTerjual: number;
    totalKavling: number;
    kavlingByRekening: KavlingRekeningBreakdown[];
    tagihanJatuhTempo: number;
    customerJatuhTempo: number;
    proyekAktif: number;
    rataRataProgress: number;
    pendapatanBulanIni: number;
    pendapatanBulanLalu: number;
    penjualanBulanIni: number;
    penjualanBulanLalu: number;
    tagihanMenungguKonfirmasi: number;
    tagihanMenungguKonfirmasiNominal: number;
    kpiComparison: {
      pendapatan: KpiComparison;
      penjualan: KpiComparison;
    };
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
  progressData: {
    kavling: string;
    customer: string;
    progress: number;
    tahap: string;
    isLate: boolean;
  }[];
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
  revenueTrend: TrendPoint[];
  salesTrend: TrendPoint[];
  collectionTrend: CollectionTrendPoint[];
  kavlingByStatus: StatusBreakdown[];
  penjualanByStatus: StatusBreakdown[];
  tagihanByStatus: StatusBreakdown[];
  progressBreakdown: ProgressRangeBreakdown[];
  blokHeatmap: BlokHeatmapItem[];
  kpiAlerts: KpiAlert[];
  filters: DashboardFilters;
}

export const dashboardService = {
  getSummary: async (params: DashboardQueryParams = {}): Promise<DashboardData> => {
    const response = await api.get("/dashboard/summary", { params });
    return response.data.data;
  },

  getDrilldown: async (
    category: DashboardDrilldownCategory,
    filter?: string,
    blok?: string,
  ): Promise<DrilldownItem[]> => {
    const response = await api.get("/dashboard/drilldown", {
      params: { category, filter, blok },
    });
    return response.data.data;
  },
};
