import React from 'react';
import DataTable from "../../components/shared/DataTable";
import PageLoader from "../PageLoader";
import { FileText, Clock } from 'lucide-react';
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import { formatRupiah } from "../../utils/formatters";

const SPR = () => {
  // 1. Ambil data penjualan dari API menggunakan hook yang sudah ada
  const { data: penjualanData = [], isLoading } = useGetPenjualan();

  // 2. Definisikan Kolom Tabel
  const columns = [
    { header: 'No. Transaksi', accessor: 'id' },
    { header: 'Nama Customer', accessor: 'nama' },
    { header: 'Perumahan', accessor: 'perumahan' },
    {
      header: 'Kavling',
      accessor: 'blok',
      render: (_: unknown, row: any) => <span className="font-medium text-slate-700">{row.blok} - {row.nomorUnit}</span>
    },
    {
      header: 'Harga Jual',
      accessor: 'hargaJual',
      render: (val: number) => formatRupiah(val)
    },
    {
      header: 'Dokumen SPR',
      accessor: 'fileSpr',
      render: (val: string | null) => val ? (
        <a
          href={val}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors w-max shadow-sm"
        >
          <FileText size={14} /> Lihat PDF SPR
        </a>
      ) : (
        <span className="text-amber-700 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 w-max">
          <Clock size={14} /> Menunggu Bukti Booking
        </span>
      )
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Kita tidak lagi mengirimkan props onAdd, onEdit, onDelete 
        karena tabel ini sekarang bersifat Read-Only hasil otomasi sistem.
      */}
      <DataTable
        title="Dokumen Surat Pesanan Rumah (SPR)"
        columns={columns}
        data={penjualanData}
      />
    </div>
  );
};

export default SPR;