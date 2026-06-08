import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileText,
  FileDown,
  Landmark,
  Undo2,
  RefreshCw,
} from 'lucide-react';
import BsiBatchPaymentPreviewModal from '../../components/finance/BsiBatchPaymentPreviewModal';
import {
  BSI_DEFAULT_SOURCE_ACCOUNT,
  buildNotarisBsiBatchRows,
  createDefaultBsiBatchHeader,
  type BsiBatchHeader,
  type BsiBatchPaymentRow,
} from '../../utils/bsiBatchPayment';
import {
  useBayarNotarisPembayaran,
  useGetNotarisPembayaranList,
  useSetNotarisBsiCmsDilaporkan,
  useSyncAllNotarisPembayaran,
} from '../../hooks/queries/useNotarisPembayaran';
import { handleApiError } from '../../utils/errorHandler';
import {
  NOTARIS_JENIS_UI_COLOR,
  NOTARIS_PEMBAYARAN_JENIS_LABEL,
  formatKavlingLabel,
  type NotarisPembayaranJenis,
} from '../../utils/notarisPembayaran';
import type { NotarisPembayaranData } from '../../services/notarisPembayaran.service';

interface PenjualanGroup {
  penjualanId: number;
  noTransaksi: string;
  customerNama: string;
  kavlingLabel: string;
  perumahanNama: string;
  notarisNama: string | null;
  items: NotarisPembayaranData[];
  menungguCount: number;
}

const thParentClass =
  'px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 whitespace-nowrap';
const tdParentClass = 'px-4 py-3 text-sm text-slate-800 align-middle border-b border-slate-100';

const JENIS_ORDER: Record<NotarisPembayaranJenis, number> = {
  BIAYA_NOTARIS: 0,
  BPHTB: 1,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const BayarNotarisPembayaran = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<NotarisPembayaranData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [expandedPenjualanIds, setExpandedPenjualanIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bsiPreviewOpen, setBsiPreviewOpen] = useState(false);
  const [bsiPreviewRows, setBsiPreviewRows] = useState<BsiBatchPaymentRow[]>([]);
  const [bsiPreviewHeader, setBsiPreviewHeader] = useState<BsiBatchHeader>(
    createDefaultBsiBatchHeader(),
  );

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;

  const { data: response, isLoading } = useGetNotarisPembayaranList({
    page,
    limit,
    search: search || undefined,
    status: statusFilter === 'ALL' ? 'ALL' : (statusFilter as 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR'),
  });

  const items = response?.items ?? [];
  const meta = response?.meta;
  const bayarMutation = useBayarNotarisPembayaran();
  const bsiCmsMutation = useSetNotarisBsiCmsDilaporkan();
  const syncAllMutation = useSyncAllNotarisPembayaran();

  const penjualanGroups = useMemo((): PenjualanGroup[] => {
    const map = new Map<number, PenjualanGroup>();
    for (const row of items) {
      const existing = map.get(row.penjualanId);
      if (existing) {
        existing.items.push(row);
        if (row.status === 'MENUNGGU_PEMBAYARAN') existing.menungguCount += 1;
      } else {
        const kavling = row.penjualan?.kavling;
        map.set(row.penjualanId, {
          penjualanId: row.penjualanId,
          noTransaksi: row.penjualan?.noTransaksi ?? `#${row.penjualanId}`,
          customerNama: row.penjualan?.customer?.nama ?? '-',
          kavlingLabel: kavling
            ? formatKavlingLabel(kavling.blok, kavling.nomorUnit)
            : '-',
          perumahanNama: kavling?.perumahan?.nama ?? '-',
          notarisNama: row.penjualan?.detailKavlingPajak?.notaris?.nama ?? null,
          items: [row],
          menungguCount: row.status === 'MENUNGGU_PEMBAYARAN' ? 1 : 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.noTransaksi.localeCompare(b.noTransaksi));
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

  const toggleSelectGroup = (groupItems: NotarisPembayaranData[], checked: boolean) => {
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
    const rows = buildNotarisBsiBatchRows(selectedItems, {
      sourceAcct: BSI_DEFAULT_SOURCE_ACCOUNT,
    });
    setBsiPreviewRows(rows);
    setBsiPreviewHeader(createDefaultBsiBatchHeader());
    setBsiPreviewOpen(true);
  };

  const toggleExpand = (penjualanId: number) => {
    setExpandedPenjualanIds((prev) => {
      const next = new Set(prev);
      if (next.has(penjualanId)) next.delete(penjualanId);
      else next.add(penjualanId);
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
    });
  };

  const handlePageSizeChange = (newLimit: number) => {
    setSearchParams((prev) => {
      if (newLimit === DEFAULT_PAGE_SIZE) prev.delete('limit');
      else prev.set('limit', String(newLimit));
      prev.set('page', '1');
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

  useEffect(() => {
    setExpandedPenjualanIds(new Set());
  }, [page, limit, search, statusFilter]);

  const totalPages = meta?.totalPages ?? 1;

  const pageNumbers = useMemo(() => {
    const delta = 1;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift('...');
    if (page + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  }, [page, totalPages]);

  const handleSyncAll = async () => {
    if (
      !window.confirm(
        'Sync semua pembayaran notaris/BPHTB dari data penjualan? Proses ini bisa memakan waktu beberapa menit.',
      )
    ) {
      return;
    }
    try {
      const message = await syncAllMutation.mutateAsync();
      alert(message);
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  const openUpload = (row: NotarisPembayaranData) => {
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
      alert('Pembayaran notaris berhasil diproses.');
    } catch (error) {
      alert(handleApiError(error).message);
    } finally {
      setUploadTarget(null);
    }
  };

  const renderItemRow = (row: NotarisPembayaranData) => {
    const colors = NOTARIS_JENIS_UI_COLOR[row.jenis];
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
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Pilih pembayaran ${NOTARIS_PEMBAYARAN_JENIS_LABEL[row.jenis]}`}
          />
        </td>
        <td className="px-4 py-2.5">
          <span
            className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${colors.badge}`}
          >
            {NOTARIS_PEMBAYARAN_JENIS_LABEL[row.jenis]}
          </span>
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
              title="Tambah Bukti"
              onClick={() => openUpload(row)}
              disabled={bayarMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase bg-slate-900 text-white rounded-lg hover:bg-black disabled:opacity-50 whitespace-nowrap"
            >
              <UploadCloud size={11} />
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
        {(Object.keys(NOTARIS_JENIS_UI_COLOR) as NotarisPembayaranJenis[]).map((jenis) => (
          <span
            key={jenis}
            className={`inline-flex px-2 py-1 rounded border ${NOTARIS_JENIS_UI_COLOR[jenis].badge}`}
          >
            {NOTARIS_PEMBAYARAN_JENIS_LABEL[jenis]}
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Cari transaksi / customer / notaris
              </label>
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
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-blue-900 text-white rounded-xl shadow-lg">
          <span className="text-sm font-semibold">{selectedIds.size} pembayaran dipilih</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-white text-blue-900 rounded-lg hover:bg-blue-50"
            >
              <FileDown size={14} />
              Convert to BSI Batch Payment
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Pembayaran Notaris</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Biaya notaris dan BPHTB muncul otomatis setelah nilainya diisi di progress penjualan.
              Centang baris pembayaran untuk generate file batch BSI ke rekening notaris.
            </p>
          </div>
          {/* TODO: hapus setelah backfill data selesai */}
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncAllMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase whitespace-nowrap border border-amber-300 bg-amber-50 text-amber-900 rounded-lg hover:bg-amber-100 disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={14} className={syncAllMutation.isPending ? 'animate-spin' : ''} />
            {syncAllMutation.isPending ? 'Sync...' : 'Sync Data'}
          </button>
        </div>

        {penjualanGroups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Tidak ada pembayaran notaris/BPHTB yang perlu diproses.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className={`${thParentClass} w-10`} aria-label="Buka detail" />
                  <th className={thParentClass}>Customer</th>
                  <th className={thParentClass}>Kavling</th>
                  <th className={thParentClass}>Notaris</th>
                  <th className={`${thParentClass} text-center`}>Menunggu Bayar</th>
                  <th className={`${thParentClass} text-center`}>Total Item</th>
                </tr>
              </thead>
              <tbody>
                {penjualanGroups.map((group) => {
                  const expanded = expandedPenjualanIds.has(group.penjualanId);
                  const groupAllSelected =
                    group.items.length > 0 &&
                    group.items.every((item) => selectedIds.has(item.id));
                  const groupSomeSelected =
                    !groupAllSelected && group.items.some((item) => selectedIds.has(item.id));
                  return (
                    <Fragment key={group.penjualanId}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          expanded ? 'bg-blue-50/80' : 'bg-white hover:bg-slate-50'
                        }`}
                        onClick={() => toggleExpand(group.penjualanId)}
                      >
                        <td className={tdParentClass}>
                          <ChevronRight
                            size={18}
                            className={`text-slate-400 transition-transform ${expanded ? 'rotate-90 text-blue-600' : ''}`}
                          />
                        </td>
                    
                        <td className={`${tdParentClass} font-medium text-slate-700 whitespace-nowrap`}>
                          {group.customerNama}
                        </td>
                        <td className={`${tdParentClass} text-xs text-slate-600 whitespace-nowrap`}>
                          <span title={group.perumahanNama}>{group.kavlingLabel}</span>
                        </td>
                        <td className={`${tdParentClass} text-xs font-medium text-slate-700 whitespace-nowrap`}>
                          {group.notarisNama ?? (
                            <span className="text-amber-600 italic">Belum diisi</span>
                          )}
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
                          <td colSpan={7} className="px-4 py-3 border-b border-slate-200">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">
                              Detail pembayaran — {group.noTransaksi}
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full min-w-[680px]">
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
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        aria-label={`Pilih semua pembayaran ${group.noTransaksi}`}
                                      />
                                    </th>
                                    <th className="px-4 py-2 text-left">Jenis</th>
                                    <th className="px-4 py-2 text-left">Nominal</th>
                                    <th className="px-4 py-2 text-left">Tanggal Dibuat</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Bukti</th>
                                    <th className="px-4 py-2 text-left">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.items
                                    .sort(
                                      (a, b) =>
                                        JENIS_ORDER[a.jenis] - JENIS_ORDER[b.jenis] || a.id - b.id,
                                    )
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

        {meta && (totalPages > 1 || penjualanGroups.length > 0) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 border-t border-slate-100 bg-white">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-semibold text-slate-500">
                Halaman {page} dari {totalPages}
                {meta.totalItems > 0 && (
                  <span className="text-slate-400 font-normal">
                    {' '}
                    · {meta.totalItems} pembayaran
                  </span>
                )}
              </span>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="whitespace-nowrap">Per halaman</span>
                <select
                  value={limit}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm"
                  aria-label="Jumlah data per halaman"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                {pageNumbers.map((num, idx) =>
                  num === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold">
                      ...
                    </span>
                  ) : (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePageChange(num as number)}
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        page === num
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <BsiBatchPaymentPreviewModal
        isOpen={bsiPreviewOpen}
        initialRows={bsiPreviewRows}
        initialHeader={bsiPreviewHeader}
        onClose={() => setBsiPreviewOpen(false)}
        onGenerated={handleMarkBsiCmsDilaporkan}
        referenceColumnLabel="Transaksi"
      />

      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Bukti Pembayaran Notaris"
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

export default BayarNotarisPembayaran;
