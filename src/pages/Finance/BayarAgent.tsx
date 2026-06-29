import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageSummaryCard from '../../components/shared/PageSummaryCard';
import { summarizePaymentQueue } from '../../utils/pageSummaries';
import PageLoader from '../PageLoader';
import Modal from '../../components/shared/Modal';
import PasteUploadBanner from '../../components/shared/PasteUploadBanner';
import BuktiFileThumbnail from '../../components/shared/BuktiFileThumbnail';
import { formatDate, formatTanpaDesimal } from '../../utils/formatters';
import { isUploadableFile } from '../../utils/clipboardFilePaste';
import { useRowPasteUpload } from '../../hooks/useRowPasteUpload';
import {
  Clock,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Users,
  Wallet,
} from 'lucide-react';
import {
  useBayarAgentPencairan,
  useGetAgentPencairanList,
} from '../../hooks/queries/useAgentPencairan';
import { handleApiError } from '../../utils/errorHandler';
import type { AgentPencairanData } from '../../services/agentPencairan.service';
import { getAgentPencairanInvoiceUrls } from '../../utils/agentPencairanInvoice';

const thClass =
  'px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 whitespace-nowrap';
const tdClass = 'px-4 py-3 text-sm text-slate-800 align-middle border-b border-slate-100';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const formatKavlingLabel = (blok: string, nomorUnit: string) =>
  `${blok} ${nomorUnit}`;

const formatKsoShortLabel = (atasNama: string) =>
  atasNama.trim().split(/\s+/).pop() ?? atasNama;

const getKsoFull = (row: AgentPencairanData) =>
  row.penjualan?.kavling?.rekeningTujuan?.atasNama ?? null;

const BayarAgent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<AgentPencairanData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusParam = searchParams.get('status');
  const statusFilter =
    statusParam === 'ALL' || statusParam === 'SUDAH_DIBAYAR' ? statusParam : 'MENUNGGU_PEMBAYARAN';
  const showTanggalBayar = statusFilter !== 'MENUNGGU_PEMBAYARAN';
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;

  const { data: response, isLoading } = useGetAgentPencairanList({
    page,
    limit,
    search: search || undefined,
    status: statusFilter,
  });

  const items = response?.items ?? [];
  const meta = response?.meta;

  const { data: summaryResponse } = useGetAgentPencairanList({
    page: 1,
    limit: 500,
    status: 'ALL',
  });
  const agentPaymentSummary = useMemo(
    () =>
      summarizePaymentQueue(
        summaryResponse?.items ?? [],
        'MENUNGGU_PEMBAYARAN',
        'SUDAH_DIBAYAR',
      ),
    [summaryResponse?.items],
  );

  const bayarMutation = useBayarAgentPencairan();

  const processUpload = useCallback(
    async (row: AgentPencairanData, file: File): Promise<boolean> => {
      if (!isUploadableFile(file)) {
        alert('Hanya file gambar dan PDF yang diperbolehkan.');
        return false;
      }

      try {
        await bayarMutation.mutateAsync({ id: row.id, file });
        alert('Pembayaran agent berhasil diproses.');
        return true;
      } catch (error) {
        alert(handleApiError(error).message);
        return false;
      }
    },
    [bayarMutation],
  );

  const onPasteFiles = useCallback(
    async (row: AgentPencairanData, files: File[]) => processUpload(row, files[0]!),
    [processUpload],
  );

  const {
    pasteTarget,
    selectRow,
    clearSelection: clearPasteSelection,
    getRowClassName,
  } = useRowPasteUpload<AgentPencairanData>({
    canSelect: (row) => row.status === 'MENUNGGU_PEMBAYARAN',
    onPasteFiles,
  });

  const menungguCount = useMemo(
    () => items.filter((row) => row.status === 'MENUNGGU_PEMBAYARAN').length,
    [items],
  );

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
      const value = e.target.value;
      if (!value) prev.delete('status');
      else prev.set('status', value);
      prev.set('page', '1');
      return prev;
    });
  };

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

  const openUpload = (row: AgentPencairanData) => {
    selectRow(row);
    setUploadTarget(row);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadTarget) return;

    const ok = await processUpload(uploadTarget, file);
    if (ok) clearPasteSelection();
    setUploadTarget(null);
  };

  const pasteBannerLabel = pasteTarget
    ? `${pasteTarget.agent?.nama ?? 'Agent'} · ${pasteTarget.penjualan?.customer?.nama ?? '-'} · ${formatTanpaDesimal(pasteTarget.totalNominal)}`
    : '';

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageSummaryCard
        title="Ringkasan Bayar Agent"
        subtitle="Antrian pembayaran fee marketing dan closing agent"
        headerIcon={Users}
        items={[
          { value: agentPaymentSummary.total, label: 'Total Pengajuan', icon: Wallet },
          {
            value: agentPaymentSummary.menunggu,
            label: 'Menunggu Bayar',
            icon: Clock,
            iconBgClassName: 'bg-amber-50',
            iconClassName: 'text-amber-600',
            valueClassName: 'text-amber-700',
            borderHoverClassName: 'hover:border-amber-300',
          },
          {
            value: agentPaymentSummary.sudahBayar,
            label: 'Sudah Dibayar',
            icon: CheckCircle2,
            iconBgClassName: 'bg-emerald-50',
            iconClassName: 'text-emerald-600',
            valueClassName: 'text-emerald-700',
            borderHoverClassName: 'hover:border-emerald-300',
          },
        ]}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
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
                value={statusParam ?? ''}
                onChange={handleStatusFilterChange}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Belum Dibayar</option>
                <option value="SUDAH_DIBAYAR">Sudah Dibayar</option>
                <option value="ALL">Semua</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Cari agent / customer / transaksi
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Bayar Agent</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik baris yang menunggu pembayaran lalu Ctrl+V untuk paste bukti pembayaran.
          </p>
         
          {statusFilter !== 'SUDAH_DIBAYAR' && menungguCount > 0 && (
            <p className="text-xs font-semibold text-amber-700 mt-2">
              {meta?.totalItems ?? menungguCount} pengajuan menunggu pembayaran
            </p>
          )}
        </div>

        {pasteTarget && (
          <div className="px-5 pb-4">
            <PasteUploadBanner label={pasteBannerLabel} onClear={clearPasteSelection} />
          </div>
        )}

        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Tidak ada pengajuan pencairan agent.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>Agent</th>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Kavling</th>
                  <th className={thClass}>KSO</th>
                  <th className={`${thClass} text-right`}>Closing</th>
                  <th className={`${thClass} text-right`}>Marketing</th>
                  <th className={`${thClass} text-right`}>PPh</th>
                  <th className={`${thClass} text-right`}>Total</th>
                  <th className={thClass}>Diajukan</th>
                  {showTanggalBayar && <th className={thClass}>Tgl Bayar</th>}
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Invoice</th>
                  <th className={thClass}>Bukti</th>
                  <th className={`${thClass} text-center`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const paid = row.status === 'SUDAH_DIBAYAR';
                  const kavling = row.penjualan?.kavling;
                  const invoiceUrls = getAgentPencairanInvoiceUrls(row);
                  const ksoFull = getKsoFull(row);
                  const canPaste = !paid;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/50 ${getRowClassName(row)} ${canPaste ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (canPaste) selectRow(row);
                      }}
                    >
                     
                      <td className={tdClass}>
                        <p className="font-bold text-slate-900">{row.agent?.nama ?? '-'}</p>
                        <p className="text-[10px] text-slate-500">
                          {row.agent?.atasNamaRekening?.trim() || '-'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {row.agent?.namaBank ?? '-'} · {row.agent?.noRekening ?? '-'}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <p className="font-medium">{row.penjualan?.customer?.nama ?? '-'}</p>
                      </td>
                      <td className={tdClass}>
                        {kavling
                          ? formatKavlingLabel(kavling.blok, kavling.nomorUnit)
                          : '-'}
                      </td>
                      <td
                        className={`${tdClass} text-xs font-medium text-slate-700 whitespace-nowrap`}
                        title={ksoFull ?? undefined}
                      >
                        {ksoFull ? (
                          formatKsoShortLabel(ksoFull)
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`}>
                        {formatTanpaDesimal(row.closingNominal)}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`}>
                        {formatTanpaDesimal(row.marketingNominal)}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums text-red-600`}>
                        {formatTanpaDesimal(row.potonganPph)}
                      </td>
                      <td className={`${tdClass} text-right font-bold text-emerald-700 tabular-nums`}>
                        {formatTanpaDesimal(row.totalNominal)}
                      </td>
                      <td className={`${tdClass} text-xs text-slate-500`}>
                        <p>{row.diajukanOleh?.username ?? '-'}</p>
                        <p>{formatDate(row.createdAt)}</p>
                      </td>
                      {showTanggalBayar && (
                        <td className={`${tdClass} text-xs text-slate-500`}>
                          {paid
                            ? formatDate(row.tanggalPembayaran ?? row.updatedAt)
                            : '—'}
                        </td>
                      )}
                      <td className={tdClass}>
                        {paid ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-green-100 text-green-700 rounded w-fit">
                            <CheckCircle2 size={10} />
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-yellow-100 text-yellow-700 rounded w-fit">
                            <Clock size={10} />
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        {invoiceUrls.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {invoiceUrls.map((url) => (
                              <BuktiFileThumbnail
                                key={url}
                                url={url}
                                onClick={() => setPreviewUrl(url)}
                                className="w-12 h-8"
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className={tdClass}>
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
                      <td className={`${tdClass} text-center`}>
                        {!paid && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUpload(row);
                            }}
                            disabled={bayarMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <UploadCloud size={12} />
                            
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Baris per halaman:</span>
              <select
                value={limit}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 border border-slate-200 rounded text-xs"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {pageNumbers.map((n, i) =>
                typeof n === 'string' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
                    {n}
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handlePageChange(n)}
                    className={`min-w-8 h-8 text-xs font-bold rounded ${
                      page === n
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Pratinjau Dokumen">
        {previewUrl && (
          <div className="flex justify-center">
            {previewUrl.toLowerCase().includes('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg" title="Bukti PDF" />
            ) : (
              <img src={previewUrl} alt="Bukti" className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BayarAgent;
