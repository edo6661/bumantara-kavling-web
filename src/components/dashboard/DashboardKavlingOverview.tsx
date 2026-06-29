import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CheckCircle2, Home, Layers, MapPin } from 'lucide-react';
import type { BlokHeatmapItem, StatusBreakdown } from '../../services/dashboard.service';
import {
  CHART_TOOLTIP_STYLE,
  DASHBOARD_COLORS,
  STATUS_COLORS,
} from './dashboardTheme';
import BlokHeatmap from './BlokHeatmap';

interface DashboardKavlingOverviewProps {
  total: number;
  tersedia: number;
  terProses: number;
  terjual: number;
  kavlingByStatus: StatusBreakdown[];
  blokHeatmap?: BlokHeatmapItem[];
  onStatusClick?: (status: string, label: string) => void;
  onBlokClick?: (blok: string) => void;
  onViewAll?: () => void;
}

function StatTile({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: typeof Home;
  accent: 'slate' | 'blue' | 'emerald' | 'dark';
  onClick?: () => void;
}) {
  const accents = {
    slate: {
      border: 'hover:border-slate-300',
      iconBg: 'bg-slate-100',
      icon: 'text-slate-700',
      value: 'text-slate-900',
      label: 'text-slate-500',
    },
    blue: {
      border: 'hover:border-blue-300',
      iconBg: 'bg-blue-50',
      icon: 'text-blue-600',
      value: 'text-blue-700',
      label: 'text-blue-500',
    },
    emerald: {
      border: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      value: 'text-emerald-700',
      label: 'text-emerald-500',
    },
    dark: {
      border: 'hover:border-slate-400',
      iconBg: 'bg-slate-800',
      icon: 'text-white',
      value: 'text-slate-900',
      label: 'text-slate-500',
    },
  }[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group ${accents.border} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${accents.iconBg} group-hover:scale-105 transition-transform`}>
          <Icon size={18} className={accents.icon} />
        </div>
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Unit</span>
      </div>
      <div>
        <p className={`text-3xl font-black tabular-nums tracking-tight ${accents.value}`}>{value}</p>
        <p className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${accents.label}`}>{label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
      </div>
    </button>
  );
}

export default function DashboardKavlingOverview({
  total,
  tersedia,
  terProses,
  terjual,
  kavlingByStatus,
  blokHeatmap = [],
  onStatusClick,
  onBlokClick,
  onViewAll,
}: DashboardKavlingOverviewProps) {
  const chartData = kavlingByStatus.filter((item) => item.count > 0);
  const tersediaPct = total > 0 ? Math.round((tersedia / total) * 100) : 0;
  const prosesPct = total > 0 ? Math.round((terProses / total) * 100) : 0;
  const terjualPct = total > 0 ? Math.round((terjual / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <MapPin size={17} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">Ringkasan Kavling</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Komposisi stok unit perumahan — klik kartu atau chart untuk detail
              </p>
            </div>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors self-start sm:self-auto"
            >
              Kelola Kavling →
            </button>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            <StatTile
              label="Total Kavling"
              value={total}
              subtitle="Seluruh unit terdaftar"
              icon={MapPin}
              accent="slate"
              onClick={onViewAll}
            />
            <StatTile
              label="Ter Proses"
              value={terProses}
              subtitle="Status booking — dalam pipeline penjualan"
              icon={Layers}
              accent="blue"
              onClick={() => onStatusClick?.('BOOKING', 'Booking')}
            />
            <StatTile
              label="Tersedia"
              value={tersedia}
              subtitle={`${tersediaPct}% dari total stok`}
              icon={Home}
              accent="emerald"
              onClick={() => onStatusClick?.('AVAILABLE', 'Tersedia')}
            />
            <StatTile
              label="Terjual"
              value={terjual}
              subtitle={`${terjualPct}% sudah terjual`}
              icon={CheckCircle2}
              accent="dark"
              onClick={() => onStatusClick?.('TERJUAL', 'Terjual')}
            />
          </div>

          <div className="xl:col-span-3 flex flex-col min-h-[280px]">
            <div className="flex-1 min-h-[240px] relative">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={2}
                      className="cursor-pointer outline-none"
                      onClick={(entry) => {
                        const item = (entry as { payload?: StatusBreakdown }).payload ?? entry;
                        const row = item as StatusBreakdown;
                        if (row.status) onStatusClick?.(row.status, row.label);
                      }}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? DASHBOARD_COLORS.neutral}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      formatter={(value, name) => [`${value} unit`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                  Belum ada data kavling
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tersedia</p>
                <p className="text-sm font-black text-emerald-600">{tersediaPct}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proses</p>
                <p className="text-sm font-black text-blue-600">{prosesPct}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terjual</p>
                <p className="text-sm font-black text-slate-800">{terjualPct}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {blokHeatmap.length > 0 && (
        <BlokHeatmap data={blokHeatmap} onBlokClick={onBlokClick} />
      )}
    </div>
  );
}
