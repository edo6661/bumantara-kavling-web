import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatRupiah } from '../../utils/formatters';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE, DASHBOARD_COLORS } from '../dashboard/dashboardTheme';

interface ArusKasPoint {
  bulanLabel: string;
  masuk: number;
  keluar: number;
}

export default function KeuanganArusKasChart({ data }: { data: ArusKasPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-sm text-slate-400">
        Belum ada data arus kas untuk periode ini.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d.bulanLabel,
    masuk: d.masuk,
    keluar: d.keluar,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
          Arus Kas Masuk vs Keluar
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
          Pemasukan tagihan lunas vs pengeluaran SPK, notaris, dan KPR
        </p>
      </div>
      <div className="p-4 min-h-[220px]">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis
              tick={CHART_AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
              width={42}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value, name) => [
                formatRupiah(Number(value)),
                name === 'masuk' ? 'Masuk' : 'Keluar',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
              formatter={(value) => (value === 'masuk' ? 'Kas Masuk' : 'Kas Keluar')}
            />
            <Bar dataKey="masuk" fill={DASHBOARD_COLORS.success} radius={[4, 4, 0, 0]} />
            <Bar dataKey="keluar" fill={DASHBOARD_COLORS.warning} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
