import { Banknote, Building2, CalendarDays, Landmark, LayoutGrid } from 'lucide-react';
import type { PenjualanBulanCaraPembayaran, PenjualanPeriodeSummary } from '../../services/dashboard.service';
import { formatPenjualanPeriodeLabel } from '../../utils/penjualanPeriode';
import KpiCard from './KpiCard';

interface DashboardMonthlySalesSectionProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  summary?: PenjualanPeriodeSummary;
  isLoadingCounts: boolean;
  onCaraClick: (cara: PenjualanBulanCaraPembayaran, label: string) => void;
}

const EMPTY_SUMMARY: PenjualanPeriodeSummary = {
  kpr: 0,
  cashBertahap: 0,
  cashKeras: 0,
  semua: 0,
};

export default function DashboardMonthlySalesSection({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  summary,
  isLoadingCounts,
  onCaraClick,
}: DashboardMonthlySalesSectionProps) {
  const counts = summary ?? EMPTY_SUMMARY;
  const periodLabel = formatPenjualanPeriodeLabel(dateFrom, dateTo);
  const periodTitle = `Penjualan ${periodLabel}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500" />

      <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
            Penjualan Bulanan
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Unit terjual per cara pembayaran berdasarkan tanggal transaksi dibuat. Klik
            kartu untuk lihat daftar customer.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-400 pb-2 sm:pb-0">
            <CalendarDays size={14} />
          </div>
          <div>
            <label
              htmlFor="dashboard-sales-date-from"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1"
            >
              Dari tanggal
            </label>
            <input
              id="dashboard-sales-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => onDateFromChange(event.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-[12px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div>
            <label
              htmlFor="dashboard-sales-date-to"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1"
            >
              Sampai tanggal
            </label>
            <input
              id="dashboard-sales-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => onDateToChange(event.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-[12px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-[11px] text-slate-500 mb-4 font-semibold">
          {periodLabel}:{' '}
          <span className="text-slate-800">
            {isLoadingCounts ? '…' : counts.semua} unit
          </span>{' '}
          terjual
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Semua"
            value={isLoadingCounts ? '…' : `${counts.semua} Unit`}
            subtitle={`Seluruh penjualan — ${periodLabel}`}
            icon={LayoutGrid}
            onClick={() => onCaraClick('SEMUA', periodTitle)}
          />
          <KpiCard
            title="KPR"
            value={isLoadingCounts ? '…' : `${counts.kpr} Unit`}
            subtitle={`Penjualan KPR — ${periodLabel}`}
            icon={Landmark}
            onClick={() => onCaraClick('KPR', periodTitle)}
          />
          <KpiCard
            title="Cash Bertahap"
            value={isLoadingCounts ? '…' : `${counts.cashBertahap} Unit`}
            subtitle={`Penjualan cash bertahap — ${periodLabel}`}
            icon={Building2}
            onClick={() => onCaraClick('CASH_BERTAHAP', periodTitle)}
          />
          <KpiCard
            title="Cash Keras"
            value={isLoadingCounts ? '…' : `${counts.cashKeras} Unit`}
            subtitle={`Penjualan cash keras — ${periodLabel}`}
            icon={Banknote}
            onClick={() => onCaraClick('CASH_KERAS', periodTitle)}
          />
        </div>
      </div>
    </div>
  );
}
