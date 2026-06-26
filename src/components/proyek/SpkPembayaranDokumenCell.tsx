import BuktiFileThumbnail from '../shared/BuktiFileThumbnail';
import {
  getSpkPembayaranDokumenItems,
  type SpkPembayaranDokumenItem,
} from '../../utils/spkPembayaranDokumen';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';

interface SpkPembayaranDokumenCellProps {
  row: Pick<
    SpkPembayaranData,
    'dokumenInvoice' | 'dokumenMaterial' | 'dokumenBeritaAcara' | 'dokumenProgressSpk'
  >;
  onPreview: (item: SpkPembayaranDokumenItem) => void;
  thumbnailClassName?: string;
}

const SpkPembayaranDokumenCell = ({
  row,
  onPreview,
  thumbnailClassName = 'w-11 h-8',
}: SpkPembayaranDokumenCellProps) => {
  const items = getSpkPembayaranDokumenItems(row);
  if (!items.length) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <div key={item.key} className="flex flex-col items-center gap-0.5">
          <BuktiFileThumbnail
            url={item.url}
            alt={item.label}
            onClick={() => onPreview(item)}
            className={thumbnailClassName}
          />
          <span className="text-[8px] font-bold text-slate-500 uppercase leading-none">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SpkPembayaranDokumenCell;
