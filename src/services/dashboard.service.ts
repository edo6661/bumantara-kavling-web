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
  pembayaran?: string;
  tanggalBayar?: string;
  buktiUrls?: string[];
  tanggalBooking?: string;
  tanggalBayarBookingFee?: string;
  bookingFeeLunas?: boolean;
  agentNama?: string;
  caraPembayaranLabel?: string;
}

export type DashboardDrilldownMode = "default" | "pendapatan";

export function buildPendapatanDrilldownFilter(year: number, month: number) {
  return `PENDAPATAN:${year}:${month}`;
}

export function buildAkadDrilldownFilter(year: number, month: number) {
  return `AKAD:${year}:${month}`;
}

export function buildCashDrilldownFilter(year: number, month: number) {
  return `CASH:${year}:${month}`;
}

export function buildPemesananDrilldownFilter(year: number, month: number) {
  return `PEMESANAN:${year}:${month}`;
}

export type PenjualanBulanCaraPembayaran =
  | "KPR"
  | "CASH_BERTAHAP"
  | "CASH_KERAS"
  | "SEMUA";

export function buildPenjualanBulanDrilldownFilter(
  year: number,
  month: number,
  caraPembayaran: PenjualanBulanCaraPembayaran,
) {
  return `PENJUALAN_BULAN:${year}:${month}:${caraPembayaran}`;
}

export function isPendapatanDrilldownFilter(filter?: string) {
  return filter?.startsWith("PENDAPATAN:") ?? false;
}

export function isPenjualanBulanDrilldownFilter(filter?: string) {
  return filter?.startsWith("PENJUALAN_BULAN:") ?? false;
}

export interface MonthlyMetricRow {
  month: number;
  monthLabel: string;
  total: number;
  count: number;
  year?: number;
}

export interface ExecutiveKpi {
  unitTersedia: number;
  akadBulanIni: number;
  unitBookingHariIni: number;
  unitProsesHariIni: number;
  totalUnitKpr: number;
  totalUnitCashBertahap: number;
}

export interface BookingRateRow {
  month: number;
  monthLabel: string;
  jumlahPemesanan: number;
  tingkatPersen: number;
}

export interface PenjualanByCaraTahunIni {
  kpr: MonthlyMetricRow[];
  cashBertahap: MonthlyMetricRow[];
  cashKeras: MonthlyMetricRow[];
}

export interface TodayUnitItem {
  id: string;
  customer: string;
  kavling: string;
  amount: number;
  caraPembayaran?: string;
  waktu: string;
}

export interface ExecutiveDashboard {
  year: number;
  todayDate: string;
  kpi: ExecutiveKpi;
  bookingHariIni: TodayUnitItem[];
  prosesHariIni: TodayUnitItem[];
  pendapatanTahunIni: MonthlyMetricRow[];
  pendapatanAllTime: MonthlyMetricRow[];
  akadTahunIni: MonthlyMetricRow[];
  penjualanCashTahunIni: MonthlyMetricRow[];
  penjualanByCaraTahunIni: PenjualanByCaraTahunIni;
  tingkatPemesanan: BookingRateRow[];
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
  executive: ExecutiveDashboard;
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
