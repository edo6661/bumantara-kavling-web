/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { useGetCustomers, useUploadCustomerDoc } from "../../hooks/queries/useCustomer";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import type { CustomerData, CustomerDocType } from "../../services/customer.service";
import { XCircle, FileUp, ImageIcon, ZoomIn, ShoppingCart } from "lucide-react";

const KelengkapanAdministrasi = () => {
  const { data: customers = [], isLoading } = useGetCustomers();
  const { data: penjualanResponse, isLoading: isLoadingPenjualan } = useGetPenjualan({ limit: 500 });
  const penjualanData = penjualanResponse?.items || [];
  const uploadMutation = useUploadCustomerDoc();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const renderTableThumbnail = (url: string | null) => {
    if (!url) return (
      <div className="flex items-center gap-2 text-red-400 font-medium text-[10px] uppercase tracking-wider">
        <XCircle size={14} /> Kosong
      </div>
    );
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setPreviewImage(url);
        }}
        className="relative w-12 h-8 rounded-lg border border-slate-200 overflow-hidden cursor-zoom-in group"
      >
        <img src={url} alt="Dokumen" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <ZoomIn size={12} className="text-white" />
        </div>
      </div>
    );
  };

  const columns = [
    { header: 'Nama Customer', accessor: 'nama' },
    { header: 'KTP', accessor: 'fileKtp', render: (val: string | null) => renderTableThumbnail(val) },
    { header: 'KK', accessor: 'fileKk', render: (val: string | null) => renderTableThumbnail(val) },
    { header: 'NPWP', accessor: 'fileNpwp', render: (val: string | null) => renderTableThumbnail(val) },
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: CustomerDocType) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomer) return;
    if (!file.type.startsWith('image/')) {
      alert("Hanya file gambar yang diperbolehkan!");
      e.target.value = "";
      return;
    }
    try {
      await uploadMutation.mutateAsync({ id: selectedCustomer.id, docType, file });
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengunggah gambar");
    }
  };

  const expandedRowRender = (row: CustomerData) => {
    const customerSales = penjualanData.filter((p: any) => p.noIdentitas === row.nikKtp);
    return (
      <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={16} className="text-blue-600" /> Riwayat Pembelian & Penjualan
          </h4>
        </div>
        {customerSales.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[10px]">
                  <th className="p-3 font-bold">Tanggal</th>
                  <th className="p-3 font-bold">Kavling</th>
                  <th className="p-3 font-bold">Pembayaran</th>
                  <th className="p-3 font-bold text-right">Nilai Transaksi</th>
                  <th className="p-3 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerSales.map((item: any) => (
                  <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-600 font-medium">{formatDate(item.tanggal)}</td>
                    <td className="p-3 font-semibold text-slate-800">{item.perumahan} - Blok {item.blok}-{item.nomorUnit}</td>
                    <td className="p-3 text-slate-600">{item.caraPembayaran.replace('_', ' ')}</td>
                    <td className="p-3 text-slate-900 font-bold text-right">{formatRupiah(item.hargaJual)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${item.status === 'LUNAS' ? 'bg-green-100 text-green-700' :
                        item.status === 'BATAL' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic text-center py-4 bg-white rounded-lg border border-slate-100">
            Belum ada riwayat transaksi penjualan untuk customer ini.
          </p>
        )}
      </div>
    );
  };

  if (isLoading || isLoadingPenjualan) return <PageLoader />;

  return (
    <div className="space-y-6">
      <DataTable
        title="Administrasi Berkas Gambar"
        columns={columns}
        data={customers}
        onEdit={(item) => {
          setSelectedCustomer(item as CustomerData);
          setIsManageModalOpen(true);
        }}
        expandedRowRender={expandedRowRender}
      />

      {/* MODAL KELOLA & UPLOAD */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title={`Manajemen Berkas: ${selectedCustomer?.nama}`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['fileKtp', 'fileKk', 'fileNpwp'] as CustomerDocType[]).map((type) => (
              <div key={type} className="flex flex-col gap-3 p-4 border rounded-2xl bg-slate-50/50 hover:bg-white transition-all group">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {type.replace('file', '')}
                </span>
                <div
                  onClick={() => selectedCustomer?.[type] && setPreviewImage(selectedCustomer[type] as string)}
                  className={`aspect-video w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all ${selectedCustomer?.[type] ? 'border-slate-200 cursor-zoom-in' : 'border-slate-300 bg-slate-100'
                    }`}
                >
                  {selectedCustomer?.[type] ? (
                    <>
                      <img src={selectedCustomer[type] as string} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <ImageIcon size={24} strokeWidth={1.5} />
                      <span className="text-[9px] font-bold">KOSONG</span>
                    </div>
                  )}
                </div>
                <FileInput
                  label="Ganti Gambar"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, type)}
                  disabled={uploadMutation.isPending}
                />
              </div>
            ))}
          </div>

          {uploadMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs animate-pulse">
              <FileUp size={16} /> Sedang Menyinkronkan...
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setIsManageModalOpen(false)}
              className="px-8 py-2 bg-black text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 cursor-pointer"
            >
              Simpan & Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL LIGHTBOX PREVIEW */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
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
              className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KelengkapanAdministrasi;