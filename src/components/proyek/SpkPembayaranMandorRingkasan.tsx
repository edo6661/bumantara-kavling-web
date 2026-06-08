import { useMemo } from 'react';
import { CheckCircle2, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetSpkPembayaranList } from '../../hooks/queries/useSpkPembayaran';
import type { SpkData } from '../../services/spk.service';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';
import { formatDate, formatRupiah } from '../../utils/formatters';
import { SPK_PEMBAYARAN_JENIS_LABEL } from '../../utils/spkPembayaran';

interface SpkPembayaranMandorRingkasanProps {
  mandorSpks: SpkData[];
}

const BuktiLink = ({ url }: { url: string }) => {
  const isPdf = url.toLowerCase().includes('.pdf');
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 hover:underline"
    >
      {isPdf ? <FileText size={12} /> : <ExternalLink size={12} />}
      Lihat bukti
    </a>
  );
};

type PembayaranRingkasanRow = SpkPembayaranData & { noSpk: string };

const PaidRow = ({ row }: { row: PembayaranRingkasanRow }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-emerald-100 last:border-0">
    <div className="min-w-0">
      <p className="text-xs font-bold text-slate-800">
        SPK {row.noSpk} ·{' '}
        {row.jenis === 'KASBON'
          ? `Kasbon: ${row.keterangan ?? '-'}`
          : SPK_PEMBAYARAN_JENIS_LABEL[row.jenis]}
      </p>
      <p className="text-[11px] text-emerald-700 mt-0.5">
        {formatRupiah(row.nominal)}
        {row.tanggalPembayaran && ` · ${formatDate(row.tanggalPembayaran)}`}
      </p>
    </div>
    {row.buktiPembayaran && <BuktiLink url={row.buktiPembayaran} />}
  </div>
);

const SpkPembayaranMandorRingkasan = ({ mandorSpks }: SpkPembayaranMandorRingkasanProps) => {
  const spkIds = useMemo(() => new Set(mandorSpks.map((s) => s.id)), [mandorSpks]);

  const { data, isLoading } = useGetSpkPembayaranList({ page: 1, limit: 500, status: 'ALL' });

  const { paid, waitingFinance, waitingPengawas } = useMemo(() => {
    const items = (data?.items ?? []).filter((p) => spkIds.has(p.spkId));
    const noSpkById = new Map(mandorSpks.map((s) => [s.id, s.noSpk]));
    const enrich = (p: SpkPembayaranData) => ({
      ...p,
      noSpk: p.spk?.noSpk ?? noSpkById.get(p.spkId) ?? `#${p.spkId}`,
    });
    return {
      paid: items.filter((p) => p.status === 'SUDAH_DIBAYAR').map(enrich),
      waitingFinance: items.filter((p) => p.status === 'MENUNGGU_PEMBAYARAN').map(enrich),
      waitingPengawas: items.filter((p) => p.status === 'MENUNGGU_PERSETUJUAN').map(enrich),
    };
  }, [data?.items, mandorSpks, spkIds]);

  if (mandorSpks.length === 0) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" />
        Memuat status pembayaran SPK...
      </div>
    );
  }

  if (paid.length === 0 && waitingFinance.length === 0 && waitingPengawas.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <strong>Pembayaran SPK</strong> — ajukan termin di menu{' '}
        <Link to="/proyek/spk" className="font-bold underline hover:text-blue-900">
          SPK
        </Link>{' '}
        (buka detail SPK → Pengajuan Pembayaran).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paid.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-900">Pembayaran SPK sudah diterima</p>
              <p className="text-[11px] text-emerald-700">
                Status dan bukti transfer tercatat di sini.
              </p>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg px-3">
            {paid.map((row) => (
              <PaidRow key={row.id} row={row} />
            ))}
          </div>
        </div>
      )}

      {waitingPengawas.length > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-xs text-sky-900">
          <p className="font-bold mb-1">Menunggu persetujuan pengawas ({waitingPengawas.length})</p>
          <ul className="space-y-1 text-[11px]">
            {waitingPengawas.map((row) => (
              <li key={row.id}>
                SPK {row.noSpk} ·{' '}
                {row.jenis === 'KASBON'
                  ? `Kasbon: ${row.keterangan ?? '-'}`
                  : SPK_PEMBAYARAN_JENIS_LABEL[row.jenis]}{' '}
                · {formatRupiah(row.nominal)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {waitingFinance.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-900">
          <p className="font-bold mb-1">Menunggu pembayaran finance ({waitingFinance.length})</p>
          <ul className="space-y-1 text-[11px]">
            {waitingFinance.map((row) => (
              <li key={row.id}>
                SPK {row.noSpk} ·{' '}
        {row.jenis === 'KASBON'
          ? `Kasbon: ${row.keterangan ?? '-'}`
          : SPK_PEMBAYARAN_JENIS_LABEL[row.jenis]} ·{' '}
                {formatRupiah(row.nominal)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        Rincian perhitungan & pengajuan termin:{' '}
        <Link to="/proyek/spk" className="font-bold text-blue-600 hover:underline">
          halaman SPK
        </Link>
        .
      </p>
    </div>
  );
};

export default SpkPembayaranMandorRingkasan;
