import { useEffect, useRef } from 'react';
import { ClipboardPaste, X } from 'lucide-react';

interface PasteUploadBannerProps {
  label: string;
  onClear: () => void;
}

const PasteUploadBanner = ({ label, onClear }: PasteUploadBannerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [label]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="region"
      aria-label="Area paste bukti pembayaran"
      onClick={() => ref.current?.focus()}
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-xl animate-in fade-in duration-200 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 cursor-default"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0">
          <ClipboardPaste size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-blue-900">Siap paste bukti pembayaran</p>
          <p className="text-[12px] text-blue-700/90 mt-0.5 truncate" title={label}>
            {label}
          </p>
          <p className="text-[11px] text-blue-600/80 mt-1">
            Area ini aktif — tekan{' '}
            <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-mono">
              Ctrl+V
            </kbd>{' '}
            untuk menempelkan gambar atau PDF dari clipboard
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold uppercase text-blue-700 hover:bg-blue-100 rounded-lg transition shrink-0"
      >
        <X size={14} />
        Batal
      </button>
    </div>
  );
};

export default PasteUploadBanner;
