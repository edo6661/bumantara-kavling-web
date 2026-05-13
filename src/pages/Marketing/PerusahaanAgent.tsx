import React, { useState } from "react";
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import PageLoader from "../PageLoader";
import { Edit2, Trash2, UploadCloud, Eye } from "lucide-react";
import {
  useGetPerusahaanAgents,
  useCreatePerusahaanAgent,
  useUpdatePerusahaanAgent,
  useDeletePerusahaanAgent,
  useUploadAktePerusahaan,
} from "../../hooks/queries/usePerusahaanAgent";
import type { PerusahaanAgentData } from "../../services/perusahaanAgent.service";
import { handleApiError } from "../../utils/errorHandler";

const PerusahaanAgent = () => {
  const { data: perusahaanData = [], isLoading } = useGetPerusahaanAgents();
  const createMutation = useCreatePerusahaanAgent();
  const updateMutation = useUpdatePerusahaanAgent();
  const deleteMutation = useDeletePerusahaanAgent();
  const uploadAkteMutation = useUploadAktePerusahaan();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", nama: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const columns = [
    { header: "Nama Perusahaan", accessor: "nama", render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    {
      header: "Akte Perusahaan",
      accessor: "akte",
      render: (val: string | null) => (
        val ? (
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewImage(val); }}
            className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Eye size={12} /> Lihat Akte
          </button>
        ) : (
          <span className="text-xs text-slate-400 italic">Belum Ada Akte</span>
        )
      )
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (_: unknown, row: PerusahaanAgentData) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openModal(row)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer" title="Edit">
            <Edit2 size={16} />
          </button>
          <label className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all cursor-pointer" title="Upload Akte">
            <UploadCloud size={16} />
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUpload(row.id, e)} />
          </label>
          <button onClick={() => handleDelete(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer" title="Hapus">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const openModal = (item?: PerusahaanAgentData) => {
    if (item) {
      setFormData({ id: item.id.toString(), nama: item.nama });
      setIsEditing(true);
    } else {
      setFormData({ id: "", nama: "" });
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: "", nama: "" });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setErrors({ nama: "Nama perusahaan wajib diisi" });
      return;
    }

    try {
      if (isEditing && formData.id) {
        await updateMutation.mutateAsync({ id: Number(formData.id), data: { nama: formData.nama } });
      } else {
        await createMutation.mutateAsync({ nama: formData.nama });
      }
      closeModal();
    } catch (error) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };

  const handleDelete = async (item: PerusahaanAgentData) => {
    if (window.confirm(`Yakin ingin menghapus perusahaan ${item.nama}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error) {
        const { message } = handleApiError(error);
        alert(message);
      }
    }
  };

  const handleUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      e.target.value = '';
      return;
    }

    try {
      await uploadAkteMutation.mutateAsync({ id, file });
      alert("Akte berhasil diunggah!");
    } catch (error) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      e.target.value = '';
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Daftar Perusahaan Agent"
        columns={columns}
        data={perusahaanData}
        onAdd={() => openModal()}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Perusahaan" : "Tambah Perusahaan"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Perusahaan"
            value={formData.nama}
            onChange={(e) => {
              setFormData({ ...formData, nama: e.target.value });
              if (errors.nama) setErrors({});
            }}
            error={errors.nama}
            placeholder="Contoh: PT. Maju Jaya"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-white border text-sm font-bold rounded-lg cursor-pointer">Batal</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 bg-slate-900 text-white text-sm fFont-bold rounded-lg cursor-pointer">
              {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL LIGHTBOX PREVIEW DOKUMEN */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Akte Perusahaan">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {previewImage.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewImage} className="w-full h-[60vh] rounded-lg border-none" title="PDF Akte" />
              ) : (
                <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer">Tutup</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PerusahaanAgent;