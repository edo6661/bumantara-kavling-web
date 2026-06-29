import type { KeyboardEvent } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatRupiah } from '../../utils/formatters';
import type { MonthlyMetricRow } from '../../services/dashboard.service';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from './dashboardTheme';

interface DashboardMonthlyReportCardProps {
  title: string;
  subtitle?: string;
  year?: number;
  totalPeriodLabel?: string;
  periodColumnLabel?: string;
  rows: MonthlyMetricRow[];
  showCount?: boolean;
  totalLabel?: string;
  chartColor?: string;
  onRowClick?: (row: MonthlyMetricRow) => void;
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

export default function DashboardMonthlyReportCard({
  title,
  subtitle,
  year,
  totalPeriodLabel,
  periodColumnLabel = 'Bulan',
  rows,
  showCount = false,
  totalLabel = 'Total',
  chartColor = '#2563eb',
  onRowClick,
}: DashboardMonthlyReportCardProps) {
  const totals = sumRows(rows);
  const footerPeriod = totalPeriodLabel ?? (year != null ? String(year) : '');

  const chartData = rows.map((row) => {
    const shortYear =
      row.year != null ? String(row.year).slice(-2) : undefined;
    const shortMonth = row.monthLabel.slice(0, 3);
    return {
      name: shortYear ? `${shortMonth} '${shortYear}` : shortMonth,
      fullName: row.monthLabel,
      total: row.total,
      count: row.count,
      month: row.month,
      monthLabel: row.monthLabel,
      year: row.year,
    };
  });

  const handleRowActivate = (row: MonthlyMetricRow) => {
    if (row.total > 0) onRowClick?.(row);
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    row: MonthlyMetricRow,
  ) => {
    if (!onRowClick || row.total <= 0) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowActivate(row);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Chart — 2/3 lebar di desktop */}
        <div className="lg:col-span-2 p-4 sm:p-5 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-100 min-h-[260px] lg:min-h-[340px] flex flex-col">
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium mb-3 lg:hidden">{subtitle}</p>
          )}
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={CHART_AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={52}
                />
                <YAxis
                  tick={CHART_AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
                  width={44}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ?? ''
                  }
                  formatter={(value, _name, item) => {
                    const num = Number(value ?? 0);
                    const payload = item?.payload as { count?: number } | undefined;
                    if (showCount && payload?.count !== undefined) {
                      return [
                        `${formatRupiah(num)} · ${payload.count} unit`,
                        'Total',
                      ];
                    }
                    return [formatRupiah(num), 'Total'];
                  }}
                />
                <Bar
                  dataKey="total"
                  fill={chartColor}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                  cursor={onRowClick ? 'pointer' : undefined}
                  onClick={(data) => {
                    const payload = data?.payload as MonthlyMetricRow | undefined;
                    if (payload) handleRowActivate(payload);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel — 1/3 lebar di desktop */}
        <div className="p-4 sm:p-5 flex flex-col min-h-0">
          <div className="mb-4 shrink-0">
            <h3 className="font-black text-slate-900 text-[15px] sm:text-[16px] tracking-tight leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-400 mt-1 font-medium hidden lg:block">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-x-auto lg:overflow-y-auto lg:max-h-[300px]">
            <table className="w-full min-w-[200px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                    {periodColumnLabel}
                  </th>
                  <th className="text-right py-2 pl-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                    Total
                  </th>
                  {showCount && (
                    <th className="text-right py-2 pl-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                      Jumlah
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const clickable = Boolean(onRowClick && row.total > 0);
                  return (
                  <tr
                    key={row.year != null ? `${row.year}-${row.month}` : row.month}
                    onClick={() => handleRowActivate(row)}
                    onKeyDown={(event) => handleRowKeyDown(event, row)}
                    tabIndex={clickable ? 0 : undefined}
                    role={clickable ? 'button' : undefined}
                    className={`group border-b border-slate-50 transition-colors ${
                      clickable
                        ? 'hover:bg-blue-50/80 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2 pr-2 text-[12px] font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        {row.monthLabel}
                        {clickable && (
                          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider opacity-0 group-hover:opacity-100">
                            Detail
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 pl-2 text-right text-[11px] sm:text-[12px] font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(row.total)}
                    </td>
                    {showCount && (
                      <td className="py-2 pl-2 text-right text-[11px] sm:text-[12px] font-semibold text-slate-600 whitespace-nowrap">
                        {row.count}
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-3 border-t-2 border-slate-200 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] sm:text-[12px] font-black text-slate-900 leading-snug">
                {totalLabel}{footerPeriod ? ` ${footerPeriod}` : ''}
              </span>
              <div className="text-right">
                <p className="text-[12px] sm:text-[13px] font-black text-blue-700 whitespace-nowrap">
                  {formatRupiah(totals.total)}
                </p>
                {showCount && (
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                    {totals.count} unit
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
