import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from "../../components/shared/DataTable";
import PageLoader from "../PageLoader";
import Modal from "../../components/shared/Modal";
import { formatRupiah, formatDate } from "../../utils/formatters";
import {
  Check, X, Clock, CheckCircle2, AlertCircle,
  Filter, ChevronDown, ChevronUp, Calendar, ArrowUpDown
} from 'lucide-react';
import { useGetTagihans, useApproveTagihan } from "../../hooks/queries/useTagihan";
import { handleApiError } from '../../utils/errorHandler';
import BuktiFileThumbnail from '../../components/shared/BuktiFileThumbnail';
import { getTagihanFileBuktiList } from '../../utils/tagihanBukti';

const ApprovePembayaran = () => {
  const [searchParams, setSearchParams] = useSearchParams();


  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';



  const statusFilter = searchParams.get('status') ?? 'MENUNGGU_KONFIRMASI';
  const dateFilter = searchParams.get('date') || '';
  const orderBy = searchParams.get('orderBy') || 'updatedAt:desc';
  const limit = 10;



  const { data: tagihanResponse, isLoading } = useGetTagihans({
    page,
    limit,
    search,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    startDate: dateFilter !== '' ? dateFilter : undefined,
    endDate: dateFilter !== '' ? dateFilter : undefined,
    orderBy
  });


  const tagihans = tagihanResponse?.items || [];
  const meta = tagihanResponse?.meta;

  const approveMutation = useApproveTagihan();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);


  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => { prev.set('page', String(newPage)); return prev; });
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchParams(prev => {
      if (newSearch) prev.set('search', newSearch); else prev.delete('search');
      prev.set('page', '1'); return prev;
    });
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      prev.set('status', e.target.value);
      prev.set('page', '1'); return prev;
    });
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('date', e.target.value); else prev.delete('date');
      prev.set('page', '1'); return prev;
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('orderBy', e.target.value); else prev.delete('orderBy');
      prev.set('page', '1'); return prev;
    });
  };


  const handleApproveReject = async (id: number, isApproved: boolean) => {
    const tindakan = isApproved ? "menyetujui" : "menolak";
    if (window.confirm(`Apakah Anda yakin ingin ${tindakan} bukti pembayaran ini?`)) {
      try {
        await approveMutation.mutateAsync({ id, isApproved });
        alert(isApproved ? "Bukti disetujui! Status menjadi LUNAS." : "Bukti ditolak! Status dikembalikan ke BELUM BAYAR.");
      } catch (error) {
        const { message } = handleApiError(error);
        alert(message);
      }
    }
  };

  const columns = [
    {
      header: 'Customer & Kavling',
      accessor: 'namaCustomer',
      render: (_: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{row.namaCustomer}</span>
          <span className="text-[10px] text-slate-500"> {row.perumahan} Blok {row.blok}-{row.nomorUnit}</span>
        </div>
      )
    },
    {
      header: 'Jenis Pembayaran',
      accessor: 'pembayaran',
      render: (val: string) => <span className="font-semibold text-slate-700">{val}</span>
    },
    {
      header: 'Nominal',
      accessor: 'nominal',
      render: (val: number) => <span className="font-black text-slate-900">{formatRupiah(val)}</span>
    },
    {
      header: 'Tanggal',
      accessor: 'updatedAt',
      render: (val: string) => <span className="text-xs font-medium text-slate-600">{formatDate(val)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        if (val === 'MENUNGGU_KONFIRMASI') return <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 rounded-md w-fit"><Clock size={12} /> Menunggu</span>;
        if (val === 'LUNAS') return <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-md w-fit"><CheckCircle2 size={12} /> Lunas</span>;
        return <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 rounded-md w-fit"><AlertCircle size={12} /> Belum Bayar</span>;
      }
    },
    {
      header: 'Bukti',
      accessor: 'fileBukti',
      render: (_: string | null, row: { id: number; fileBukti?: string | null; fileBuktiList?: string[] }) => {
        const buktiList = getTagihanFileBuktiList(row);
        if (buktiList.length === 0) {
          return <span className="text-[10px] text-slate-400 italic">-</span>;
        }
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {buktiList.slice(0, 3).map((url, index) => (
              <BuktiFileThumbnail
                key={`${row.id}-bukti-${index}`}
                url={url}
                onClick={() => setPreviewImage(url)}
                className="w-12 h-8"
              />
            ))}
            {buktiList.length > 3 && (
              <span className="text-[9px] font-bold text-slate-500">+{buktiList.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: any, row: any) => {
        if (row.status === 'MENUNGGU_KONFIRMASI') {
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => handleApproveReject(row.id, true)} disabled={approveMutation.isPending} className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition cursor-pointer shadow-sm" title="Setujui (Lunas)">
                <Check size={16} />
              </button>
              <button onClick={() => handleApproveReject(row.id, false)} disabled={approveMutation.isPending} className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition cursor-pointer shadow-sm" title="Tolak Bukti">
                <X size={16} />
              </button>
            </div>
          );
        }
        return <span className="text-slate-300 text-xs italic">-</span>;
      }
    }
  ];

  if (isLoading && tagihans.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* KOTAK FILTER & SORTING */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
        <div
          className="p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg ring-1 ring-indigo-200">
              <Filter size={18} strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-slate-900 tracking-tight">Filter & Urutkan Pembayaran</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isFilterExpanded && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white animate-in fade-in slide-in-from-top-2">

            {/* Filter Status */}
            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block group-focus-within:text-indigo-600 transition-colors">
                Status Pembayaran
              </label>
              <select
                className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none transition-all shadow-sm cursor-pointer"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="ALL">Semua Status</option>
                <option value="MENUNGGU_KONFIRMASI">Menunggu Konfirmasi</option>
                <option value="LUNAS">Lunas (Disetujui)</option>
                <option value="BELUM_BAYAR">Belum Bayar</option>
              </select>
              <div className="absolute right-3 top-[34px] pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
                <ChevronDown size={16} />
              </div>
            </div>

            {/* Filter Tanggal */}
            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block group-focus-within:text-indigo-600 transition-colors">
                Tanggal Pembayaran / Upload
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                />
                <Calendar size={16} className="absolute left-3.5 top-[11px] pointer-events-none text-slate-400 group-focus-within:text-indigo-500" />
              </div>
            </div>

            {/* Sorting */}
            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block group-focus-within:text-indigo-600 transition-colors">
                Urutkan Waktu
              </label>
              <select
                className="w-full px-4 pl-10 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none transition-all shadow-sm cursor-pointer"
                value={orderBy}
                onChange={handleSortChange}
              >
                <option value="updatedAt:desc">Terbaru (Paling Atas)</option>
                <option value="updatedAt:asc">Terlama (Paling Atas)</option>
              </select>
              <ArrowUpDown size={16} className="absolute left-3.5 top-[34px] pointer-events-none text-slate-400 group-focus-within:text-indigo-500" />
              <div className="absolute right-3 top-[34px] pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
                <ChevronDown size={16} />
              </div>
            </div>

          </div>
        )}
      </div>

      <DataTable
        title="Persetujuan Pembayaran (Finance)"
        columns={columns}
        data={tagihans}
        serverSide={true}
        searchTerm={search}
        onSearchChange={handleSearchChange}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={handlePageChange}
      />

      {/* MODAL LIGHTBOX PREVIEW BUKTI */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Bukti Transfer">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {previewImage.split('?')[0].toLowerCase().endsWith('.pdf') || previewImage.includes('application/pdf') ? (
                <iframe src={previewImage} className="w-full h-[60vh] rounded-lg border-none" title="PDF Preview" />
              ) : (
                <img src={previewImage} alt="Preview Bukti" className="max-w-full max-h-[60vh] rounded-lg shadow-xl object-contain" />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a
              href={previewImage || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
            >
              Buka Layar Penuh
            </a>
            <button
              onClick={() => setPreviewImage(null)}
              className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-md"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovePembayaran;