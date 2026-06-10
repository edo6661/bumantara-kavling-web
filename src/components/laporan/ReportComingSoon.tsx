import { Construction } from 'lucide-react';

interface ReportComingSoonProps {
  title: string;
  description: string;
  plannedFeatures: string[];
}

export default function ReportComingSoon({
  title,
  description,
  plannedFeatures,
}: ReportComingSoonProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
      <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
          <Construction size={28} className="text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        <div className="w-full text-left bg-slate-50 rounded-xl border border-slate-100 p-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Rencana konten laporan
          </p>
          <ul className="space-y-2">
            {plannedFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-[13px] text-slate-600 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
