import { Banknote, Building2, CalendarDays, Landmark } from 'lucide-react';
import type {
  PenjualanByCaraTahunIni,
  PenjualanBulanCaraPembayaran,
} from '../../services/dashboard.service';
import KpiCard from './KpiCard';

const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

interface DashboardMonthlySalesSectionProps {
  year: number;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  penjualanByCara: PenjualanByCaraTahunIni;
  onCaraClick: (cara: PenjualanBulanCaraPembayaran, label: string) => void;
}

function getCountForMonth(
  rows: PenjualanByCaraTahunIni['kpr'],
  month: number,
): number {
  return rows.find((row) => row.month === month)?.count ?? 0;
}

export default function DashboardMonthlySalesSection({
  year,
  selectedMonth,
  onMonthChange,
  penjualanByCara,
  onCaraClick,
}: DashboardMonthlySalesSectionProps) {
  const monthLabel =
    MONTH_OPTIONS.find((option) => option.value === selectedMonth)?.label ?? '';

  const kprCount = getCountForMonth(penjualanByCara.kpr, selectedMonth);
  const cashBertahapCount = getCountForMonth(
    penjualanByCara.cashBertahap,
    selectedMonth,
  );
  const cashKerasCount = getCountForMonth(penjualanByCara.cashKeras, selectedMonth);
  const totalCount = kprCount + cashBertahapCount + cashKerasCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500" />

      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
            Penjualan Bulanan
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Unit terjual per cara pembayaran berdasarkan tanggal transaksi dibuat. Klik
            kartu untuk lihat daftar customer.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <CalendarDays size={14} className="text-slate-400" />
          <label htmlFor="dashboard-sales-month" className="sr-only">
            Pilih bulan
          </label>
          <select
            id="dashboard-sales-month"
            value={selectedMonth}
            onChange={(event) => onMonthChange(Number(event.target.value))}
            className="px-3 py-2 text-[12px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-[11px] text-slate-500 mb-4 font-semibold">
          {monthLabel} {year}:{' '}
          <span className="text-slate-800">{totalCount} unit</span> terjual
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="KPR"
            value={`${kprCount} Unit`}
            subtitle={`Penjualan KPR — ${monthLabel}`}
            icon={Landmark}
            onClick={() => onCaraClick('KPR', `Penjualan KPR ${monthLabel} ${year}`)}
          />
          <KpiCard
            title="Cash Bertahap"
            value={`${cashBertahapCount} Unit`}
            subtitle={`Penjualan cash bertahap — ${monthLabel}`}
            icon={Building2}
            onClick={() =>
              onCaraClick('CASH_BERTAHAP', `Penjualan Cash Bertahap ${monthLabel} ${year}`)
            }
          />
          <KpiCard
            title="Cash Keras"
            value={`${cashKerasCount} Unit`}
            subtitle={`Penjualan cash keras — ${monthLabel}`}
            icon={Banknote}
            onClick={() =>
              onCaraClick('CASH_KERAS', `Penjualan Cash Keras ${monthLabel} ${year}`)
            }
          />
        </div>
      </div>
    </div>
  );
}
