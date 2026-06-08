import type { BlokHeatmapItem } from '../../services/dashboard.service';
import { STATUS_COLORS } from './dashboardTheme';
import { MapPin } from 'lucide-react';

interface BlokHeatmapProps {
  data: BlokHeatmapItem[];
  onBlokClick?: (blok: string) => void;
}

function getHeatColor(soldPercent: number): { bg: string; text: string; subtext: string } {
  if (soldPercent >= 80) return { bg: '#1e293b', text: 'text-white', subtext: 'text-white/70' };
  if (soldPercent >= 60) return { bg: '#2563eb', text: 'text-white', subtext: 'text-white/70' };
  if (soldPercent >= 40) return { bg: '#60a5fa', text: 'text-white', subtext: 'text-white/80' };
  if (soldPercent >= 20) return { bg: '#bfdbfe', text: 'text-blue-900', subtext: 'text-blue-700' };
  return { bg: '#eff6ff', text: 'text-blue-800', subtext: 'text-blue-600' };
}

const LEGEND_STEPS = [0, 20, 40, 60, 80];

export default function BlokHeatmap({ data, onBlokClick }: BlokHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 p-8 flex flex-col items-center justify-center min-h-[200px]">
        <MapPin size={28} className="text-slate-200 mb-3" />
        <p className="text-slate-400 text-[13px] font-medium">Belum ada data kavling per blok</p>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
          Heatmap Kepadatan Blok
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
          Intensitas warna = % terjual per blok · Klik untuk detail
        </p>
        <p className="text-[11px] text-blue-600 font-bold mt-1.5 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
          Blok dengan stok tersedia tinggi? Prioritaskan promosi di blok tersebut
        </p>
      </div>

      {/* Grid */}
      <div className="p-5">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {data.map((blok) => {
            const heat = getHeatColor(blok.soldPercent);
            const sizeScale = 0.75 + (blok.total / maxTotal) * 0.25;

            return (
              <button
                key={blok.blok}
                onClick={() => onBlokClick?.(blok.blok)}
                className="group relative rounded-xl p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer border border-white/20"
                style={{
                  backgroundColor: heat.bg,
                  opacity: sizeScale,
                }}
                title={`Blok ${blok.blok}: ${blok.terjual}/${blok.total} terjual (${blok.soldPercent}%)`}
              >
                {/* Shine on hover */}
                <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
                <p className={`text-[13px] font-black leading-none ${heat.text}`}>
                  {blok.blok}
                </p>
                <p className={`text-[11px] font-bold mt-1 ${heat.subtext}`}>
                  {blok.terjual}/{blok.total}
                </p>
                <p className={`text-[9px] font-semibold mt-0.5 ${heat.subtext}`}>
                  {blok.soldPercent}%
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center gap-5 bg-slate-50/50">
        {/* Heat scale */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
            % Terjual
          </span>
          <div className="flex items-center gap-1">
            {LEGEND_STEPS.map((pct) => {
              const heat = getHeatColor(pct + 10);
              return (
                <div key={pct} className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-md border border-white shadow-sm"
                    style={{ backgroundColor: heat.bg }}
                  />
                  <span className="text-[9px] text-slate-400 font-semibold">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-3 ml-auto">
          {Object.entries({
            Tersedia: STATUS_COLORS.AVAILABLE,
            Booking: STATUS_COLORS.BOOKING,
            Hold: STATUS_COLORS.HOLD,
          }).map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}