import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface KpiComparison {
  changePercent: number | null;
  trend: 'up' | 'down' | 'flat';
}

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  comparison?: KpiComparison;
  comparisonLabel?: string;
  actionHint: string;
  severity?: 'normal' | 'warning' | 'critical';
  icon: LucideIcon;
  onClick: () => void;
}

const severityConfig = {
  normal: {
    iconGradient: 'from-blue-500 to-blue-600',
    iconShadow: 'shadow-blue-400/25',
    accentBar: 'bg-gradient-to-b from-blue-500 to-blue-600',
    actionBg: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    actionDot: 'bg-slate-400',
    ring: 'ring-blue-100',
  },
  warning: {
    iconGradient: 'from-amber-400 to-orange-500',
    iconShadow: 'shadow-amber-400/25',
    accentBar: 'bg-gradient-to-b from-amber-400 to-orange-500',
    actionBg: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    actionDot: 'bg-amber-400',
    ring: 'ring-amber-100',
  },
  critical: {
    iconGradient: 'from-red-500 to-rose-600',
    iconShadow: 'shadow-red-400/25',
    accentBar: 'bg-gradient-to-b from-red-500 to-rose-600',
    actionBg: 'bg-red-50 text-red-700 hover:bg-red-100',
    actionDot: 'bg-red-400',
    ring: 'ring-red-100',
  },
};

export default function KpiCard({
  title,
  value,
  subtitle,
  comparison,
  comparisonLabel = 'vs bulan lalu',
  actionHint,
  severity = 'normal',
  icon: Icon,
  onClick,
}: KpiCardProps) {
  const config = severityConfig[severity];

  const TrendIcon =
    comparison?.trend === 'up'
      ? ArrowUpRight
      : comparison?.trend === 'down'
        ? ArrowDownRight
        : Minus;

  const trendStyle =
    comparison?.trend === 'up'
      ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200'
      : comparison?.trend === 'down'
        ? 'text-red-700 bg-red-50 ring-1 ring-red-200'
        : 'text-slate-500 bg-slate-100';

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white rounded-2xl border border-slate-100
        hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/60
        hover:-translate-y-0.5 transition-all duration-200 cursor-pointer
        overflow-hidden flex flex-col shadow-sm shadow-slate-100/80
        ring-1 ${config.ring}
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${config.accentBar} rounded-l-2xl`} />

      {/* Top hover shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex-1 px-5 pt-5 pb-3">
        {/* Icon + trend badge row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`
              w-11 h-11 rounded-xl bg-gradient-to-br ${config.iconGradient}
              flex items-center justify-center shadow-lg ${config.iconShadow}
              group-hover:scale-110 transition-transform duration-200
            `}
          >
            <Icon size={19} className="text-white" strokeWidth={2} />
          </div>

          {comparison && comparison.changePercent !== null && (
            <span
              className={`flex items-center gap-0.5 text-[11px] font-black px-2 py-1 rounded-full ${trendStyle}`}
            >
              <TrendIcon size={11} strokeWidth={2.5} />
              {comparison.changePercent > 0 ? '+' : ''}
              {comparison.changePercent}%
            </span>
          )}
        </div>

        {/* Label */}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
          {title}
        </p>

        {/* Value */}
        <p className="text-[22px] font-black text-slate-900 leading-none tracking-tight">
          {value}
        </p>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-2 font-semibold">{subtitle}</p>
        )}

        {/* Comparison label */}
        {comparison && (
          <p className="text-[10px] text-slate-300 mt-1 font-medium">{comparisonLabel}</p>
        )}
      </div>

      {/* Action hint footer */}
      <div
        className={`
          mx-0 mt-0 px-5 py-2.5 text-[11px] font-bold
          flex items-center gap-2 border-t border-slate-100
          transition-colors ${config.actionBg}
        `}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.actionDot}`} />
        {actionHint}
      </div>
    </div>
  );
}