import { FileText, ZoomIn } from 'lucide-react';

export const isBuktiPdfUrl = (url: string) => {
  const path = url.split('?')[0].toLowerCase();
  return path.endsWith('.pdf') || url.toLowerCase().includes('application/pdf');
};

interface BuktiFileThumbnailProps {
  url: string;
  onClick: () => void;
  alt?: string;
  className?: string;
}

const BuktiFileThumbnail = ({
  url,
  onClick,
  alt = 'Bukti',
  className = 'w-20 h-14',
}: BuktiFileThumbnailProps) => {
  const isPdf = isBuktiPdfUrl(url);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`relative rounded-lg border border-slate-200 overflow-hidden cursor-zoom-in hover:border-indigo-400 transition shrink-0 bg-slate-50 ${className}`}
      title="Perbesar bukti"
    >
      {isPdf ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-red-500">
          <FileText size={18} />
          <span className="text-[8px] font-bold mt-0.5">PDF</span>
        </div>
      ) : (
        <img src={url} alt={alt} className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
        <ZoomIn className="text-white" size={14} />
      </div>
    </button>
  );
};

export default BuktiFileThumbnail;
