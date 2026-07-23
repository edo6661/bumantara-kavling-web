import SpkPembayaranDokumenCell from './SpkPembayaranDokumenCell';
import type { SpkPembayaranDokumenItem } from '../../utils/spkPembayaranDokumen';
import { hasSpkPembayaranDokumen } from '../../utils/spkPembayaranDokumen';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';

interface SpkPembayaranDokumenPanelProps {
  row: Pick<
    SpkPembayaranData,
    'dokumenInvoice' | 'dokumenMaterial' | 'dokumenBeritaAcara' | 'dokumenProgressSpk'
  >;
  onPreview: (item: SpkPembayaranDokumenItem) => void;
}

const SpkPembayaranDokumenPanel = ({ row, onPreview }: SpkPembayaranDokumenPanelProps) => {
  if (!hasSpkPembayaranDokumen(row)) {
    return (
      <p className="text-xs text-slate-400 italic">
        Tidak ada dokumen pengajuan.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Dokumen Pengajuan</p>
      <SpkPembayaranDokumenCell row={row} onPreview={onPreview} thumbnailClassName="w-14 h-10" />
    </div>
  );
};

export default SpkPembayaranDokumenPanel;
