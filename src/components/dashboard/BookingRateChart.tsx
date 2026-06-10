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
import type { BookingRateRow } from '../../services/dashboard.service';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE, DASHBOARD_COLORS } from './dashboardTheme';

interface BookingRateChartProps {
  year: number;
  data: BookingRateRow[];
}

export default function BookingRateChart({ year, data }: BookingRateChartProps) {
  const chartData = data.map((row) => ({
    name: row.monthLabel.slice(0, 3),
    pemesanan: row.jumlahPemesanan,
    tingkat: row.tingkatPersen,
  }));

  const totalPemesanan = data.reduce((sum, row) => sum + row.jumlahPemesanan, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
          Tingkat Pemesanan Unit Tahun {year}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
          Transaksi penjualan baru per bulan (non batal) ÷ total kavling
        </p>
      </div>

      <div className="p-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={CHART_AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value, name) => {
                const num = Number(value ?? 0);
                if (name === 'tingkat') return [`${num}%`, 'Tingkat'];
                return [`${num} unit`, 'Pemesanan'];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
              formatter={(value) => (value === 'pemesanan' ? 'Pemesanan (unit)' : 'Tingkat (%)')}
            />
            <Bar
              yAxisId="left"
              dataKey="pemesanan"
              fill={DASHBOARD_COLORS.primary}
              radius={[6, 6, 0, 0]}
              name="pemesanan"
            />
            <Bar
              yAxisId="right"
              dataKey="tingkat"
              fill={DASHBOARD_COLORS.chart[4]}
              radius={[6, 6, 0, 0]}
              name="tingkat"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <span className="text-[12px] font-bold text-slate-600">Total pemesanan {year}</span>
        <span className="text-[14px] font-black text-blue-700">{totalPemesanan} unit</span>
      </div>
    </div>
  );
}
