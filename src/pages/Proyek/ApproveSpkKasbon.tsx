import { Fragment, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLoader from '../PageLoader';
import Modal from '../../components/shared/Modal';
import { isBuktiPdfUrl } from '../../components/shared/BuktiFileThumbnail';
import { formatDate, formatRupiah } from '../../utils/formatters';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Filter,
} from 'lucide-react';
import {
  useApproveSpkPembayaran,
  useGetSpkPembayaranList,
} from '../../hooks/queries/useSpkPembayaran';
import { handleApiError } from '../../utils/errorHandler';
import {
  JENIS_UI_COLOR,
  SPK_KASBON_TARGET_LABEL,
  SPK_PEMBAYARAN_JENIS_LABEL,
} from '../../utils/spkPembayaran';
import KasbonGroupedTable from '../../components/proyek/KasbonGroupedTable';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';

interface SpkGroup {
  spkId: number;
  noSpk: string;
  judulPekerjaan: string;
  mandorUsername: string;
  nilaiKontrak: number;
  items: SpkPembayaranData[];
}

const thClass =
  'px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 whitespace-nowrap';
const tdClass = 'px-4 py-3 text-sm text-slate-800 align-middle border-b border-slate-100';

const getItemLabel = (row: SpkPembayaranData) => {
  if (row.jenis === 'KASBON') {
    const target = row.mengurangiTermin
      ? ` → ${SPK_KASBON_TARGET_LABEL[row.mengurangiTermin]}`
      : '';
    const itemCount = row.kasbonBaris?.length ?? 0;
    if (itemCount > 0) return `Kasbon ${itemCount} item${target}`;
    return `${row.keterangan ?? 'Kasbon'}${target}`;
  }
  if (row.jenis === 'UPAH') {
    const target = row.mengurangiTermin
      ? ` → ${SPK_KASBON_TARGET_LABEL[row.mengurangiTermin]}`
      : '';
    const periode =
      row.tanggalDari && row.tanggalSampai
        ? ` · ${formatDate(row.tanggalDari)}–${formatDate(row.tanggalSampai)}`
        : '';
    const tukangCount = row.upahBaris?.length ?? 0;
    return `Upah ${tukangCount} tukang${periode}${target}`;
  }
  return SPK_PEMBAYARAN_JENIS_LABEL[row.jenis];
};

const ApproveSpkKasbon = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [expandedSpkIds, setExpandedSpkIds] = useState<Set<number>>(new Set());
  const [detailRow, setDetailRow] = useState<SpkPembayaranData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const limit = 200;

  const { data: response, isLoading } = useGetSpkPembayaranList({
    page,
    limit,
    search: search || undefined,
    status: 'MENUNGGU_PERSETUJUAN',
  });

  const approveMutation = useApproveSpkPembayaran();

  const items = useMemo(
    () => (response?.items ?? []).filter((row) => row.status === 'MENUNGGU_PERSETUJUAN'),
    [response?.items],
  );
  const meta = response?.meta;

  const spkGroups = useMemo((): SpkGroup[] => {
    const map = new Map<number, SpkGroup>();
    for (const row of items) {
      const existing = map.get(row.spkId);
      if (existing) {
        existing.items.push(row);
      } else {
        map.set(row.spkId, {
          spkId: row.spkId,
          noSpk: row.spk?.noSpk ?? `#${row.spkId}`,
          judulPekerjaan: row.spk?.judulPekerjaan ?? '-',
          mandorUsername: row.spk?.mandor?.username ?? '-',
          nilaiKontrak: row.spk?.nilaiKontrak ?? 0,
          items: [row],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.noSpk.localeCompare(b.noSpk));
  }, [items]);

  const toggleExpand = (spkId: number) => {
    setExpandedSpkIds((prev) => {
      const next = new Set(prev);
      if (next.has(spkId)) next.delete(spkId);
      else next.add(spkId);
      return next;
    });
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchParams((prev) => {
      if (newSearch) prev.set('search', newSearch);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  };

  const handleApprove = async (row: SpkPembayaranData) => {
    const confirmed = window.confirm(
      `Setujui ${getItemLabel(row)} sebesar ${formatRupiah(row.nominal)}?\n\nPengajuan akan diteruskan ke finance untuk pembayaran.`,
    );
    if (!confirmed) return;
    try {
      await approveMutation.mutateAsync({ id: row.id });
      alert('Pengajuan berhasil disetujui dan diteruskan ke finance.');
      if (detailRow?.id === row.id) setDetailRow(null);
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  const renderItemRow = (row: SpkPembayaranData) => {
    const colors = JENIS_UI_COLOR[row.jenis];
    return (
      <tr key={row.id} className={`border-t border-slate-100 ${colors.row}`}>
        <td className={`px-4 py-2.5 text-sm font-bold ${colors.text} whitespace-nowrap`}>
          {SPK_PEMBAYARAN_JENIS_LABEL[row.jenis]}
        </td>
        <td className="px-4 py-2.5 text-xs text-slate-600">{getItemLabel(row)}</td>
        <td className={`px-4 py-2.5 text-sm font-bold ${colors.text}`}>
          {formatRupiah(row.nominal)}
        </td>
        <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(row.createdAt)}</td>
        <td className="px-4 py-2.5 text-xs text-slate-600">{row.diajukanOleh.username}</td>
        <td className="px-4 py-2.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDetailRow(row)}
              className="px-2.5 py-1 text-[9px] font-bold uppercase border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Detail
            </button>
            <button
              type="button"
              onClick={() => void handleApprove(row)}
              disabled={approveMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 size={11} />
              Approve
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Approve Pembayaran SPK</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review pengajuan termin, kasbon, dan upah dari mandor. Setelah disetujui, pengajuan
            akan muncul di halaman Finance → Bayar SPK.
          </p>
        </div>

        <div className="border-b border-slate-100">
          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between px-5 py-3 bg-slate-50"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Filter size={16} /> Filter
            </span>
            {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {isFilterExpanded && (
            <div className="p-4 flex items-center gap-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Cari SPK / Mandor
              </label>
              <input
                type="text"
                defaultValue={search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchChange((e.target as HTMLInputElement).value);
                }}
                placeholder="Tekan Enter untuk cari..."
                className="mt-1 w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          )}
        </div>

        {spkGroups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Tidak ada pengajuan pembayaran SPK yang menunggu persetujuan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className={`${thClass} w-10`} aria-label="Buka detail" />
                  <th className={thClass}>No. SPK</th>
                  <th className={thClass}>Judul Pekerjaan</th>
                  <th className={thClass}>Mandor</th>
                  <th className={thClass}>Nilai Kontrak</th>
                  <th className={`${thClass} text-center`}>Menunggu Approve</th>
                </tr>
              </thead>
              <tbody>
                {spkGroups.map((group) => {
                  const expanded = expandedSpkIds.has(group.spkId);
                  return (
                    <Fragment key={group.spkId}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          expanded ? 'bg-blue-50/80' : 'bg-white hover:bg-slate-50'
                        }`}
                        onClick={() => toggleExpand(group.spkId)}
                      >
                        <td className={tdClass}>
                          <ChevronRight
                            size={18}
                            className={`text-slate-400 transition-transform ${expanded ? 'rotate-90 text-blue-600' : ''}`}
                          />
                        </td>
                        <td className={`${tdClass} font-bold text-slate-900`}>{group.noSpk}</td>
                        <td className={`${tdClass} text-xs text-slate-600 max-w-[200px]`}>
                          <span className="line-clamp-2">{group.judulPekerjaan}</span>
                        </td>
                        <td className={`${tdClass} font-medium text-slate-700`}>
                          {group.mandorUsername}
                        </td>
                        <td className={`${tdClass} font-bold`}>
                          {formatRupiah(group.nilaiKontrak)}
                        </td>
                        <td className={`${tdClass} text-center`}>
                          <span className="inline-flex px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded-md">
                            {group.items.length}
                          </span>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="px-4 py-3 border-b border-slate-200">
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full min-w-[640px]">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                                    <th className="px-4 py-2 text-left">Jenis</th>
                                    <th className="px-4 py-2 text-left">Keterangan</th>
                                    <th className="px-4 py-2 text-left">Nominal</th>
                                    <th className="px-4 py-2 text-left">Diajukan</th>
                                    <th className="px-4 py-2 text-left">Oleh</th>
                                    <th className="px-4 py-2 text-left">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody>{group.items.map(renderItemRow)}</tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Halaman {meta.page} / {meta.totalPages}
            </span>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!detailRow}
        onClose={() => setDetailRow(null)}
        title={detailRow ? getItemLabel(detailRow) : 'Detail Pengajuan'}
        size="lg"
      >
        {detailRow && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">SPK</p>
                <p className="font-semibold text-black">{detailRow.spk?.noSpk}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Mandor</p>
                <p className="font-semibold text-black">{detailRow.spk?.mandor?.username}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Nominal</p>
                <p className="font-bold text-blue-700">{formatRupiah(detailRow.nominal)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Status</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded">
                  <Clock size={10} /> Menunggu Pengawas
                </span>
              </div>
            </div>

            {detailRow.jenis === 'KASBON' && detailRow.kasbonBaris && detailRow.kasbonBaris.length > 0 && (
              <KasbonGroupedTable
                baris={detailRow.kasbonBaris}
                onPreviewFoto={setPreviewUrl}
              />
            )}

            {detailRow.jenis === 'UPAH' && detailRow.upahBaris && detailRow.upahBaris.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                  Daftar Tukang
                </p>
                <div className="rounded-lg border border-teal-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-teal-50 text-[10px] font-bold text-teal-800 uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">NIK</th>
                        <th className="px-3 py-2 text-left">Nama</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRow.upahBaris.map((baris) => (
                        <tr key={baris.id} className="border-t border-teal-50">
                          <td className="px-3 py-2 font-mono text-black">{baris.nik}</td>
                          <td className="px-3 py-2 text-black">{baris.nama}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {detailRow.tanggalDari && detailRow.tanggalSampai && (
                  <p className="text-xs text-slate-500 mt-2">
                    Periode: {formatDate(detailRow.tanggalDari)} –{' '}
                    {formatDate(detailRow.tanggalSampai)}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleApprove(detailRow)}
              disabled={approveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              Approve & Ajukan ke Finance
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Foto Bon"
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
              <img src={previewUrl} alt="Foto bon" className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApproveSpkKasbon;
