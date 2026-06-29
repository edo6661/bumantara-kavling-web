import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronUp, PieChart } from 'lucide-react';

export interface PageSummaryStat {
  value: string | number;
  label: string;
  icon: LucideIcon;
  iconBgClassName?: string;
  iconClassName?: string;
  valueClassName?: string;
  borderHoverClassName?: string;
}

interface PageSummaryCardProps {
  title: string;
  subtitle?: string;
  headerIcon?: LucideIcon;
  items: PageSummaryStat[];
  defaultExpanded?: boolean;
  columnsClassName?: string;
  footer?: ReactNode;
}

const PageSummaryCard = ({
  title,
  subtitle = 'Statistik ringkas halaman ini',
  headerIcon: HeaderIcon = PieChart,
  items,
  defaultExpanded = false,
  columnsClassName = 'grid-cols-2 md:grid-cols-4',
  footer,
}: PageSummaryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
      <div
        className="px-5 py-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-white hover:bg-slate-50/40 transition-colors"
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <HeaderIcon size={16} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          aria-label={isExpanded ? 'Sembunyikan ringkasan' : 'Tampilkan ringkasan'}
        >
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {isExpanded && (
        <div className={`p-5 grid ${columnsClassName} gap-4 bg-slate-50/50`}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group ${
                  item.borderHoverClassName ?? 'hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-2.5 rounded-xl group-hover:scale-105 transition-transform ${
                      item.iconBgClassName ?? 'bg-slate-100'
                    }`}
                  >
                    <Icon size={18} className={item.iconClassName ?? 'text-slate-700'} />
                  </div>
                </div>
                <div>
                  <p
                    className={`text-3xl font-black tabular-nums tracking-tight ${
                      item.valueClassName ?? 'text-slate-900'
                    }`}
                  >
                    {item.value}
                  </p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isExpanded && footer ? (
        <div className="px-5 pb-4 bg-slate-50/50 text-[11px] text-slate-500">{footer}</div>
      ) : null}
    </div>
  );
};

export default PageSummaryCard;
