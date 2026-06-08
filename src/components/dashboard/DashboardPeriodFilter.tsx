import type { DashboardKpiPeriod } from '../../services/dashboard.service';

interface DashboardPeriodFilterProps {
  kpiPeriod: DashboardKpiPeriod;
  trendMonths: number;
  onKpiPeriodChange: (period: DashboardKpiPeriod) => void;
  onTrendMonthsChange: (months: number) => void;
}

const KPI_PERIODS: { value: DashboardKpiPeriod; label: string }[] = [
  { value: 'month', label: 'Bulan' },
  { value: 'quarter', label: 'Kuartal' },
  { value: 'year', label: 'Tahun' },
];

const TREND_MONTHS = [3, 6, 12];

export default function DashboardPeriodFilter({
  kpiPeriod,
  trendMonths,
  onKpiPeriodChange,
  onTrendMonthsChange,
}: DashboardPeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* KPI period toggle */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm shadow-slate-100/80 gap-0.5">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] px-2 select-none">
          KPI
        </span>
        {KPI_PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => onKpiPeriodChange(p.value)}
            className={`px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
              kpiPeriod === p.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Trend months toggle */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm shadow-slate-100/80 gap-0.5">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] px-2 select-none">
          Tren
        </span>
        {TREND_MONTHS.map((m) => (
          <button
            key={m}
            onClick={() => onTrendMonthsChange(m)}
            className={`px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
              trendMonths === m
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {m} bln
          </button>
        ))}
      </div>
    </div>
  );
}