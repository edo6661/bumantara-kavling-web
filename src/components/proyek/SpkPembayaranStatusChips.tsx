import { ExternalLink, FileText } from 'lucide-react';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';
import {
  SPK_PEMBAYARAN_JENIS_LABEL,
  type SpkPembayaranJenis,
} from '../../utils/spkPembayaran';

const JENIS_ORDER: SpkPembayaranJenis[] = ['TERMIN_55', 'TERMIN_100', 'RETENSI'];

const SHORT_LABEL: Record<SpkPembayaranJenis, string> = {
  TERMIN_55: '55%',
  TERMIN_100: '100%',
  RETENSI: 'Ret.',
};

interface SpkPembayaranStatusChipsProps {
  items: SpkPembayaranData[];
  showBuktiLinks?: boolean;
}

const SpkPembayaranStatusChips = ({ items, showBuktiLinks = false }: SpkPembayaranStatusChipsProps) => {
  return (
    <div className="flex flex-wrap gap-1">
      {JENIS_ORDER.map((jenis) => {
        const row = items.find((p) => p.jenis === jenis);
        if (!row) {
          return (
            <span
              key={jenis}
              title={SPK_PEMBAYARAN_JENIS_LABEL[jenis]}
              className="inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-400"
            >
              {SHORT_LABEL[jenis]} —
            </span>
          );
        }

        const paid = row.status === 'SUDAH_DIBAYAR';
        return (
          <span key={jenis} className="inline-flex flex-col gap-0.5">
            <span
              title={SPK_PEMBAYARAN_JENIS_LABEL[jenis]}
              className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {SHORT_LABEL[jenis]} {paid ? '✓' : '…'}
            </span>
            {showBuktiLinks && paid && row.buktiPembayaran && (
              <a
                href={row.buktiPembayaran}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 hover:underline"
              >
                {row.buktiPembayaran.toLowerCase().includes('.pdf') ? (
                  <FileText size={10} />
                ) : (
                  <ExternalLink size={10} />
                )}
                Bukti
              </a>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default SpkPembayaranStatusChips;
