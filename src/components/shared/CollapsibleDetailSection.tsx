import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleDetailSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

const CollapsibleDetailSection = ({
  title,
  subtitle,
  defaultOpen = false,
  badge,
  children,
  className = '',
}: CollapsibleDetailSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-slate-50 hover:bg-slate-100/70 transition-colors"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
              {title}
            </span>
            {badge}
          </div>
          {subtitle && (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-4 py-3 border-t border-slate-100">{children}</div>}
    </section>
  );
};

export default CollapsibleDetailSection;
