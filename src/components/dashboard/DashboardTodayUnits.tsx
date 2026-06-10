import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Layers, ShoppingCart } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import type { TodayUnitItem } from '../../services/dashboard.service';

interface TodayUnitsListProps {
  title: string;
  subtitle: string;
  items: TodayUnitItem[];
  emptyMessage: string;
  accentClass: string;
  badgeClass: string;
  icon: LucideIcon;
  onItemClick?: (item: TodayUnitItem) => void;
  onViewAll?: () => void;
}

function TodayUnitsList({
  title,
  subtitle,
  items,
  emptyMessage,
  accentClass,
  badgeClass,
  icon: Icon,
  onItemClick,
  onViewAll,
}: TodayUnitsListProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden flex flex-col h-full">
      <div className={`h-1 w-full ${accentClass}`} />

      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${badgeClass}`}>
            <Icon size={17} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">{title}</h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${badgeClass}`}
              >
                {items.length} unit
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
          </div>
        </div>
        {onViewAll && items.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Semua <ArrowUpRight size={12} />
          </button>
        )}
      </div>

      <div className="flex-1 p-3 sm:p-4">
        {items.length > 0 ? (
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer group"
              >
                <span className="text-[11px] font-black text-slate-300 w-5 text-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-[13px] truncate">{item.customer}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.kavling}
                    {item.caraPembayaran ? ` · ${item.caraPembayaran}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-black text-slate-900 whitespace-nowrap">
                    {formatRupiah(item.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.waktu}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${badgeClass}`}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <p className="text-slate-500 text-[13px] font-semibold">{emptyMessage}</p>
            <p className="text-slate-400 text-[11px] mt-1 font-medium">
              Data diperbarui setiap hari
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardTodayUnitsProps {
  todayDate: string;
  bookingHariIni: TodayUnitItem[];
  prosesHariIni: TodayUnitItem[];
  onItemClick?: (item: TodayUnitItem) => void;
  onViewAllBooking?: () => void;
  onViewAllProses?: () => void;
}

function formatTodayLabel(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  const [y, m, d] = parts;
  const date = new Date(y!, m! - 1, d);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DashboardTodayUnits({
  todayDate,
  bookingHariIni,
  prosesHariIni,
  onItemClick,
  onViewAllBooking,
  onViewAllProses,
}: DashboardTodayUnitsProps) {
  const todayLabel = formatTodayLabel(todayDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TodayUnitsList
        title="Unit Ter-Booking Hari Ini"
        subtitle={`Per ${todayLabel}`}
        items={bookingHariIni}
        emptyMessage="Belum ada unit booking hari ini"
        accentClass="bg-gradient-to-r from-amber-400 to-orange-500"
        badgeClass="bg-amber-50 text-amber-600"
        icon={ShoppingCart}
        onItemClick={onItemClick}
        onViewAll={onViewAllBooking}
      />
      <TodayUnitsList
        title="Unit Ter-Proses Hari Ini"
        subtitle={`Per ${todayLabel}`}
        items={prosesHariIni}
        emptyMessage="Belum ada unit masuk proses hari ini"
        accentClass="bg-gradient-to-r from-blue-500 to-blue-600"
        badgeClass="bg-blue-50 text-blue-600"
        icon={Layers}
        onItemClick={onItemClick}
        onViewAll={onViewAllProses}
      />
    </div>
  );
}
