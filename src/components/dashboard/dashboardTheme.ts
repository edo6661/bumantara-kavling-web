/** Palet warna konsisten untuk seluruh dashboard */
export const DASHBOARD_COLORS = {
  primary: '#2563eb',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  neutral: '#64748b',
  chart: ['#2563eb', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4'],
} as const;

export const STATUS_COLORS: Record<string, string> = {
  // Kavling
  AVAILABLE: '#10b981',
  BOOKING: '#3b82f6',
  TERJUAL: '#1e293b',
  HOLD: '#f59e0b',
  // Penjualan
  BOOKED: '#d97706',
  PROSES: '#2563eb',
  LUNAS: '#059669',
  BATAL: '#94a3b8',
  // Tagihan
  BELUM_BAYAR: '#dc2626',
  MENUNGGU_KONFIRMASI: '#d97706',
};

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

export const CHART_AXIS_STYLE = {
  fontSize: 11,
  fill: '#94a3b8',
};
