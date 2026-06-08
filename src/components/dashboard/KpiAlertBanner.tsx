import { AlertTriangle, Zap } from 'lucide-react';
import type { KpiAlert } from '../../services/dashboard.service';

interface KpiAlertBannerProps {
  alerts: KpiAlert[];
}

export default function KpiAlertBanner({ alerts }: KpiAlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`relative flex items-start gap-4 px-5 py-4 rounded-2xl border overflow-hidden ${
            alert.severity === 'critical'
              ? 'bg-red-50 border-red-200 shadow-sm shadow-red-100'
              : 'bg-amber-50 border-amber-200 shadow-sm shadow-amber-100'
          }`}
        >
          {/* Left accent */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
              alert.severity === 'critical'
                ? 'bg-gradient-to-b from-red-500 to-rose-600'
                : 'bg-gradient-to-b from-amber-400 to-orange-500'
            }`}
          />

          {/* Icon */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              alert.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'
            }`}
          >
            {alert.severity === 'critical' ? (
              <Zap
                size={16}
                className="text-red-600"
                strokeWidth={2.5}
              />
            ) : (
              <AlertTriangle
                size={16}
                className="text-amber-600"
                strokeWidth={2.5}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-[13px] font-black tracking-tight ${
                alert.severity === 'critical' ? 'text-red-800' : 'text-amber-800'
              }`}
            >
              {alert.message}
            </p>
            <p
              className={`text-[12px] mt-1 font-semibold flex items-center gap-1.5 ${
                alert.severity === 'critical' ? 'text-red-600' : 'text-amber-700'
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                }`}
              />
              {alert.actionHint}
            </p>
          </div>

          {/* Severity chip */}
          <span
            className={`text-[9px] font-black uppercase tracking-[0.12em] px-2 py-1 rounded-lg shrink-0 ${
              alert.severity === 'critical'
                ? 'bg-red-100 text-red-600 ring-1 ring-red-200'
                : 'bg-amber-100 text-amber-600 ring-1 ring-amber-200'
            }`}
          >
            {alert.severity === 'critical' ? 'KRITIS' : 'PERHATIAN'}
          </span>
        </div>
      ))}
    </div>
  );
}