import React, { useState } from "react";
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import CurrencyInput from "../../components/shared/CurrencyInput";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
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
  const emptyForm = {
    id: "",
    nama: "",
    npwp: "",
    namaBank: "",
    noRekening: "",
    atasNamaRekening: "",
    feeMarketingPct: "" as number | "",
    feeClosingNominal: "" as number | "",
    potonganPph: "" as number | "",
  };
  const [formData, setFormData] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const columns = [
    { header: "Nama", accessor: "nama", render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    // 👇 KOLOM BARU DITAMBAHKAN 👇
    { header: "NPWP", accessor: "npwp", render: (val: string) => <span className="font-mono text-xs">{val || '-'}</span> },
    {
      header: "Fee (%)",
      accessor: "feeMarketingPct",
      render: (val: number | null) => (
        <span className="text-xs tabular-nums">{val != null ? `${val}%` : "-"}</span>
      ),
    },
    {
      header: "Fee Closing (Rp)",
      accessor: "feeClosingNominal",
      render: (val: number | null) => (
        <span className="text-xs tabular-nums">{val != null ? formatRupiah(val) : "-"}</span>
      ),
    },
    {
      header: "Potongan PPh (%)",
      accessor: "potonganPph",
      render: (val: number | null) => (
        <span className="text-xs tabular-nums">{val != null ? `${val}%` : "-"}</span>
      ),
    },
    {
      header: "Bank Detail",
      accessor: "namaBank",
      render: (_: unknown, row: PerusahaanAgentData) => (
        row.namaBank ? (
          <div className="text-xs">
            <p className="font-bold">{row.namaBank}</p>
            <p className="font-mono">{row.noRekening}</p>
            <p className="text-slate-500 italic">a/n {row.atasNamaRekening}</p>
          </div>
        ) : <span className="text-xs text-slate-400 italic">-</span>
      )
    },
    // 👆 SAMPAI SINI 👆
    {
      header: "Akte",
      accessor: "akte",
      render: (val: string | null) => (
        val ? (
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewImage(val); }}
            className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Eye size={12} /> 
          </button>
        ) : (
          <span className="text-xs text-slate-400 italic">-</span>
        )
      )
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (_: unknown, row: PerusahaanAgentData) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openModal(row)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer" title="Edit">
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
      setFormData({
        id: item.id.toString(),
        nama: item.nama,
        npwp: item.npwp || "",
        namaBank: item.namaBank || "",
        noRekening: item.noRekening || "",
        atasNamaRekening: item.atasNamaRekening || "",
        feeMarketingPct: item.feeMarketingPct ?? "",
        feeClosingNominal: item.feeClosingNominal ?? "",
        potonganPph: item.potonganPph ?? "",
      });
      setIsEditing(true);
    } else {
      setFormData(emptyForm);
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyForm);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors({});
  };

  const handleCurrencyChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors({});
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setErrors({ nama: "Nama perusahaan wajib diisi" });
      return;
    }

    try {
      const payload = {
        nama: formData.nama,
        npwp: formData.npwp,
        namaBank: formData.namaBank,
        noRekening: formData.noRekening,
        atasNamaRekening: formData.atasNamaRekening,
        feeMarketingPct: formData.feeMarketingPct !== "" ? Number(formData.feeMarketingPct) : undefined,
        feeClosingNominal: formData.feeClosingNominal !== "" ? Number(formData.feeClosingNominal) : undefined,
        potonganPph: formData.potonganPph !== "" ? Number(formData.potonganPph) : undefined,
      };
      if (isEditing && formData.id) {
        await updateMutation.mutateAsync({ id: Number(formData.id), data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (error: any) {
      const { message, errors: backendErrors } = handleApiError(error);
      if (backendErrors && Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((err: { field: string; message: string }) => {
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        alert(message);
      }
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
            label="Nama"
            value={formData.nama}
            onChange={(e) => {
              setFormData({ ...formData, nama: e.target.value });
              if (errors.nama) setErrors({});
            }}
            error={errors.nama}
            placeholder="Contoh: PT. Maju Jaya"
          />

          <Input
            label="NPWP Perusahaan (Opsional)"
            value={formData.npwp}
            onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
            placeholder="Masukkan NPWP"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fee Marketing (%)"
              name="feeMarketingPct"
              type="number"
              step="any"
              value={formData.feeMarketingPct}
              onChange={handleChange}
              placeholder="Contoh: 2.5"
            />
            <CurrencyInput
              label="Fee Closing (Rp)"
              name="feeClosingNominal"
              value={Number(formData.feeClosingNominal) || 0}
              onValueChange={(_, val) => handleCurrencyChange("feeClosingNominal", val)}
              placeholder="0"
            />
            <Input
              label="Potongan PPh (%)"
              name="potonganPph"
              type="number"
              step="any"
              value={formData.potonganPph}
              onChange={handleChange}
              placeholder="Contoh: 2.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nama Bank (Opsional)"
              value={formData.namaBank}
              onChange={(e) => setFormData({ ...formData, namaBank: e.target.value })}
              placeholder="Contoh: BCA / BSI"
            />
            <Input
              label="No Rekening (Opsional)"
              value={formData.noRekening}
              onChange={(e) => setFormData({ ...formData, noRekening: e.target.value })}
              placeholder="Nomor Rekening"
            />
            <Input
              label="Atas Nama (A/N) (Opsional)"
              value={formData.atasNamaRekening}
              onChange={(e) => setFormData({ ...formData, atasNamaRekening: e.target.value })}
              placeholder="A/N Rekening"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-white border text-sm font-bold rounded-lg cursor-pointer transition-colors hover:bg-slate-50 text-black">
              Batal
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg cursor-pointer shadow-md hover:bg-black transition-colors disabled:opacity-50">
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
              {previewImage.split('?')[0].toLowerCase().endsWith('.pdf') || previewImage.includes('application/pdf') ? (
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