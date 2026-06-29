import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageSummaryCard from '../../components/shared/PageSummaryCard';
import DataTable from "../../components/shared/DataTable";
import PageLoader from "../PageLoader";
import Modal from "../../components/shared/Modal";
import PasteUploadBanner from '../../components/shared/PasteUploadBanner';
import { formatDate } from "../../utils/formatters";
import {
  FileText, ZoomIn, Clock, CheckCircle2, Filter, ChevronDown, ChevronUp,
  ArrowUpDown, UploadCloud, Loader2, Wallet
} from 'lucide-react';
import {
  useGetKodeBillingPph,
  useUploadBuktiBayarKodeBillingPph,
} from "../../hooks/queries/useKodeBillingPph";
import { useRowPasteUpload } from '../../hooks/useRowPasteUpload';
import { handleApiError } from '../../utils/errorHandler';
import type { KodeBillingPphData } from '../../services/kodeBillingPph.service';
import { isUploadableFile } from '../../utils/clipboardFilePaste';

const BayarKodeBillingPph = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const orderBy = searchParams.get('orderBy') || 'createdAt:desc';
  const limit = 10;

  const { data: response, isLoading } = useGetKodeBillingPph({
    page,
    limit,
    search: search || undefined,
    status: statusFilter === 'ALL' ? 'ALL' : statusFilter,
    orderBy,
  });

  const items = response?.items || [];
  const meta = response?.meta;

  const { data: summaryResponse } = useGetKodeBillingPph({ page: 1, limit: 500, status: 'ALL' });
  const billingSummary = useMemo(() => {
    const rows = summaryResponse?.items ?? [];
    let menunggu = 0;
    let sudahBayar = 0;
    for (const row of rows) {
      if (row.status === 'MENUNGGU_BAYAR') menunggu += 1;
      else if (row.status === 'SUDAH_BAYAR') sudahBayar += 1;
    }
    return { total: rows.length, menunggu, sudahBayar };
  }, [summaryResponse?.items]);

  const uploadMutation = useUploadBuktiBayarKodeBillingPph();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => { prev.set('page', String(newPage)); return prev; });
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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      if (e.target.value) prev.set('orderBy', e.target.value);
      else prev.delete('orderBy');
      prev.set('page', '1');
      return prev;
    });
  };

  const processUpload = useCallback(
    async (id: number, file: File): Promise<boolean> => {
      if (!isUploadableFile(file)) {
        alert('Hanya file gambar dan PDF yang diperbolehkan!');
        return false;
      }

      try {
        setUploadTargetId(id);
        await uploadMutation.mutateAsync({ id, file });
        alert('Bukti pembayaran kode billing PPh berhasil diunggah!');
        return true;
      } catch (error) {
        alert(handleApiError(error).message);
        return false;
      } finally {
        setUploadTargetId(null);
      }
    },
    [uploadMutation],
  );

  const onPasteFiles = useCallback(
    async (row: KodeBillingPphData, files: File[]) => processUpload(row.id, files[0]!),
    [processUpload],
  );

  const {
    pasteTarget,
    selectRow,
    clearSelection: clearPasteSelection,
    getRowClassName,
  } = useRowPasteUpload<KodeBillingPphData>({
    canSelect: (row) => row.status === 'MENUNGGU_BAYAR',
    onPasteFiles,
  });

  const handleUploadClick = (row: KodeBillingPphData) => {
    selectRow(row);
    setUploadTargetId(row.id);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadTargetId) return;
    const ok = await processUpload(uploadTargetId, file);
    if (ok) clearPasteSelection();
  };

  const pasteBannerLabel = pasteTarget
    ? `${pasteTarget.namaCustomer} · ${pasteTarget.kodeBilling}`
    : '';

  const columns = [
    {
      header: 'Customer & Kavling',
      accessor: 'namaCustomer',
      render: (_: unknown, row: (typeof items)[0]) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{row.namaCustomer}</span>
          {row.perumahan ? (
            <span className="text-[10px] text-slate-500">
               Blok {row.blok}-{row.nomorUnit}
               {(row.sertifikatUrutan ?? 1) > 1 ? ` · Tanah ke-${row.sertifikatUrutan}` : ''}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Tanpa data kavling</span>
          )}
        </div>
      ),
    },
    {
      header: 'Kode Billing PPh',
      accessor: 'kodeBilling',
      render: (val: string) => (
        <span className="font-mono font-bold text-blue-700 text-sm tracking-wide">{val}</span>
      ),
    },
    {
      header: 'PDF Billing',
      accessor: 'fileBilling',
      render: (val: string) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPreviewUrl(val); }}
          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition"
          title="Lihat PDF Billing"
        >
          <FileText size={16} />
        </button>
      ),
    },
    {
      header: 'Suket PPh',
      accessor: 'fileSuket',
      render: (val: string | null) => val ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPreviewUrl(val); }}
          className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg transition"
          title="Lihat Suket PPh"
        >
          {val.split('?')[0].toLowerCase().endsWith('.pdf') ? (
            <FileText size={16} />
          ) : (
            <span className="relative block w-8 h-6 rounded overflow-hidden">
              <img src={val} alt="Suket" className="w-full h-full object-cover" />
            </span>
          )}
        </button>
      ) : (
        <span className="text-[10px] text-slate-400 italic">-</span>
      ),
    },
    {
      header: 'Tanggal Upload',
      accessor: 'createdAt',
      render: (val: string) => (
        <span className="text-xs font-medium text-slate-600">{formatDate(val)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        if (val === 'MENUNGGU_BAYAR') {
          return (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 rounded-md w-fit">
              <Clock size={12} /> Menunggu Bayar
            </span>
          );
        }
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-md w-fit">
            <CheckCircle2 size={12} /> Sudah Bayar
          </span>
        );
      },
    },
    {
      header: 'Bukti Bayar',
      accessor: 'fileBuktiBayar',
      render: (val: string | null) => val ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPreviewUrl(val); }}
          className="relative w-12 h-8 rounded border border-slate-200 overflow-hidden cursor-zoom-in hover:border-blue-400 transition"
          title="Lihat bukti pembayaran"
        >
          {val.split('?')[0].toLowerCase().endsWith('.pdf') ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-red-500">
              <FileText size={14} />
            </div>
          ) : (
            <img src={val} alt="Bukti" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
            <ZoomIn className="text-white" size={12} />
          </div>
        </button>
      ) : (
        <span className="text-[10px] text-slate-400 italic">Belum ada</span>
      ),
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: unknown, row: (typeof items)[0]) => (
        row.status === 'MENUNGGU_BAYAR' ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleUploadClick(row); }}
            disabled={uploadMutation.isPending && uploadTargetId === row.id}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {uploadMutation.isPending && uploadTargetId === row.id ? (
              <><Loader2 size={12} className="animate-spin" /> Mengunggah...</>
            ) : (
              <><UploadCloud size={12} /> Upload Bukti</>
            )}
          </button>
        ) : (
          <></>
        )
      ),
    },
  ];

  if (isLoading && items.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageSummaryCard
        title="Ringkasan Kode Billing PPh"
        subtitle="Status pembayaran PPh progres penjualan"
        headerIcon={FileText}
        items={[
          { value: billingSummary.total, label: 'Total Billing', icon: Wallet },
          {
            value: billingSummary.menunggu,
            label: 'Menunggu Bayar',
            icon: Clock,
            iconBgClassName: 'bg-amber-50',
            iconClassName: 'text-amber-600',
            valueClassName: 'text-amber-700',
            borderHoverClassName: 'hover:border-amber-300',
          },
          {
            value: billingSummary.sudahBayar,
            label: 'Sudah Dibayar',
            icon: CheckCircle2,
            iconBgClassName: 'bg-emerald-50',
            iconClassName: 'text-emerald-600',
            valueClassName: 'text-emerald-700',
            borderHoverClassName: 'hover:border-emerald-300',
          },
          {
            value: Math.max(0, billingSummary.total - billingSummary.menunggu - billingSummary.sudahBayar),
            label: 'Status Lain',
            icon: FileText,
            iconBgClassName: 'bg-slate-100',
            iconClassName: 'text-slate-600',
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div
          className="p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg ring-1 ring-blue-200">
              <Filter size={18} strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-slate-900 tracking-tight">Filter & Urutkan Kode Billing PPh</h3>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
            {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isFilterExpanded && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Status Pembayaran
              </label>
              <select
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none shadow-sm cursor-pointer"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="MENUNGGU_BAYAR">Menunggu Bayar</option>
                <option value="SUDAH_BAYAR">Sudah Bayar</option>
                <option value="ALL">Semua Status</option>
              </select>
            </div>

            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Urutkan
              </label>
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none shadow-sm cursor-pointer"
                value={orderBy}
                onChange={handleSortChange}
              >
                <option value="createdAt:desc">Terbaru</option>
                <option value="createdAt:asc">Terlama</option>
                <option value="kodeBilling:asc">Kode Billing (A-Z)</option>
                <option value="kodeBilling:desc">Kode Billing (Z-A)</option>
                <option value="status:asc">Status (A-Z)</option>
              </select>
              <ArrowUpDown size={16} className="absolute left-3.5 top-[34px] pointer-events-none text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {pasteTarget && (
        <PasteUploadBanner
          label={pasteBannerLabel}
          onClear={clearPasteSelection}
        />
      )}

      <DataTable
        title="Pembayaran Kode Billing PPh"
        columns={columns}
        data={items}
        serverSide
        searchTerm={search}
        onSearchChange={handleSearchChange}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={handlePageChange}
        onRowClick={(row) => {
          if (row.status === 'MENUNGGU_BAYAR') selectRow(row);
        }}
        getRowClassName={getRowClassName}
      />

      <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Preview Dokumen">
        <div className="flex flex-col items-center">
          {previewUrl && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200">
              {previewUrl.split('?')[0].toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg border-none" title="PDF Preview" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="mt-6 px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BayarKodeBillingPph;
