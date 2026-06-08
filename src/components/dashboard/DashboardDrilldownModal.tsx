import Modal from '../shared/Modal';
import PageLoader from '../../pages/PageLoader';
import type { DrilldownItem } from '../../services/dashboard.service';
import { ChevronRight } from 'lucide-react';

interface DashboardDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: DrilldownItem[];
  isLoading: boolean;
  onItemClick?: (item: DrilldownItem) => void;
}

export default function DashboardDrilldownModal({
  isOpen,
  onClose,
  title,
  items,
  isLoading,
  onItemClick,
}: DashboardDrilldownModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {isLoading ? (
        <PageLoader />
      ) : items.length > 0 ? (
        <div>
          {/* Count badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] text-slate-400 font-semibold">
              {items.length} item ditemukan
            </span>
            <span className="text-[10px] text-blue-600 font-bold px-2.5 py-1 bg-blue-50 rounded-full">
              Klik untuk navigasi
            </span>
          </div>

          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm transition-all cursor-pointer group"
              >
                {/* Index */}
                <span className="text-[11px] font-black text-slate-300 w-5 text-center shrink-0">
                  {idx + 1}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-[13px] truncate">{item.label}</p>
                  {item.sublabel && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                      {item.sublabel}
                    </p>
                  )}
                </div>

                {/* Value + status */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.value && (
                    <p className="text-[13px] font-black text-slate-900">{item.value}</p>
                  )}
                  {item.status && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg tracking-wide">
                      {item.status}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-14 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-slate-700 text-[14px] font-bold">Tidak ada data</p>
          <p className="text-slate-400 text-[12px] mt-1 font-medium">
            Tidak ada item untuk filter ini
          </p>
        </div>
      )}
    </Modal>
  );
}