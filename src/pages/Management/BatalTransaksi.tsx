/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { FileUp, Eye, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import { useUploadRefundTagihan } from "../../hooks/queries/useTagihan";

const BatalTransaksi = () => {
  const { data: penjualanData = [], isLoading } = useGetPenjualan();
  const uploadRefundMutation = useUploadRefundTagihan();

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState<any>(null);
  const [refundFile, setRefundFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filter hanya transaksi yang BATAL
  const canceledTransactions = useMemo(() => {
    return penjualanData.filter((p: any) => p.status === 'BATAL');
  }, [penjualanData]);

  const columns = [
    { header: 'No. Transaksi', accessor: 'id' },
    { header: 'Tanggal', accessor: 'tanggal', render: (val: string) => formatDate(val) },
    { header: 'Nama Customer', accessor: 'nama', render: (val: string) => <span className="font-bold">{val}</span> },
    { header: 'Kavling', accessor: 'blok', render: (_: any, row: any) => `${row.perumahan} Blok ${row.blok}-${row.nomorUnit}` },
    {
      header: 'Total Dana Masuk',
      accessor: 'tagihan',
      render: (_: any, row: any) => {
        // Hitung total tagihan yang sudah LUNAS
        const tagihanLunas = (row.tagihan || []).filter((t: any) => t.status === 'LUNAS');
        const total = tagihanLunas.reduce((acc: number, curr: any) => acc + Number(curr.nominal), 0);
        return <span className="font-bold text-slate-900">{formatRupiah(total)}</span>;
      }
    },
    {
      header: 'Status', accessor: 'status', render: (val: string) => (
        <span className="px-2.5 py-1 bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
          {val}
        </span>
      )
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Hanya file gambar yang diperbolehkan!");
        e.target.value = '';
        return;
      }
      setRefundFile(file);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundFile || !selectedTagihan) {
      alert("Silakan pilih file bukti refund terlebih dahulu!");
      return;
    }

    try {
      await uploadRefundMutation.mutateAsync({
        id: selectedTagihan.id,
        file: refundFile
      });
      alert("Bukti refund berhasil diunggah!");
      setIsRefundModalOpen(false);
      setRefundFile(null);
      setSelectedTagihan(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengunggah bukti refund");
    }
  };

  const expandedRowRender = (row: any) => {
    // Ambil tagihan yang statusnya LUNAS saja karena itu yang masuk akal di-refund
    const tagihanLunas = (row.tagihan || []).filter((t: any) => t.status === 'LUNAS');

    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-slate-100 pb-3 gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Ban size={16} className="text-red-500" /> Alasan Pembatalan
            </h4>
            <p className="text-sm text-slate-600 mt-1">{row.alasanBatal || 'Tidak ada alasan yang dicantumkan.'}</p>
          </div>
        </div>

        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">Dana yang Masuk (Bisa Di-refund)</h4>

        {tagihanLunas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">Keterangan Tagihan</th>
                  <th className="px-4 py-3 font-bold">Tanggal Pembayaran</th>
                  <th className="px-4 py-3 text-right font-bold">Nominal (Rp)</th>
                  <th className="px-4 py-3 text-center font-bold">Status Refund</th>
                  <th className="px-4 py-3 rounded-r-lg text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tagihanLunas.map((tagihan: any) => (
                  <tr key={tagihan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{tagihan.pembayaran}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(tagihan.updatedAt)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRupiah(tagihan.nominal)}</td>
                    <td className="px-4 py-3 text-center">
                      {tagihan.isRefunded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                          <CheckCircle2 size={12} /> Dikembalikan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                          <AlertCircle size={12} /> Belum Refund
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tagihan.isRefunded ? (
                        <button
                          onClick={() => setPreviewImage(tagihan.fileBuktiRefund)}
                          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                        >
                          <Eye size={14} /> Lihat Bukti
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTagihan(tagihan);
                            setRefundFile(null);
                            setIsRefundModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-black transition shadow-sm cursor-pointer"
                        >
                          <FileUp size={14} /> Proses Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 italic">Belum ada dana yang dibayarkan oleh customer ini.</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Daftar Transaksi Batal"
        columns={columns}
        data={canceledTransactions}
        expandedRowRender={expandedRowRender}
      />

      {/* MODAL PROSES REFUND */}
      <Modal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} title="Proses Pengembalian Dana (Refund)">
        <form onSubmit={handleRefundSubmit} className="space-y-5">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Item yang di-refund</p>
            <p className="text-sm font-black text-blue-900 mb-1">{selectedTagihan?.pembayaran}</p>
            <p className="text-lg font-black text-blue-700">{formatRupiah(selectedTagihan?.nominal || 0)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Jika dana {selectedTagihan?.pembayaran} dikembalikan kepada customer, silakan unggah bukti transfer pengembalian dana di bawah ini. Jika dana hangus (tidak di-refund), Anda tidak perlu melakukan aksi ini.
            </p>
            <FileInput
              label="Upload Bukti Transfer Refund (Gambar)"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {refundFile && (
              <p className="text-xs text-green-600 font-bold bg-green-50 p-2 rounded-lg border border-green-100">
                File siap diunggah: {refundFile.name}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsRefundModalOpen(false)}
              disabled={uploadRefundMutation.isPending}
              className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploadRefundMutation.isPending || !refundFile}
              className="px-6 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-lg disabled:opacity-50"
            >
              {uploadRefundMutation.isPending ? "Memproses..." : "Konfirmasi Refund"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL LIGHTBOX PREVIEW GAMBAR REFUND */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Bukti Transfer Refund">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <img
                src={previewImage}
                alt="Preview Bukti Refund"
                className="max-w-full max-h-[60vh] rounded-lg shadow-xl object-contain"
              />
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a
              href={previewImage || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Buka Tab Baru
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

export default BatalTransaksi;