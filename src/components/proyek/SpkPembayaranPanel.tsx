import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import Modal from '../shared/Modal';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../shared/BuktiFileThumbnail';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { handleApiError } from '../../utils/errorHandler';
import {
  useCreateSpkPembayaranRequest,
  useGetSpkPembayaranBySpk,
} from '../../hooks/queries/useSpkPembayaran';
import type { SpkData } from '../../services/spk.service';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';
import {
  SPK_PEMBAYARAN_JENIS_LABEL,
  calcSpkPembayaranNominal,
  canRequestSpkPembayaran,
  type SpkPembayaranJenis,
} from '../../utils/spkPembayaran';
import { buildSpkPembayaranKalkulasi } from '../../utils/spkPembayaranKalkulasi';

const JENIS_ORDER: SpkPembayaranJenis[] = ['TERMIN_55', 'TERMIN_100', 'RETENSI'];

const thClass =
  'px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase bg-slate-50 border border-slate-200 whitespace-nowrap';
const tdClass = 'px-2.5 py-1.5 border border-slate-200 text-xs text-slate-800 align-middle';

const KalkulasiSingkat = ({ jenis, spk }: { jenis: SpkPembayaranJenis; spk: SpkData }) => {
  const baris = buildSpkPembayaranKalkulasi(jenis, {
    nilaiKontrak: spk.nilaiKontrak,
    kasbonSebelumTermin2: spk.kasbonSebelumTermin2,
    kasbonSebelumTermin3: spk.kasbonSebelumTermin3,
  });

  return (
    <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5 text-[9px] text-slate-500 leading-tight min-w-[160px]">
      {baris.map((b) => (
        <div key={b.label} className="flex justify-between gap-2">
          <span className="text-left">{b.label}</span>
          <span
            className={`shrink-0 font-semibold tabular-nums ${
              b.tipe === 'negatif'
                ? 'text-red-600'
                : b.tipe === 'hasil'
                  ? 'text-indigo-600'
                  : 'text-slate-600'
            }`}
          >
            {b.tipe === 'negatif' ? '− ' : ''}
            {formatRupiah(b.nilai)}
          </span>
        </div>
      ))}
    </div>
  );
};

interface SpkPembayaranPanelProps {
  spk: SpkData;
  canAjukan: boolean;
}

const SpkPembayaranPanel = ({ spk, canAjukan }: SpkPembayaranPanelProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { data: pembayaranList = [], isLoading } = useGetSpkPembayaranBySpk(spk.id);
  const createMutation = useCreateSpkPembayaranRequest();

  const statusRows = pembayaranList.map((p) => ({
    jenis: p.jenis,
    status: p.status,
  }));

  const spkInput = {
    nilaiKontrak: spk.nilaiKontrak,
    kasbonSebelumTermin2: spk.kasbonSebelumTermin2,
    kasbonSebelumTermin3: spk.kasbonSebelumTermin3,
    progress: Number(spk.progress ?? 0),
  };

  const handleAjukan = async (jenis: SpkPembayaranJenis) => {
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }
    if (
      !window.confirm(
        `Ajukan pembayaran ${SPK_PEMBAYARAN_JENIS_LABEL[jenis]} sebesar ${formatRupiah(check.nominal)}?`,
      )
    ) {
      return;
    }
    try {
      await createMutation.mutateAsync({ spkId: spk.id, jenis });
      alert('Pengajuan pembayaran berhasil dikirim ke finance.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };



  const renderStatus = (existing: SpkPembayaranData | undefined, jenis: SpkPembayaranJenis) => {
    if (existing) {
      const paid = existing.status === 'SUDAH_DIBAYAR';
      return (
        <span
          className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
            paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {paid ? 'Terbayar' : 'Menunggu'}
        </span>
      );
    }
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows);
    if (!canAjukan) {
      return <span className="text-slate-400 text-[10px]">Belum diajukan</span>;
    }
    if (!check.allowed) {
      return (
        <span className="text-[10px] text-amber-700" title={check.reason}>
          Belum bisa
        </span>
      );
    }
    return <span className="text-[10px] text-slate-500">Siap diajukan</span>;
  };

  const renderAksi = (existing: SpkPembayaranData | undefined, jenis: SpkPembayaranJenis) => {
    if (existing || !canAjukan) return null;
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows);
    return (
      <div className="flex flex-col items-start gap-0.5">
        <button
          type="button"
          disabled={!check.allowed || createMutation.isPending}
          title={check.reason}
          onClick={() => handleAjukan(jenis)}
          className="px-2.5 py-1 text-[10px] font-bold rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 whitespace-nowrap"
        >
          Ajukan
        </button>
        {!check.allowed && check.reason && (
          <span className="text-[9px] text-amber-700 max-w-[140px] leading-tight">{check.reason}</span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        Memuat pembayaran...
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className={thClass}>Termin</th>
              <th className={thClass}>Nominal</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} w-16`}>Bukti</th>
              <th className={`${thClass} w-24`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {JENIS_ORDER.map((jenis) => {
              const existing = pembayaranList.find((p) => p.jenis === jenis);
              const nominal = calcSpkPembayaranNominal(jenis, spkInput);
              return (
                <tr key={jenis} className="bg-white hover:bg-slate-50/80">
                  <td className={`${tdClass} font-semibold whitespace-nowrap`}>
                    {SPK_PEMBAYARAN_JENIS_LABEL[jenis]}
                  </td>
                  <td className={tdClass}>
                    <p className="font-bold text-indigo-700 whitespace-nowrap">
                      {formatRupiah(existing?.nominal ?? nominal)}
                    </p>
                    <KalkulasiSingkat jenis={jenis} spk={spk} />
                  </td>
                  <td className={tdClass}>{renderStatus(existing, jenis)}</td>
                  <td className={tdClass}>
                    {existing?.buktiPembayaran ? (
                      <BuktiFileThumbnail
                        url={existing.buktiPembayaran}
                        onClick={() => setPreviewUrl(existing.buktiPembayaran!)}
                        className="w-10 h-7"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className={tdClass}>{renderAksi(existing, jenis)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Bukti Pembayaran"
        size="lg"
      >
        {previewUrl && (
          <div className="flex justify-center">
            {isBuktiPdfUrl(previewUrl) ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 text-red-600 font-bold"
              >
                <FileText size={48} />
                Buka PDF
              </a>
            ) : (
              <img src={previewUrl} alt="Bukti pembayaran" className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default SpkPembayaranPanel;
