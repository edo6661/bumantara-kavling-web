import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/shared/DataTable';
import PageLoader from '../PageLoader';
import Modal from '../../components/shared/Modal';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../../components/shared/BuktiFileThumbnail';
import Input from '../../components/shared/Input';
import { formatDate, formatRupiah } from '../../utils/formatters';
import {
  Clock,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { useBayarSpkPembayaran, useGetSpkPembayaranList } from '../../hooks/queries/useSpkPembayaran';
import { handleApiError } from '../../utils/errorHandler';
import { SPK_PEMBAYARAN_JENIS_LABEL } from '../../utils/spkPembayaran';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';

const BayarSpkPembayaran = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<SpkPembayaranData | null>(null);
  const [tanggalBayar, setTanggalBayar] = useState(() =>
    new Date().toISOString().split('T')[0]!,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const limit = 10;

  const { data: response, isLoading } = useGetSpkPembayaranList({
    page,
    limit,
    search: search || undefined,
    status: statusFilter === 'ALL' ? 'ALL' : (statusFilter as 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR'),
  });

  const items = response?.items ?? [];
  const meta = response?.meta;
  const bayarMutation = useBayarSpkPembayaran();

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
    setTanggalBayar(new Date().toISOString().split('T')[0]!);
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
      await bayarMutation.mutateAsync({
        id: uploadTarget.id,
        file,
        tanggalPembayaran: tanggalBayar,
      });
      alert('Pembayaran SPK berhasil diproses. Nominal SPK telah diperbarui.');
    } catch (error) {
      alert(handleApiError(error).message);
    } finally {
      setUploadTarget(null);
    }
  };

  const columns = [
    {
      header: 'SPK & Mandor',
      accessor: 'spk',
      render: (_: unknown, row: SpkPembayaranData) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.spk?.noSpk ?? `#${row.spkId}`}</span>
          <span className="text-[10px] text-slate-500">{row.spk?.mandor?.username ?? '-'}</span>
        </div>
      ),
    },
    {
      header: 'Termin',
      accessor: 'jenis',
      render: (val: SpkPembayaranData['jenis']) => (
        <span className="text-xs font-semibold text-slate-700">
          {SPK_PEMBAYARAN_JENIS_LABEL[val]}
        </span>
      ),
    },
    {
      header: 'Nominal',
      accessor: 'nominal',
      render: (val: number) => (
        <span className="font-black text-slate-900">{formatRupiah(val)}</span>
      ),
    },
    {
      header: 'Diajukan',
      accessor: 'diajukanOleh',
      render: (val: SpkPembayaranData['diajukanOleh']) => (
        <span className="text-xs text-slate-600">{val?.username ?? '-'}</span>
      ),
    },
    {
      header: 'Tanggal',
      accessor: 'createdAt',
      render: (val: string) => (
        <span className="text-xs text-slate-600">{formatDate(val)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) =>
        val === 'MENUNGGU_PEMBAYARAN' ? (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 rounded-md w-fit">
            <Clock size={12} /> Menunggu Pembayaran
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase bg-green-100 text-green-700 rounded-md w-fit">
            <CheckCircle2 size={12} /> Terbayar
          </span>
        ),
    },
    {
      header: 'Bukti',
      accessor: 'buktiPembayaran',
      render: (val: string | null) =>
        val ? (
          <BuktiFileThumbnail
            url={val}
            onClick={() => setPreviewUrl(val)}
            className="w-12 h-8"
          />
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        ),
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: number, row: SpkPembayaranData) =>
        row.status === 'MENUNGGU_PEMBAYARAN' ? (
          <button
            type="button"
            onClick={() => openUpload(row)}
            disabled={bayarMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-900 text-white rounded-lg hover:bg-black disabled:opacity-50"
          >
            <UploadCloud size={12} />
            Bayar & Upload Bukti
          </button>
        ) : (
          <span className="text-[10px] text-slate-400"></span>
        ),
    },
  ];

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

      {uploadTarget && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-4 max-w-xs">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tanggal pembayaran</p>
          <Input
            type="date"
            name="tanggalBayar"
            value={tanggalBayar}
            onChange={(e) => setTanggalBayar(e.target.value)}
            label=""
          />
          <p className="text-[10px] text-slate-500 mt-2">
            Pilih file bukti setelah tanggal diisi ({uploadTarget.spk?.noSpk})
          </p>
        </div>
      )}

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
          </div>
        )}
      </div>

      <DataTable
        title="Pembayaran SPK (Mandor / Kontraktor)"
        columns={columns}
        data={items}
        serverSide
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={handlePageChange}
        searchTerm={search}
        onSearchChange={handleSearchChange}
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
