import { ExternalLink, FileText } from 'lucide-react';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';
import type { SpkTerminSchemeKey } from '../../services/spk.service';
import {
  buildSpkPembayaranJenisLabel,
  getSpkTerminJenisOrder,
} from '../../utils/spkPembayaran';

interface SpkPembayaranStatusChipsProps {
  items: SpkPembayaranData[];
  showBuktiLinks?: boolean;
  terminScheme?: SpkTerminSchemeKey;
}

const SpkPembayaranStatusChips = ({
  items,
  showBuktiLinks = false,
  terminScheme = 'RUMAH_DEFAULT',
}: SpkPembayaranStatusChipsProps) => {
  const jenisOrder = getSpkTerminJenisOrder(terminScheme);
  const jenisLabels = buildSpkPembayaranJenisLabel(terminScheme);
  const shortLabel = Object.fromEntries(
    jenisOrder.map((jenis) => [
      jenis,
      jenisLabels[jenis].includes('Retensi')
        ? 'Ret.'
        : jenisLabels[jenis].match(/Termin (\d+%)/)?.[1] ?? jenis,
    ]),
  ) as Record<(typeof jenisOrder)[number], string>;

  const kasbonItems = items.filter((p) => p.jenis === 'KASBON');
  const upahItems = items.filter((p) => p.jenis === 'UPAH');
  const kasbonMenunggu = kasbonItems.filter(
    (p) =>
      p.status === 'MENUNGGU_PEMBAYARAN' ||
      p.status === 'MENUNGGU_PERSETUJUAN' ||
      p.status === 'MENUNGGU_APPROVAL_ADMIN',
  ).length;
  const upahMenunggu = upahItems.filter(
    (p) =>
      p.status === 'MENUNGGU_PEMBAYARAN' ||
      p.status === 'MENUNGGU_PERSETUJUAN' ||
      p.status === 'MENUNGGU_APPROVAL_ADMIN',
  ).length;

  return (
    <div className="flex flex-wrap gap-1">
      {kasbonItems.length > 0 && (
        <span
          title={`${kasbonItems.length} kasbon`}
          className="inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-orange-100 text-orange-800 border border-orange-200"
        >
          Ksb {kasbonMenunggu > 0 ? `${kasbonMenunggu}…` : '✓'}
        </span>
      )}
      {upahItems.length > 0 && (
        <span
          title={`${upahItems.length} upah tukang`}
          className="inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-teal-100 text-teal-800 border border-teal-200"
        >
          Upah {upahMenunggu > 0 ? `${upahMenunggu}…` : '✓'}
        </span>
      )}
      {jenisOrder.map((jenis) => {
        const row = items.find((p) => p.jenis === jenis);
        if (!row) {
          return (
            <span
              key={jenis}
              title={jenisLabels[jenis]}
              className="inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-400"
            >
              {shortLabel[jenis]} —
            </span>
          );
        }

        const paid = row.status === 'SUDAH_DIBAYAR';
        return (
          <span key={jenis} className="inline-flex flex-col gap-0.5">
            <span
              title={jenisLabels[jenis]}
              className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {shortLabel[jenis]} {paid ? '✓' : '…'}
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
