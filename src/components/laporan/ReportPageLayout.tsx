import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface ReportPageLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
}

export function ReportSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        {children}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  );
}

export default function ReportPageLayout({
  title,
  subtitle,
  icon: Icon,
  children,
  actions,
}: ReportPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-50/60 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-5 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                  Laporan
                </p>
                <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">
                  {title}
                </h1>
                <p className="text-[12px] text-slate-400 mt-1.5 font-medium max-w-xl">
                  {subtitle}
                </p>
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
