import { useState } from 'react';
import Modal from '../shared/Modal';
import PageLoader from '../../pages/PageLoader';
import type { DashboardDrilldownMode, DrilldownItem } from '../../services/dashboard.service';
import { ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import BuktiFileThumbnail from '../shared/BuktiFileThumbnail';

interface DashboardDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: DrilldownItem[];
  isLoading: boolean;
  mode?: DashboardDrilldownMode;
  entityLabel?: string;
  emptyMessage?: string;
  onItemClick?: (item: DrilldownItem) => void;
  onViewAll?: () => void;
  viewAllLabel?: string;
}

export default function DashboardDrilldownModal({
  isOpen,
  onClose,
  title,
  items,
  isLoading,
  mode = 'default',
  entityLabel = 'item',
  emptyMessage = 'Tidak ada item untuk filter ini',
  onItemClick,
  onViewAll,
  viewAllLabel = 'Lihat semua',
}: DashboardDrilldownModalProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isPendapatan = mode === 'pendapatan';

  const handleClose = () => {
    setPreviewImage(null);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
        {isLoading ? (
          <PageLoader />
        ) : items.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] text-slate-400 font-semibold">
                {items.length} {entityLabel} ditemukan
                {items.length >= 50 ? ' · menampilkan 50 teratas' : ''}
              </span>
              {!isPendapatan && onItemClick && (
                <span className="text-[10px] text-blue-600 font-bold px-2.5 py-1 bg-blue-50 rounded-full">
                  Klik baris untuk buka halaman
                </span>
              )}
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  role={!isPendapatan && onItemClick ? 'button' : undefined}
                  tabIndex={!isPendapatan && onItemClick ? 0 : undefined}
                  onClick={() => !isPendapatan && onItemClick?.(item)}
                  onKeyDown={(event) => {
                    if (isPendapatan || !onItemClick) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onItemClick(item);
                    }
                  }}
                  className={`px-4 py-3 bg-white rounded-xl border border-slate-100 transition-all ${
                    isPendapatan
                      ? 'hover:border-emerald-200 hover:bg-emerald-50/20'
                      : onItemClick
                        ? 'hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60'
                        : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[11px] font-black text-slate-300 w-5 text-center shrink-0 pt-0.5">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[13px] truncate">
                            {item.label}
                          </p>
                          {item.sublabel && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                              {item.sublabel}
                            </p>
                          )}
                          {isPendapatan && item.pembayaran && (
                            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                              {item.pembayaran}
                            </p>
                          )}
                          {isPendapatan && item.tanggalBayar && (
                            <p className="text-[10px] text-slate-500 mt-1 font-medium">
                              Tanggal bayar: {formatDate(item.tanggalBayar)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.value && (
                            <p className="text-[13px] font-black text-slate-900 whitespace-nowrap">
                              {item.value}
                            </p>
                          )}
                          {!isPendapatan && item.status && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg tracking-wide">
                              {item.status}
                            </span>
                          )}
                          {!isPendapatan && (
                            <ChevronRight
                              size={14}
                              className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
                            />
                          )}
                        </div>
                      </div>

                      {isPendapatan && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">
                            Bukti Pembayaran
                          </p>
                          {item.buktiUrls && item.buktiUrls.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {item.buktiUrls.map((url, buktiIdx) => (
                                <BuktiFileThumbnail
                                  key={`${item.id}-bukti-${buktiIdx}`}
                                  url={url}
                                  onClick={() => setPreviewImage(url)}
                                  className="w-16 h-12"
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Tidak ada bukti diunggah
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {onViewAll && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={onViewAll}
                  className="px-4 py-2 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  {viewAllLabel} →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-slate-700 text-[14px] font-bold">Tidak ada data</p>
            <p className="text-slate-400 text-[12px] mt-1 font-medium">{emptyMessage}</p>
            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="mt-4 px-4 py-2 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                {viewAllLabel} →
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Bukti Transfer"
      >
        {previewImage && (
          <div className="flex flex-col items-center">
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {previewImage.split('?')[0].toLowerCase().endsWith('.pdf') ||
              previewImage.includes('application/pdf') ? (
                <iframe
                  src={previewImage}
                  className="w-full h-[60vh] rounded-lg border-none"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewImage}
                  alt="Preview Bukti Transfer"
                  className="max-w-full max-h-[60vh] rounded-lg shadow-xl object-contain"
                />
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Buka Tab Baru
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
