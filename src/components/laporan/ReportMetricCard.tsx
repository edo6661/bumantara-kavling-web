import type { ReactNode } from 'react';

type ReportMetricTone = 'default' | 'success' | 'warning';

const TONE_SURFACE: Record<ReportMetricTone, string> = {
  default: 'bg-white border-slate-100',
  success: 'bg-emerald-50/50 border-emerald-200',
  warning: 'bg-amber-50/50 border-amber-200',
};

interface ReportMetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  subValue?: ReactNode;
  valueClassName?: string;
  compact?: boolean;
  tone?: ReportMetricTone;
  className?: string;
}

export default function ReportMetricCard({
  label,
  value,
  hint,
  subValue,
  valueClassName = 'text-slate-900',
  compact = false,
  tone = 'default',
  className = '',
}: ReportMetricCardProps) {
  if (compact) {
    return (
      <div
        className={`bg-slate-50 rounded-xl border border-slate-100 px-3 py-2 text-center ${className}`}
      >
        <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
        <p className={`text-[12px] font-bold ${valueClassName}`}>{value}</p>
        {hint && <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{hint}</p>}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border shadow-sm shadow-slate-100/80 p-4 ${TONE_SURFACE[tone]} ${className}`}
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-lg font-black ${valueClassName}`}>{value}</p>
      {subValue && <p className="text-[11px] text-slate-500 mt-0.5">{subValue}</p>}
      {hint && (
        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{hint}</p>
      )}
    </div>
  );
}
