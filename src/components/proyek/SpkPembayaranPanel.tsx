import { CheckCircle2, ExternalLink, FileText, Loader2 } from 'lucide-react';
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
  canRequestSpkPembayaran,
  type SpkPembayaranJenis,
} from '../../utils/spkPembayaran';
import { buildSpkPembayaranKalkulasi } from '../../utils/spkPembayaranKalkulasi';

const JENIS_ORDER: SpkPembayaranJenis[] = ['TERMIN_55', 'TERMIN_100', 'RETENSI'];

const KalkulasiNominal = ({ jenis, spk }: { jenis: SpkPembayaranJenis; spk: SpkData }) => {
  const baris = buildSpkPembayaranKalkulasi(jenis, {
    nilaiKontrak: spk.nilaiKontrak,
    kasbonSebelumTermin2: spk.kasbonSebelumTermin2,
    kasbonSebelumTermin3: spk.kasbonSebelumTermin3,
  });

  return (
    <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] space-y-1">
      <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Rincian perhitungan</p>
      {baris.map((b) => (
        <div key={b.label} className="flex justify-between gap-2">
          <span className="text-slate-600">{b.label}</span>
          <span
            className={`font-bold shrink-0 ${
              b.tipe === 'negatif'
                ? 'text-red-600'
                : b.tipe === 'hasil'
                  ? 'text-indigo-700'
                  : 'text-slate-800'
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

const BuktiPembayaranLink = ({ url }: { url: string }) => {
  const isPdf =
    url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-[10px] font-bold uppercase bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
    >
      {isPdf ? <FileText size={12} /> : <ExternalLink size={12} />}
      Lihat bukti pembayaran
    </a>
  );
};

const TerminPembayaranCard = ({
  jenis,
  spk,
  existing,
  canAjukan,
  onAjukan,
  isSubmitting,
}: {
  jenis: SpkPembayaranJenis;
  spk: SpkData;
  existing?: SpkPembayaranData;
  canAjukan: boolean;
  onAjukan: (jenis: SpkPembayaranJenis) => void;
  isSubmitting: boolean;
}) => {
  const spkInput = {
    nilaiKontrak: spk.nilaiKontrak,
    kasbonSebelumTermin2: spk.kasbonSebelumTermin2,
    kasbonSebelumTermin3: spk.kasbonSebelumTermin3,
    progress: Number(spk.progress ?? 0),
  };
  const check = canRequestSpkPembayaran(jenis, spkInput, existing ? [{ jenis: existing.jenis, status: existing.status }] : []);

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{SPK_PEMBAYARAN_JENIS_LABEL[jenis]}</p>

          {!existing && <KalkulasiNominal jenis={jenis} spk={spk} />}

          {existing && (
            <>
              <KalkulasiNominal jenis={jenis} spk={spk} />
              <p className="text-[10px] text-slate-500 mt-2">
                Diajukan {formatDate(existing.createdAt)} · {existing.diajukanOleh.username}
              </p>
            </>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {existing ? (
            <span
              className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                existing.status === 'SUDAH_DIBAYAR'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {existing.status === 'SUDAH_DIBAYAR' ? 'Sudah Dibayar' : 'Menunggu Pembayaran'}
            </span>
          ) : canAjukan ? (
            <button
              type="button"
              disabled={!check.allowed || isSubmitting}
              title={check.reason}
              onClick={() => onAjukan(jenis)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ajukan Pembayaran
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Belum diajukan</span>
          )}
        </div>
      </div>

      {existing?.status === 'SUDAH_DIBAYAR' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-800">
                Termin ini sudah dibayar finance
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Nominal dibayar: {formatRupiah(existing.nominal)}
                {existing.tanggalPembayaran &&
                  ` · ${formatDate(existing.tanggalPembayaran)}`}
                {existing.dibayarOleh && ` · oleh ${existing.dibayarOleh.username}`}
              </p>
              {existing.buktiPembayaran && (
                <BuktiPembayaranLink url={existing.buktiPembayaran} />
              )}
            </div>
          </div>
        </div>
      )}

      {existing?.status === 'MENUNGGU_PEMBAYARAN' && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Pengajuan menunggu proses finance. Setelah dibayar, status dan bukti transfer akan
          tampil di sini.
        </p>
      )}
    </div>
  );
};

interface SpkPembayaranPanelProps {
  spk: SpkData;
  canAjukan: boolean;
}

const SpkPembayaranPanel = ({ spk, canAjukan }: SpkPembayaranPanelProps) => {
  const { data: pembayaranList = [], isLoading } = useGetSpkPembayaranBySpk(spk.id);
  const createMutation = useCreateSpkPembayaranRequest();

  const statusRows = pembayaranList.map((p) => ({
    jenis: p.jenis,
    status: p.status,
  }));

  const handleAjukan = async (jenis: SpkPembayaranJenis) => {
    const check = canRequestSpkPembayaran(
      jenis,
      {
        nilaiKontrak: spk.nilaiKontrak,
        kasbonSebelumTermin2: spk.kasbonSebelumTermin2,
        kasbonSebelumTermin3: spk.kasbonSebelumTermin3,
        progress: Number(spk.progress ?? 0),
      },
      statusRows,
    );
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" />
        Memuat data pembayaran...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase">
        Pengajuan Pembayaran ke Developer
      </p>
      <p className="text-xs text-slate-500 leading-relaxed">
        Setelah finance membayar, status termin dan bukti transfer tampil di kartu termin di bawah.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {JENIS_ORDER.map((jenis) => (
          <TerminPembayaranCard
            key={jenis}
            jenis={jenis}
            spk={spk}
            existing={pembayaranList.find((p) => p.jenis === jenis)}
            canAjukan={canAjukan}
            onAjukan={handleAjukan}
            isSubmitting={createMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
};

export default SpkPembayaranPanel;
