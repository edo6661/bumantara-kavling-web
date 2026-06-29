import React, { useState, useMemo } from "react";
import PageSummaryCard from "../../components/shared/PageSummaryCard";
import { summarizePerusahaanAgents } from "../../utils/pageSummaries";
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import CurrencyInput from "../../components/shared/CurrencyInput";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
import { Edit2, Trash2, UploadCloud, Eye, Building2, AlertCircle, FileText, Landmark } from "lucide-react";
import {
  useGetPerusahaanAgents,
  useCreatePerusahaanAgent,
  useUpdatePerusahaanAgent,
  useDeletePerusahaanAgent,
  useUploadAktePerusahaan,
} from "../../hooks/queries/usePerusahaanAgent";
import type { PerusahaanAgentData } from "../../services/perusahaanAgent.service";
import { handleApiError } from "../../utils/errorHandler";

const KelolaPerusahaanAgentTab = () => {
  const { data: perusahaanData = [], isLoading } = useGetPerusahaanAgents();
  const perusahaanSummary = useMemo(
    () => summarizePerusahaanAgents(perusahaanData),
    [perusahaanData],
  );
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
    isPkp: false,
  };
  const [formData, setFormData] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const columns = [
    { header: "Nama", accessor: "nama", render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
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
      render: (val: number | null, row: PerusahaanAgentData) => (
        <div className="text-xs tabular-nums">
          <span>{val != null ? formatRupiah(val) : "-"}</span>
          {row.isPkp && val != null ? (
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Termasuk PPN 11%</p>
          ) : null}
        </div>
      ),
    },
    {
      header: "PKP",
      accessor: "isPkp",
      render: (val: boolean | undefined) => (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${val ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {val ? "PKP" : "Non-PKP"}
        </span>
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
        isPkp: item.isPkp ?? false,
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
        isPkp: formData.isPkp,
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
    <div className="space-y-6">
      <PageSummaryCard
        title="Ringkasan Perusahaan Agent"
        subtitle="Kelengkapan data master perusahaan"
        headerIcon={Building2}
        items={[
          {
            value: perusahaanSummary.total,
            label: 'Total Perusahaan',
            icon: Building2,
          },
          {
            value: perusahaanSummary.missingNpwp,
            label: 'Belum Ada NPWP',
            icon: FileText,
            iconBgClassName: 'bg-amber-50',
            iconClassName: 'text-amber-600',
            valueClassName: 'text-amber-700',
            borderHoverClassName: 'hover:border-amber-300',
          },
          {
            value: perusahaanSummary.missingRekening,
            label: 'Rekening Belum Lengkap',
            icon: Landmark,
            iconBgClassName: 'bg-red-50',
            iconClassName: 'text-red-600',
            valueClassName: 'text-red-600',
            borderHoverClassName: 'hover:border-red-300',
          },
          {
            value: perusahaanSummary.missingAkte,
            label: 'Belum Upload Akte',
            icon: AlertCircle,
            iconBgClassName: 'bg-blue-50',
            iconClassName: 'text-blue-600',
            valueClassName: 'text-blue-700',
            borderHoverClassName: 'hover:border-blue-300',
          },
        ]}
        footer={
          perusahaanSummary.missingFee > 0
            ? `${perusahaanSummary.missingFee} perusahaan belum diatur fee marketing/closing`
            : undefined
        }
      />

      <DataTable
        title="Kelola Perusahaan"
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
            <div>
              <CurrencyInput
                label="Fee Closing (Rp)"
                name="feeClosingNominal"
                value={Number(formData.feeClosingNominal) || 0}
                onValueChange={(_, val) => handleCurrencyChange("feeClosingNominal", val)}
                placeholder="0"
              />
              {formData.isPkp ? (
                <p className="text-[11px] text-emerald-700 mt-1">
                  Nominal PKP sudah termasuk PPN 11%. DPP dihitung otomatis untuk PPh.
                </p>
              ) : null}
            </div>
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

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPkp}
              onChange={(e) => setFormData((prev) => ({ ...prev, isPkp: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            <span>
              <span className="block text-sm font-bold text-slate-900">Agent perusahaan PKP</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Centang jika perusahaan wajib PPN. Fee closing diinput bruto (sudah termasuk PPN 11%); default tidak dicentang.
              </span>
            </span>
          </label>

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

export default KelolaPerusahaanAgentTab;
