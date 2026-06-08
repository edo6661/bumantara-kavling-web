import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatRupiah } from '../../utils/formatters';
import {
  CHART_AXIS_STYLE,
  CHART_TOOLTIP_STYLE,
  DASHBOARD_COLORS,
  STATUS_COLORS,
} from './dashboardTheme';

interface TrendPoint {
  label: string;
  value: number;
}

interface StatusItem {
  status: string;
  label: string;
  count: number;
  nominal?: number;
}

interface CollectionPoint {
  label: string;
  terkumpul: number;
  menungguKonfirmasi: number;
}

interface ProgressRange {
  range: string;
  count: number;
}

function ChartCard({
  title,
  subtitle,
  actionHint,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  actionHint?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden flex flex-col hover:shadow-md hover:shadow-slate-200/50 transition-shadow duration-200">
      {/* Card header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-[14px] tracking-tight truncate">
              {title}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
          </div>
          {badge}
        </div>
        {actionHint && (
          <p className="text-[11px] text-blue-600 font-bold mt-2 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
            {actionHint}
          </p>
        )}
      </div>
      {/* Chart area */}
      <div className="flex-1 min-h-[220px] p-4">{children}</div>
    </div>
  );
}

export function RevenueTrendChart({
  data,
  trendMonths = 6,
}: {
  data: TrendPoint[];
  trendMonths?: number;
}) {
  return (
    <ChartCard
      title="Tren Pendapatan"
      subtitle={`Tagihan lunas per bulan (${trendMonths} bulan terakhir)`}
      actionHint="Turun 2 bulan berturut-turut? Evaluasi strategi penagihan"
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={DASHBOARD_COLORS.success} stopOpacity={0.15} />
              <stop offset="95%" stopColor={DASHBOARD_COLORS.success} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            formatter={(value) => [formatRupiah(Number(value)), 'Pendapatan']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={DASHBOARD_COLORS.success}
            strokeWidth={2.5}
            dot={{ fill: '#fff', stroke: DASHBOARD_COLORS.success, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: DASHBOARD_COLORS.success }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SalesTrendChart({
  data,
  trendMonths = 6,
}: {
  data: TrendPoint[];
  trendMonths?: number;
}) {
  return (
    <ChartCard
      title="Tren Penjualan"
      subtitle={`Unit terjual per bulan (${trendMonths} bulan terakhir)`}
      actionHint="Naik? Pertahankan momentum. Turun? Percepat follow-up prospek"
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis
            tick={CHART_AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${value} unit`, 'Penjualan']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={DASHBOARD_COLORS.primary}
            strokeWidth={2.5}
            dot={{ fill: '#fff', stroke: DASHBOARD_COLORS.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: DASHBOARD_COLORS.primary }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CollectionTrendChart({ data }: { data: CollectionPoint[] }) {
  return (
    <ChartCard
      title="Koleksi vs Konfirmasi"
      subtitle="Pembayaran terkumpul vs menunggu konfirmasi"
      actionHint="Lonjakan menunggu konfirmasi? Prioritaskan verifikasi bukti"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              name === 'terkumpul' ? 'Terkumpul' : 'Menunggu Konfirmasi',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(value) =>
              value === 'terkumpul' ? 'Terkumpul' : 'Menunggu Konfirmasi'
            }
          />
          <Bar dataKey="terkumpul" stackId="a" fill={DASHBOARD_COLORS.success} radius={[0, 0, 0, 0]} />
          <Bar
            dataKey="menungguKonfirmasi"
            stackId="a"
            fill={DASHBOARD_COLORS.warning}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function KavlingStatusChart({
  data,
  onSegmentClick,
}: {
  data: StatusItem[];
  onSegmentClick?: (status: string, label: string) => void;
}) {
  const chartData = data.filter((d) => d.count > 0);
  const total = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <ChartCard
      title="Komposisi Kavling"
      subtitle="Proporsi status unit · klik segmen untuk detail"
      actionHint="Stok tersedia rendah? Pertimbangkan rilis unit baru"
      badge={
        <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
          {total} unit
        </span>
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={2}
            className="cursor-pointer"
            onClick={(entry) => {
              const payload = (entry as { payload?: StatusItem }).payload ?? entry;
              const item = payload as StatusItem;
              if (item.status) onSegmentClick?.(item.status, item.label);
            }}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? DASHBOARD_COLORS.neutral}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => [`${value} unit`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PenjualanStatusChart({
  data,
  onSegmentClick,
}: {
  data: StatusItem[];
  onSegmentClick?: (status: string, label: string) => void;
}) {
  const chartData = data.filter((d) => d.count > 0 && d.status !== 'BATAL');

  return (
    <ChartCard
      title="Pipeline Penjualan"
      subtitle="Status transaksi · klik bar untuk detail"
      actionHint="Banyak Booked? Follow-up DP. Proses? Percepat akad"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={CHART_AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={CHART_AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${value} transaksi`, 'Jumlah']}
          />
          <Bar
            dataKey="count"
            radius={[0, 5, 5, 0]}
            className="cursor-pointer"
            onClick={(entry) => {
              const payload = (entry as { payload?: StatusItem }).payload ?? entry;
              const item = payload as StatusItem;
              if (item.status) onSegmentClick?.(item.status, item.label);
            }}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? DASHBOARD_COLORS.primary}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TagihanStatusChart({
  data,
  onSegmentClick,
}: {
  data: StatusItem[];
  onSegmentClick?: (status: string, label: string) => void;
}) {
  const chartData = data.filter((d) => d.count > 0);

  return (
    <ChartCard
      title="Status Tagihan"
      subtitle="Nominal tagihan · klik bar untuk detail"
      actionHint="Belum bayar tinggi? Jalankan reminder & eskalasi"
    >
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
            formatter={(value, _name, props) => {
              const item = props.payload as StatusItem;
              return [formatRupiah(Number(value)), `${item.count} tagihan`];
            }}
          />
          <Bar
            dataKey="nominal"
            radius={[5, 5, 0, 0]}
            className="cursor-pointer"
            onClick={(entry) => {
              const payload = (entry as { payload?: StatusItem }).payload ?? entry;
              const item = payload as StatusItem;
              if (item.status) onSegmentClick?.(item.status, item.label);
            }}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? DASHBOARD_COLORS.neutral}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProgressBreakdownChart({
  data,
  onSegmentClick,
}: {
  data: ProgressRange[];
  onSegmentClick?: (range: string) => void;
}) {
  return (
    <ChartCard
      title="Distribusi Progress Proyek"
      subtitle="Persentase penyelesaian · klik bar untuk detail"
      actionHint="Banyak di bawah 50%? Review mandor & tukang"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="range" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis
            tick={CHART_AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [`${value} unit`, 'Proyek']}
          />
          <Bar
            dataKey="count"
            fill={DASHBOARD_COLORS.primary}
            radius={[5, 5, 0, 0]}
            className="cursor-pointer"
            onClick={(entry) => {
              const payload = (entry as { payload?: ProgressRange }).payload ?? entry;
              const item = payload as ProgressRange;
              if (item.range) onSegmentClick?.(item.range);
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}