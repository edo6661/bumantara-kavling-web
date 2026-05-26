import { useState } from 'react';
import { FileText, Loader2, Plus } from 'lucide-react';
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
  SPK_KASBON_TARGET_LABEL,
  SPK_PEMBAYARAN_JENIS_LABEL,
  JENIS_UI_COLOR,
  calcSpkPembayaranNominal,
  canRequestKasbon,
  canRequestSpkPembayaran,
  type SpkPembayaranJenis,
  type SpkTerminPembayaranJenis,
} from '../../utils/spkPembayaran';
import { buildSpkPembayaranKalkulasi } from '../../utils/spkPembayaranKalkulasi';

const TERMIN_JENIS_ORDER: SpkTerminPembayaranJenis[] = ['TERMIN_55', 'TERMIN_100', 'RETENSI'];

const thClass =
  'px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase bg-slate-50 border border-slate-200 whitespace-nowrap';
const tdClass = 'px-2.5 py-1.5 border border-slate-200 text-xs text-slate-800 align-middle';

const toCalcRows = (list: SpkPembayaranData[]) =>
  list.map((p) => ({
    jenis: p.jenis,
    status: p.status,
    nominal: p.nominal,
    mengurangiTermin: p.mengurangiTermin,
  }));

const KalkulasiSingkat = ({
  jenis,
  spk,
  pembayaranList,
}: {
  jenis: SpkTerminPembayaranJenis;
  spk: SpkData;
  pembayaranList: SpkPembayaranData[];
}) => {
  const baris = buildSpkPembayaranKalkulasi(
    jenis,
    { nilaiKontrak: spk.nilaiKontrak },
    toCalcRows(pembayaranList),
  );

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
  const [kasbonModalOpen, setKasbonModalOpen] = useState(false);
  const [kasbonKeterangan, setKasbonKeterangan] = useState('');
  const [kasbonNominal, setKasbonNominal] = useState('');

  const { data: pembayaranList = [], isLoading } = useGetSpkPembayaranBySpk(spk.id);
  const createMutation = useCreateSpkPembayaranRequest();

  const calcRows = toCalcRows(pembayaranList);
  const statusRows = pembayaranList.map((p) => ({
    jenis: p.jenis,
    status: p.status,
    nominal: p.nominal,
    mengurangiTermin: p.mengurangiTermin,
  }));

  const spkInput = {
    nilaiKontrak: spk.nilaiKontrak,
    progress: Number(spk.progress ?? 0),
  };

  const kasbonItems = pembayaranList.filter((p) => p.jenis === 'KASBON');
  const kasbonCheck = canRequestKasbon(statusRows);

  const handleAjukanTermin = async (jenis: SpkTerminPembayaranJenis) => {
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
      await createMutation.mutateAsync({ spkId: spk.id, body: { jenis } });
      alert('Pengajuan pembayaran berhasil dikirim ke finance.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleAjukanKasbon = async () => {
    const nominal = Number(kasbonNominal.replace(/\D/g, ''));
    if (!kasbonKeterangan.trim()) {
      alert('Keterangan kasbon wajib diisi.');
      return;
    }
    if (!nominal || nominal <= 0) {
      alert('Nominal kasbon harus lebih dari 0.');
      return;
    }
    if (!kasbonCheck.allowed) {
      alert(kasbonCheck.reason);
      return;
    }
    const targetLabel = kasbonCheck.targetTermin
      ? SPK_KASBON_TARGET_LABEL[kasbonCheck.targetTermin]
      : '';
    if (
      !window.confirm(
        `Ajukan kasbon ${formatRupiah(nominal)}?\nKeterangan: ${kasbonKeterangan.trim()}\nMengurangi: ${targetLabel}`,
      )
    ) {
      return;
    }
    try {
      await createMutation.mutateAsync({
        spkId: spk.id,
        body: { jenis: 'KASBON', keterangan: kasbonKeterangan.trim(), nominal },
      });
      setKasbonModalOpen(false);
      setKasbonKeterangan('');
      setKasbonNominal('');
      alert('Pengajuan kasbon berhasil dikirim ke finance.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const renderStatus = (
    existing: SpkPembayaranData | undefined,
    jenis: SpkTerminPembayaranJenis,
  ) => {
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

  const renderTerminAksi = (
    existing: SpkPembayaranData | undefined,
    jenis: SpkTerminPembayaranJenis,
  ) => {
    if (existing || !canAjukan) return null;
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows);
    return (
      <div className="flex flex-col items-start gap-0.5">
        <button
          type="button"
          disabled={!check.allowed || createMutation.isPending}
          title={check.reason}
          onClick={() => handleAjukanTermin(jenis)}
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

  const renderJenisBadge = (jenis: SpkPembayaranJenis, extra?: string) => (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${JENIS_UI_COLOR[jenis].badge}`}
    >
      {jenis === 'KASBON' ? 'Kasbon' : SPK_PEMBAYARAN_JENIS_LABEL[jenis].split('(')[0]?.trim()}
      {extra ? ` · ${extra}` : ''}
    </span>
  );

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
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Termin &amp; Retensi
        </p>
        {canAjukan && (
          <button
            type="button"
            disabled={!kasbonCheck.allowed || createMutation.isPending}
            title={kasbonCheck.reason}
            onClick={() => setKasbonModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40"
          >
            <Plus size={12} />
            Ajukan Kasbon
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 mb-3">
        <table className="w-full text-xs border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className={thClass}>Jenis</th>
              <th className={thClass}>Nominal</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} w-16`}>Bukti</th>
              <th className={`${thClass} w-24`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {TERMIN_JENIS_ORDER.map((jenis) => {
              const existing = pembayaranList.find((p) => p.jenis === jenis);
              const nominal = calcSpkPembayaranNominal(jenis, spkInput, calcRows);
              const colors = JENIS_UI_COLOR[jenis];
              return (
                <tr key={jenis} className={`hover:bg-slate-50/80 ${colors.row}`}>
                  <td className={tdClass}>
                    {renderJenisBadge(jenis)}
                  </td>
                  <td className={tdClass}>
                    <p className={`font-bold whitespace-nowrap ${colors.text}`}>
                      {formatRupiah(existing?.nominal ?? nominal)}
                    </p>
                    <KalkulasiSingkat jenis={jenis} spk={spk} pembayaranList={pembayaranList} />
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
                  <td className={tdClass}>{renderTerminAksi(existing, jenis)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {kasbonItems.length > 0 && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Kasbon ({kasbonItems.length})
          </p>
          <div className="overflow-x-auto rounded-lg border border-orange-200">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className={thClass}>Keterangan</th>
                  <th className={thClass}>Mengurangi</th>
                  <th className={thClass}>Nominal</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} w-16`}>Bukti</th>
                </tr>
              </thead>
              <tbody>
                {kasbonItems.map((row) => {
                  const paid = row.status === 'SUDAH_DIBAYAR';
                  return (
                    <tr key={row.id} className={JENIS_UI_COLOR.KASBON.row}>
                      <td className={`${tdClass} max-w-[200px]`}>
                        <span className="font-medium text-slate-800">{row.keterangan}</span>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {formatDate(row.createdAt)}
                        </p>
                      </td>
                      <td className={tdClass}>
                        {row.mengurangiTermin
                          ? SPK_KASBON_TARGET_LABEL[row.mengurangiTermin]
                          : '—'}
                      </td>
                      <td className={`${tdClass} font-bold ${JENIS_UI_COLOR.KASBON.text}`}>
                        {formatRupiah(row.nominal)}
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {paid ? 'Terbayar' : 'Menunggu'}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {row.buktiPembayaran ? (
                          <BuktiFileThumbnail
                            url={row.buktiPembayaran}
                            onClick={() => setPreviewUrl(row.buktiPembayaran!)}
                            className="w-10 h-7"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {kasbonCheck.targetTermin && canAjukan && (
        <p className="text-[10px] text-slate-500 mt-2">
          Kasbon berikutnya akan mengurangi{' '}
          <span className="font-semibold text-orange-700">
            {SPK_KASBON_TARGET_LABEL[kasbonCheck.targetTermin]}
          </span>
          .
        </p>
      )}

      <Modal
        isOpen={kasbonModalOpen}
        onClose={() => setKasbonModalOpen(false)}
        title="Ajukan Kasbon"
        size="md"
      >
        <div className="space-y-4">
          {kasbonCheck.targetTermin && (
            <p className="text-xs text-orange-800 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              Kasbon ini akan mengurangi nominal{' '}
              <strong>{SPK_KASBON_TARGET_LABEL[kasbonCheck.targetTermin]}</strong> (FIFO).
            </p>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan</label>
            <textarea
              value={kasbonKeterangan}
              onChange={(e) => setKasbonKeterangan(e.target.value)}
              className="text-black mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[72px]"
              placeholder="Contoh: Kasbon material bata & semen"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Nominal</label>
            <input
              type="text"
              inputMode="numeric"
              value={kasbonNominal}
              onChange={(e) => setKasbonNominal(e.target.value.replace(/[^\d]/g, ''))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
              placeholder="0"
            />
            {kasbonNominal && (
              <p className="text-xs text-slate-500 mt-1">{formatRupiah(Number(kasbonNominal))}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setKasbonModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={handleAjukanKasbon}
              className="px-4 py-2 text-sm font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Ajukan ke Finance
            </button>
          </div>
        </div>
      </Modal>

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
