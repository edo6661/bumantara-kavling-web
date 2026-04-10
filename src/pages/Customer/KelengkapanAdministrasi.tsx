import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { useGetCustomers, useUploadCustomerDoc } from "../../hooks/queries/useCustomer";
import type { CustomerData, CustomerDocType } from "../../services/customer.service";
import { XCircle, FileUp, ImageIcon, ZoomIn } from "lucide-react";
const KelengkapanAdministrasi = () => {
  const { data: customers = [], isLoading } = useGetCustomers();
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
    {
      header: 'KTP',
      accessor: 'fileKtp',
      render: (val: string | null) => renderTableThumbnail(val)
    },
    {
      header: 'KK',
      accessor: 'fileKk',
      render: (val: string | null) => renderTableThumbnail(val)
    },
    {
      header: 'NPWP',
      accessor: 'fileNpwp',
      render: (val: string | null) => renderTableThumbnail(val)
    },
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
      await uploadMutation.mutateAsync({
        id: selectedCustomer.id,
        docType,
        file
      });
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengunggah gambar");
    }
  };
  if (isLoading) return <PageLoader />;
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
      />
      {/* MODAL 1: KELOLA & UPLOAD */}
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
                {/* Box Preview di dalam Form */}
                <div
                  onClick={() => selectedCustomer?.[type] && setPreviewImage(selectedCustomer[type])}
                  className={`aspect-video w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all
                    ${selectedCustomer?.[type] ? 'border-slate-200 cursor-zoom-in' : 'border-slate-300 bg-slate-100'}`}
                >
                  {selectedCustomer?.[type] ? (
                    <>
                      <img
                        src={selectedCustomer[type]!}
                        alt={type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
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
      {/* MODAL 2: LIGHTBOX (PREVIEW BESAR) */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Pratinjau Dokumen"
      >
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <img
                src={previewImage}
                alt="Preview Full"
                className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain"
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