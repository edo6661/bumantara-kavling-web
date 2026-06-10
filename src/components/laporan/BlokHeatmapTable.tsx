import type { BlokHeatmapItem } from '../../services/dashboard.service';

interface BlokHeatmapTableProps {
  data: BlokHeatmapItem[];
}

export default function BlokHeatmapTable({ data }: BlokHeatmapTableProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">Belum ada data per blok.</p>
    );
  }

  const sorted = [...data].sort((a, b) => b.soldPercent - a.soldPercent);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
              Blok
            </th>
            <th className="text-right py-3 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
              Total
            </th>
            <th className="text-right py-3 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
              Terjual
            </th>
            <th className="text-right py-3 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
              Booking
            </th>
            <th className="text-right py-3 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
              Tersedia
            </th>
            <th className="text-right py-3 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
              % Terjual
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.blok} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
              <td className="py-3 px-4 font-bold text-slate-800">{row.blok}</td>
              <td className="py-3 px-4 text-right text-slate-600">{row.total}</td>
              <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{row.terjual}</td>
              <td className="py-3 px-4 text-right text-amber-600 font-semibold">{row.booking}</td>
              <td className="py-3 px-4 text-right text-blue-600 font-semibold">{row.available}</td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(row.soldPercent, 100)}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-700 w-10 text-right">
                    {row.soldPercent.toFixed(0)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
