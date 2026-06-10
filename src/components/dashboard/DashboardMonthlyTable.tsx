import { formatRupiah } from '../../utils/formatters';
import type { MonthlyMetricRow } from '../../services/dashboard.service';

interface DashboardMonthlyTableProps {
  title: string;
  subtitle: string;
  year: number;
  rows: MonthlyMetricRow[];
  showCount?: boolean;
  totalLabel?: string;
}

function sumRows(rows: MonthlyMetricRow[]) {
  return rows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      count: acc.count + row.count,
    }),
    { total: 0, count: 0 },
  );
}

export default function DashboardMonthlyTable({
  title,
  subtitle,
  year,
  rows,
  showCount = false,
  totalLabel = 'Total',
}: DashboardMonthlyTableProps) {
  const totals = sumRows(rows);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">{title}</h3>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                Bulan
              </th>
              <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                Total
              </th>
              {showCount && (
                <th className="text-right px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                  Jumlah
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.month}
                className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors"
              >
                <td className="px-6 py-3 text-[13px] font-semibold text-slate-800">
                  {row.monthLabel}
                </td>
                <td className="px-4 py-3 text-right text-[13px] font-black text-slate-900">
                  {formatRupiah(row.total)}
                </td>
                {showCount && (
                  <td className="px-6 py-3 text-right text-[13px] font-bold text-slate-700">
                    {row.count} unit
                  </td>
                )}
              </tr>
            ))}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td className="px-6 py-4 text-[13px] font-black text-slate-900">
                {totalLabel} {year}
              </td>
              <td className="px-4 py-4 text-right text-[14px] font-black text-blue-700">
                {formatRupiah(totals.total)}
              </td>
              {showCount && (
                <td className="px-6 py-4 text-right text-[14px] font-black text-blue-700">
                  {totals.count} unit
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
