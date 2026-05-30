import { Fragment, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLoader from '../PageLoader';
import Modal from '../../components/shared/Modal';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../../components/shared/BuktiFileThumbnail';
import { formatDate, formatRupiah } from '../../utils/formatters';
import {
  Clock,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  UploadCloud,
  FileText,
  FileDown,
  Landmark,
  Undo2,
} from 'lucide-react';
import BsiBatchPaymentPreviewModal from '../../components/finance/BsiBatchPaymentPreviewModal';
import {
  BSI_DEFAULT_SOURCE_ACCOUNT,
  buildBsiBatchRows,
  createDefaultBsiBatchHeader,
  type BsiBatchHeader,
  type BsiBatchPaymentRow,
} from '../../utils/bsiBatchPayment';
import {
  useBayarSpkPembayaran,
  useGetSpkPembayaranList,
  useSetBsiCmsDilaporkan,
} from '../../hooks/queries/useSpkPembayaran';
import { handleApiError } from '../../utils/errorHandler';
import {
  SPK_KASBON_TARGET_LABEL,
  SPK_PEMBAYARAN_JENIS_LABEL,
  JENIS_UI_COLOR,
  type SpkPembayaranJenis,
} from '../../utils/spkPembayaran';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';

interface SpkGroup {
  spkId: number;
  noSpk: string;
  judulPekerjaan: string;
  mandorUsername: string;
  ksoFull: string | null;
  nilaiKontrak: number;
  items: SpkPembayaranData[];
  menungguCount: number;
}

const thParentClass =
  'px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 whitespace-nowrap';
const tdParentClass = 'px-4 py-3 text-sm text-slate-800 align-middle border-b border-slate-100';

const getItemLabel = (row: SpkPembayaranData) => {
  if (row.jenis === 'KASBON') {
    const target = row.mengurangiTermin
      ? ` → ${SPK_KASBON_TARGET_LABEL[row.mengurangiTermin]}`
      : '';
    return `${row.keterangan ?? 'Kasbon'}${target}`;
  }
  return SPK_PEMBAYARAN_JENIS_LABEL[row.jenis];
};

const formatKsoShortLabel = (atasNama: string) =>
  atasNama.trim().split(/\s+/).pop() ?? atasNama;

const BayarSpkPembayaran = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<SpkPembayaranData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [expandedSpkIds, setExpandedSpkIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bsiPreviewOpen, setBsiPreviewOpen] = useState(false);
  const [bsiPreviewRows, setBsiPreviewRows] = useState<BsiBatchPaymentRow[]>([]);
  const [bsiPreviewHeader, setBsiPreviewHeader] = useState<BsiBatchHeader>(
    createDefaultBsiBatchHeader(),
  );

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const limit = 200;

  const { data: response, isLoading } = useGetSpkPembayaranList({
    page,
    limit,
    search: search || undefined,
    status: statusFilter === 'ALL' ? 'ALL' : (statusFilter as 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR'),
  });

  const items = response?.items ?? [];
  const meta = response?.meta;
  const bayarMutation = useBayarSpkPembayaran();
  const bsiCmsMutation = useSetBsiCmsDilaporkan();

  const spkGroups = useMemo((): SpkGroup[] => {
    const map = new Map<number, SpkGroup>();
    for (const row of items) {
      const existing = map.get(row.spkId);
      if (existing) {
        existing.items.push(row);
        if (row.status === 'MENUNGGU_PEMBAYARAN') existing.menungguCount += 1;
      } else {
        map.set(row.spkId, {
          spkId: row.spkId,
          noSpk: row.spk?.noSpk ?? `#${row.spkId}`,
          judulPekerjaan: row.spk?.judulPekerjaan ?? '-',
          mandorUsername: row.spk?.mandor?.username ?? '-',
          ksoFull: row.spk?.bankRekeningPt?.atasNama ?? null,
          nilaiKontrak: row.spk?.nilaiKontrak ?? 0,
          items: [row],
          menungguCount: row.status === 'MENUNGGU_PEMBAYARAN' ? 1 : 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.noSpk.localeCompare(b.noSpk));
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((row) => selectedIds.has(row.id)),
    [items, selectedIds],
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (groupItems: SpkPembayaranData[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const row of groupItems) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedBsiReportedCount = useMemo(
    () => selectedItems.filter((row) => row.bsiCmsDilaporkan).length,
    [selectedItems],
  );

  const handleMarkBsiCmsDilaporkan = async (ids: number[]) => {
    if (ids.length === 0) return;
    try {
      await bsiCmsMutation.mutateAsync({ ids, dilaporkan: true });
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  const handleUnmarkBsiCmsDilaporkan = async () => {
    const ids = selectedItems.filter((row) => row.bsiCmsDilaporkan).map((row) => row.id);
    if (ids.length === 0) return;
    try {
      await bsiCmsMutation.mutateAsync({ ids, dilaporkan: false });
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  const openBsiBatchPreview = () => {
    if (selectedItems.length === 0) return;
    const rows = buildBsiBatchRows(selectedItems, {
      sourceAcct: BSI_DEFAULT_SOURCE_ACCOUNT,
    });
    setBsiPreviewRows(rows);
    setBsiPreviewHeader(createDefaultBsiBatchHeader());
    setBsiPreviewOpen(true);
  };

  const toggleExpand = (spkId: number) => {
    setExpandedSpkIds((prev) => {
      const next = new Set(prev);
      if (next.has(spkId)) next.delete(spkId);
      else next.add(spkId);
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
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

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      prev.set('status', e.target.value);
      prev.set('page', '1');
      return prev;
    });
  };

  const openUpload = (row: SpkPembayaranData) => {
    setUploadTarget(row);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadTarget) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Hanya file gambar dan PDF yang diperbolehkan.');
      return;
    }

    try {
      await bayarMutation.mutateAsync({ id: uploadTarget.id, file });
      alert('Pembayaran SPK berhasil diproses.');
    } catch (error) {
      alert(handleApiError(error).message);
    } finally {
      setUploadTarget(null);
    }
  };

  const renderItemRow = (row: SpkPembayaranData) => {
    const colors = JENIS_UI_COLOR[row.jenis];
    const paid = row.status === 'SUDAH_DIBAYAR';
    const checked = selectedIds.has(row.id);

    return (
      <tr
        key={row.id}
        className={`border-t border-slate-100 ${colors.row} ${row.bsiCmsDilaporkan ? 'ring-1 ring-inset ring-sky-200' : ''}`}
      >
        <td className="px-4 py-2.5 w-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleSelect(row.id)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            aria-label={`Pilih pembayaran ${getItemLabel(row)}`}
          />
        </td>
        <td className="px-4 py-2.5">
          <span
            className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${colors.badge}`}
          >
            {row.jenis === 'KASBON' ? 'Kasbon' : row.jenis.replace('_', ' ')}
          </span>
        </td>
        <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[240px]">
          {getItemLabel(row)}
        </td>
        <td className={`px-4 py-2.5 text-sm font-bold ${colors.text} whitespace-nowrap`}>
          {formatRupiah(row.nominal)}
        </td>
        <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(row.createdAt)}</td>
        <td className="px-4 py-2.5">
          <div className="flex flex-col gap-1">
            {paid ? (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-green-100 text-green-700 rounded w-fit">
                <CheckCircle2 size={10} /> Terbayar
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-yellow-100 text-yellow-700 rounded w-fit">
                <Clock size={10} /> Menunggu
              </span>
            )}
            {row.bsiCmsDilaporkan && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-sky-100 text-sky-800 rounded w-fit"
                title={
                  row.bsiCmsDilaporkanAt
                    ? `Dilaporkan BSI CMS: ${formatDate(row.bsiCmsDilaporkanAt)}`
                    : 'Sudah dilaporkan di BSI CMS'
                }
              >
                <Landmark size={10} /> BSI CMS
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5">
          {row.buktiPembayaran ? (
            <BuktiFileThumbnail
              url={row.buktiPembayaran}
              onClick={() => setPreviewUrl(row.buktiPembayaran!)}
              className="w-12 h-8"
            />
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          )}
        </td>
        <td className="px-4 py-2.5">
          {!paid && (
            <button
              type="button"
              onClick={() => openUpload(row)}
              disabled={bayarMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase bg-slate-900 text-white rounded-lg hover:bg-black disabled:opacity-50 whitespace-nowrap"
            >
              <UploadCloud size={11} />
              Bayar
            </button>
          )}
        </td>
      </tr>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase">
        {(Object.keys(JENIS_UI_COLOR) as SpkPembayaranJenis[]).map((jenis) => (
          <span
            key={jenis}
            className={`inline-flex px-2 py-1 rounded border ${JENIS_UI_COLOR[jenis].badge}`}
          >
            {jenis === 'KASBON' ? 'Kasbon' : jenis.replace('_', ' ')}
          </span>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter size={16} /> Filter
          </span>
          {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isFilterExpanded && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="ALL">Semua</option>
                <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
                <option value="SUDAH_DIBAYAR">Sudah Dibayar</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Cari SPK / Mandor</label>
              <input
                type="text"
                defaultValue={search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchChange((e.target as HTMLInputElement).value);
                }}
                placeholder="Tekan Enter untuk cari..."
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-indigo-900 text-white rounded-xl shadow-lg">
          <span className="text-sm font-semibold">
            {selectedIds.size} pembayaran dipilih
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 text-[10px] font-bold uppercase border border-white/30 rounded-lg hover:bg-white/10"
            >
              Hapus pilihan
            </button>
            {selectedBsiReportedCount > 0 && (
              <button
                type="button"
                onClick={handleUnmarkBsiCmsDilaporkan}
                disabled={bsiCmsMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase border border-white/30 rounded-lg hover:bg-white/10 disabled:opacity-50"
              >
                <Undo2 size={14} />
                Batalkan lapor BSI CMS
                {selectedBsiReportedCount < selectedIds.size
                  ? ` (${selectedBsiReportedCount})`
                  : ''}
              </button>
            )}
            <button
              type="button"
              onClick={openBsiBatchPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-white text-indigo-900 rounded-lg hover:bg-indigo-50"
            >
              <FileDown size={14} />
              Convert to BSI Batch Payment
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Pembayaran SPK</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik baris pada tabel untuk membuka detail termin, retensi, dan kasbon. Centang baris
            pembayaran untuk generate file batch BSI.
          </p>
        </div>

        {spkGroups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Tidak ada data pembayaran.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className={`${thParentClass} w-10`} aria-label="Buka detail" />
                  <th className={thParentClass}>No. SPK</th>
                  <th className={thParentClass}>Judul Pekerjaan</th>
                  <th className={thParentClass}>Mandor</th>
                  <th className={thParentClass}>KSO</th>
                  <th className={thParentClass}>Nilai Kontrak</th>
                  <th className={`${thParentClass} text-center`}>Menunggu Bayar</th>
                  <th className={`${thParentClass} text-center`}>Total Item</th>
                </tr>
              </thead>
              <tbody>
                {spkGroups.map((group) => {
                  const expanded = expandedSpkIds.has(group.spkId);
                  const groupAllSelected =
                    group.items.length > 0 &&
                    group.items.every((item) => selectedIds.has(item.id));
                  const groupSomeSelected =
                    !groupAllSelected &&
                    group.items.some((item) => selectedIds.has(item.id));
                  return (
                    <Fragment key={group.spkId}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          expanded ? 'bg-indigo-50/80' : 'bg-white hover:bg-slate-50'
                        }`}
                        onClick={() => toggleExpand(group.spkId)}
                      >
                        <td className={tdParentClass}>
                          <ChevronRight
                            size={18}
                            className={`text-slate-400 transition-transform ${expanded ? 'rotate-90 text-indigo-600' : ''}`}
                          />
                        </td>
                        <td className={`${tdParentClass} font-bold text-slate-900 whitespace-nowrap`}>
                          {group.noSpk}
                        </td>
                        <td className={`${tdParentClass} text-xs text-slate-600 max-w-[200px]`}>
                          <span className="line-clamp-2" title={group.judulPekerjaan}>
                            {group.judulPekerjaan}
                          </span>
                        </td>
                        <td className={`${tdParentClass} font-medium text-slate-700 whitespace-nowrap`}>
                          {group.mandorUsername}
                        </td>
                        <td
                          className={`${tdParentClass} text-xs font-medium text-slate-700 whitespace-nowrap`}
                          title={group.ksoFull ?? undefined}
                        >
                          {group.ksoFull ? (
                            formatKsoShortLabel(group.ksoFull)
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className={`${tdParentClass} font-bold text-slate-900 whitespace-nowrap`}>
                          {formatRupiah(group.nilaiKontrak)}
                        </td>
                        <td className={`${tdParentClass} text-center`}>
                          {group.menungguCount > 0 ? (
                            <span className="inline-flex px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded-md">
                              {group.menungguCount}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className={`${tdParentClass} text-center text-xs font-semibold text-slate-600`}>
                          {group.items.length}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={8} className="px-4 py-3 border-b border-slate-200">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">
                              Detail pembayaran — {group.noSpk}
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full min-w-[760px]">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                                    <th className="px-4 py-2 w-10" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={groupAllSelected}
                                        ref={(el) => {
                                          if (el) el.indeterminate = groupSomeSelected;
                                        }}
                                        onChange={(e) =>
                                          toggleSelectGroup(group.items, e.target.checked)
                                        }
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        aria-label={`Pilih semua pembayaran ${group.noSpk}`}
                                      />
                                    </th>
                                    <th className="px-4 py-2 text-left">Jenis</th>
                                    <th className="px-4 py-2 text-left">Keterangan / Termin</th>
                                    <th className="px-4 py-2 text-left">Nominal</th>
                                    <th className="px-4 py-2 text-left">Tanggal Diajukan</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Bukti</th>
                                    <th className="px-4 py-2 text-left">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.items
                                    .sort((a, b) => {
                                      const order: Record<string, number> = {
                                        KASBON: 0,
                                        TERMIN_55: 1,
                                        TERMIN_100: 2,
                                        RETENSI: 3,
                                      };
                                      return (
                                        (order[a.jenis] ?? 9) - (order[b.jenis] ?? 9) || a.id - b.id
                                      );
                                    })
                                    .map(renderItemRow)}
                                </tbody>
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
            <button
              type="button"
              disabled={!meta.hasPrevPage}
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="text-xs text-slate-500">
              Halaman {meta.page} / {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={!meta.hasNextPage}
              onClick={() => handlePageChange(page + 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>

      <BsiBatchPaymentPreviewModal
        isOpen={bsiPreviewOpen}
        initialRows={bsiPreviewRows}
        initialHeader={bsiPreviewHeader}
        onClose={() => setBsiPreviewOpen(false)}
        onGenerated={handleMarkBsiCmsDilaporkan}
      />

      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Bukti Pembayaran SPK"
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
              <img src={previewUrl} alt="Bukti" className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BayarSpkPembayaran;
