/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
import { Edit2, Eye, Key, Trash2, UploadCloud } from "lucide-react";
import {
  useGetAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  useUploadAgentDoc,
  useGenerateAgentAccount
} from "../../hooks/queries/useAgent";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import type { AgentData, CreateAgentDTO, PenjualanAgentData, PicAgentData } from '../../types/models/agent';
import { handleApiError } from '../../utils/errorHandler';

interface AgentFormState {
  id: number | '';
  nik: string;
  nama: string;
  alamat: string;
  noHp: string;
  email: string;
  type: string;
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  feeMarketingPct: number | '';
  potonganPph: number | '';
  pics: PicAgentData[];
}

const initialFormState: AgentFormState = {
  id: '',
  nik: '',
  nama: '',
  alamat: '',
  noHp: '',
  email: '',
  type: 'PRIBADI',
  namaBank: '',
  noRekening: '',
  atasNamaRekening: '',
  feeMarketingPct: '',
  potonganPph: '',
  pics: [{ nama: '', noHp: '', alamat: '' }]
};

const Agents = () => {
  const { data: agentData = [], isLoading } = useGetAgents();
  const { data: penjualanResponse } = useGetPenjualan({ limit: 500 });
  const penjualanList = penjualanResponse?.items || [];

  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();
  const uploadDocMutation = useUploadAgentDoc();
  const generateAccountMutation = useGenerateAgentAccount();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AgentFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<AgentData | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedUploadAgent, setSelectedUploadAgent] = useState<AgentData | null>(null);

  const [selectedDetailPenjualan, setSelectedDetailPenjualan] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const columns = [
    { header: 'NIK', accessor: 'nik' },
    { header: 'Nama Agent', accessor: 'nama', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },

    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: any, row: AgentData) => (
        <div className="flex items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); openDetailModal(row); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer" title="Detail">
            <Eye size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openModal(row); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openUploadModal(row); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all cursor-pointer" title="Upload Dokumen Agent">
            <UploadCloud size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleGenerateAccount(row); }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${row.hasAccount
              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700'
              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            title={row.hasAccount ? "Reset Kredensial (Password)" : "Buat Akun Portal Agent"}
          >
            <Key size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer" title="Hapus">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const openDetailModal = (item: AgentData) => {
    setSelectedAgentDetail(item);
    setIsDetailModalOpen(true);
  };

  const openUploadModal = (item: AgentData) => {
    setSelectedUploadAgent(item);
    setIsUploadModalOpen(true);
  };

  const openModal = (item?: AgentData) => {
    if (item) {
      setFormData({
        id: item.id,
        nik: item.nik,
        nama: item.nama,
        alamat: item.alamat || '',
        noHp: item.noHp,
        email: item.email || '',
        type: item.type || 'PRIBADI',
        namaBank: item.namaBank || '',
        noRekening: item.noRekening || '',
        atasNamaRekening: item.atasNamaRekening || '',
        feeMarketingPct: item.feeMarketingPct ?? '',
        potonganPph: item.potonganPph ?? '',
        pics: item.pics && item.pics.length > 0 ? item.pics : [{ nama: '', noHp: '', alamat: '' }]
      });
      setIsEditing(true);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePICChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newPics = [...prev.pics];
      newPics[index] = { ...newPics[index], [name]: value };
      return { ...prev, pics: newPics };
    });

    const errorKey = `pics.${index}.${name}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleAddPIC = () => {
    setFormData((prev) => ({
      ...prev,
      pics: [...prev.pics, { nama: '', noHp: '', alamat: '' }]
    }));
  };

  const handleRemovePIC = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pics: prev.pics.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nik.trim()) newErrors.nik = 'NIK wajib diisi';
    if (formData.nik.trim().length !== 16 && formData.nik.trim().length !== 15) newErrors.nik = 'NIK tidak valid (minimal 15-16 digit)';
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;


    const picMapping: number[] = [];
    const validPics: PicAgentData[] = [];

    formData.pics.forEach((pic, index) => {
      if (pic.nama.trim() !== '' || pic.noHp.trim() !== '') {
        picMapping.push(index);
        validPics.push(pic);
      }
    });

    const payload: CreateAgentDTO = {
      nik: formData.nik,
      nama: formData.nama,
      noHp: formData.noHp,
      email: formData.email || undefined,
      alamat: formData.alamat || undefined,
      type: formData.type,
      namaBank: formData.namaBank || null,
      noRekening: formData.noRekening || null,
      atasNamaRekening: formData.atasNamaRekening || null,
      feeMarketingPct: formData.feeMarketingPct !== '' ? Number(formData.feeMarketingPct) : undefined,
      potonganPph: formData.potonganPph !== '' ? Number(formData.potonganPph) : undefined,
      pics: validPics.length > 0 ? validPics : undefined,
    };

    try {
      if (isEditing && formData.id) {
        await updateMutation.mutateAsync({ id: formData.id as number, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (error: any) {
      const { message, errors: backendErrors } = handleApiError(error);

      if (backendErrors && Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};

        backendErrors.forEach((err: { field: string; message: string }) => {
          const fieldName = err.field.replace(/\[(\d+)\]/g, '.$1');
          const parts = fieldName.split('.');

          if (parts[0] === 'pics' && parts.length >= 3) {
            const backendIdx = parseInt(parts[1], 10);
            const frontendIdx = picMapping[backendIdx] !== undefined ? picMapping[backendIdx] : backendIdx;
            const propName = parts.slice(2).join('.');
            fieldErrors[`pics.${frontendIdx}.${propName}`] = err.message;
          } else {
            fieldErrors[err.field] = err.message;
          }
        });

        setErrors(fieldErrors);
      } else {
        alert(message);
      }
    }
  };

  const handleDelete = async (item: AgentData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus agen ${item.nama}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        const { message } = handleApiError(error);
        alert(message);
      }
    }
  };

  const handleGenerateAccount = async (agent: AgentData) => {
    if (!agent.email) {
      alert("Gagal: Email agent masih kosong. Silakan edit dan isi email terlebih dahulu!");
      return;
    }
    const actionText = agent.hasAccount ? 'me-reset password' : 'membuat akun portal';
    const password = window.prompt(`Masukkan password baru untuk ${actionText} ${agent.nama} (Min. 6 karakter):`);

    if (password === null) return; // Jika user menekan Cancel
    if (password.length < 6) {
      alert("Password harus minimal 6 karakter!");
      return;
    }

    try {
      // API merespons dengan struktur success & message
      const res = await generateAccountMutation.mutateAsync({ id: agent.id, password });
      alert(res.message || `Berhasil! Kredensial untuk ${agent.nama} telah disimpan. Silakan login menggunakan email: ${agent.email}`);
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };

  const handleUploadDoc = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUploadAgent) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      e.target.value = '';
      return;
    }
    try {
      await uploadDocMutation.mutateAsync({ id: selectedUploadAgent.id, docType, file });
      alert(`Dokumen berhasil diunggah!`);

      setSelectedUploadAgent(prev => prev ? { ...prev, [docType]: URL.createObjectURL(file) } : prev);
      if (selectedAgentDetail?.id === selectedUploadAgent.id) {
        setSelectedAgentDetail(prev => prev ? { ...prev, [docType]: URL.createObjectURL(file) } : prev);
      }
    } catch (err: any) {
      const { message } = handleApiError(err);
      alert(message);
    } finally {
      e.target.value = '';
    }
  };

  const expandedRowRender = (row: AgentData) => {
    const relatedSales = row.penjualan || [];
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Riwayat Penjualan Agent: <span className="text-blue-600">{row.nama}</span>
        </h4>
        {relatedSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">No. Transaksi</th>
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Kavling</th>
                  <th className="px-4 py-3 text-right font-bold">Nilai Penjualan (Rp)</th>
                  <th className="px-4 py-3 rounded-r-lg text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {relatedSales.map((sale: PenjualanAgentData) => (
                  <tr
                    key={sale.id}
                    onClick={() => {
                      const detail = penjualanList.find((p: any) => p.id === sale.noTransaksi);
                      setSelectedDetailPenjualan(detail || sale);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{sale.noTransaksi}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(sale.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium">{sale.customer?.nama || '-'}</td>
                    <td className="px-4 py-3">
                      {sale.kavling?.perumahan?.nama} ({sale.kavling?.blok}-{sale.kavling?.nomorUnit})
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">
                      {formatRupiah(sale.hargaJual)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${sale.status.toUpperCase() === 'LUNAS' ? 'bg-green-100 text-green-700' : sale.status.toUpperCase() === 'BATAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada riwayat penjualan untuk agent ini.
          </p>
        )}
      </div>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Agent Marketing"
        columns={columns}
        data={agentData}
        onAdd={() => openModal()}
        expandedRowRender={expandedRowRender}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Agent" : "Tambah Data Agent"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Utama Agent</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipe Agent"
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={[
                  { value: 'PRIBADI', label: 'Pribadi' },
                  { value: 'PERUSAHAAN', label: 'Perusahaan' }
                ]}
              />
              <Input label="NIK" name="nik" value={formData.nik} onChange={handleChange} error={errors.nik} placeholder="Masukkan NIK/No. KTP" />
              <Input label="Nama Lengkap / Perusahaan" name="nama" value={formData.nama} onChange={handleChange} error={errors.nama} placeholder="Masukkan nama agent" />
              <Input label="No. WhatsApp / HP" name="noHp" value={formData.noHp} onChange={handleChange} error={errors.noHp} placeholder="08xxxxxxxxxx" />
              <Input label="Email (Opsional)" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
              <Input label="Fee Marketing (%)" name="feeMarketingPct" type="number" step="any" value={formData.feeMarketingPct} onChange={handleChange} placeholder="Contoh: 2.5" />
              <Input label="Potongan PPh (%)" name="potonganPph" type="number" step="any" value={formData.potonganPph} onChange={handleChange} placeholder="Contoh: 2.5" />
              <div className="md:col-span-2">
                <Input label="Alamat Lengkap (Opsional)" name="alamat" value={formData.alamat} onChange={handleChange} error={errors.alamat} placeholder="Masukkan alamat lengkap agent" />
              </div>
              <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Rekening Bank (Opsional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Nama Bank" name="namaBank" value={formData.namaBank} onChange={handleChange} error={errors.namaBank} placeholder="Contoh: BCA / BSI" />
                  <Input label="Nomor Rekening" name="noRekening" value={formData.noRekening} onChange={handleChange} error={errors.noRekening} placeholder="Masukkan No. Rek" />
                  <Input label="Atas Nama Rekening" name="atasNamaRekening" value={formData.atasNamaRekening} onChange={handleChange} error={errors.atasNamaRekening} placeholder="A/N Rekening" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Daftar PIC Agent (Opsional)</h4>
                <p className="text-xs text-gray-500">Tambahkan kontak PIC untuk di bawah agent ini</p>
              </div>
              <button type="button" onClick={handleAddPIC} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-black rounded-lg transition-colors cursor-pointer shadow-sm">
                + Tambah PIC
              </button>
            </div>

            <div className="space-y-4">
              {formData.pics.map((pic, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg relative">
                  {formData.pics.length > 1 && (
                    <button type="button" onClick={() => handleRemovePIC(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer">Hapus</button>
                  )}
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">PIC #{index + 1}</p>

                  {/* BAGIAN YANG DIUBAH: Penambahan props error={errors[`pics.${index}.namaField`]} */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama PIC"
                      name="nama"
                      value={pic.nama}
                      onChange={(e) => handlePICChange(index, e)}
                      error={errors[`pics.${index}.nama`]}
                      placeholder="Masukkan nama PIC"
                    />
                    <Input
                      label="No. Telepon / HP PIC"
                      name="noHp"
                      value={pic.noHp}
                      onChange={(e) => handlePICChange(index, e)}
                      error={errors[`pics.${index}.noHp`]}
                      placeholder="08xxxxxxxxxx"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Alamat PIC (Opsional)"
                        name="alamat"
                        value={pic.alamat || ''}
                        onChange={(e) => handlePICChange(index, e)}
                        error={errors[`pics.${index}.alamat`]}
                        placeholder="Masukkan alamat lengkap PIC"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL UPLOAD DOKUMEN AGENT */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={`Upload Dokumen Agent: ${selectedUploadAgent?.nama}`}>
        {selectedUploadAgent && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(selectedUploadAgent.type === 'PRIBADI'
                ? ['fileKtp', 'fileNpwp', 'kwitansiBookingFee']
                : ['fileSuratKeterangan', 'fileKtpDirektur', 'fileNpwpPerusahaan']
              ).map((type) => (
                <div key={type} className="flex flex-col gap-3 p-4 border rounded-2xl bg-slate-50/50 hover:bg-white transition-all group shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 text-center">
                    {type.replace('file', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div
                    onClick={() => selectedUploadAgent[type as keyof AgentData] && setPreviewImage(selectedUploadAgent[type as keyof AgentData] as string)}
                    className={`aspect-[4/3] w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all ${selectedUploadAgent[type as keyof AgentData] ? 'border-slate-200 cursor-zoom-in' : 'border-slate-300 bg-slate-100'}`}
                  >
                    {selectedUploadAgent[type as keyof AgentData] ? (
                      <img src={selectedUploadAgent[type as keyof AgentData] as string} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 italic">KOSONG</span>
                    )}
                  </div>
                  <FileInput
                    label="Upload / Ganti"
                    accept="image/*,.pdf"
                    onChange={(e) => handleUploadDoc(type, e)}
                    disabled={uploadDocMutation.isPending}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 cursor-pointer transition-all">
                Tutup Dokumen
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DETAIL AGENT */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Informasi Detail Agent">
        {selectedAgentDetail && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Biodata Agent</h4>
                <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] uppercase font-bold tracking-wider">{selectedAgentDetail.type}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nama Agent</p>
                  <p className="text-sm font-bold text-slate-900">{selectedAgentDetail.nama}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">NIK</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.nik}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">No. WhatsApp / Telepon</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.noHp}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Email</p>
                  <p className="text-sm font-medium text-slate-800">{selectedAgentDetail.email || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fee Marketing (%)</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.feeMarketingPct ?? '-'} %</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Potongan PPh (%)</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.potonganPph ?? '-'} %</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Alamat Lengkap</p>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">{selectedAgentDetail.alamat || '-'}</p>
                </div>
                <div className="md:col-span-2 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bank Agent</p>
                    <p className="text-sm font-bold text-slate-900">{selectedAgentDetail.namaBank || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nomor Rekening</p>
                    <p className="text-lg font-black text-indigo-600 font-mono tabular-nums">{selectedAgentDetail.noRekening || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Atas Nama (A/N)</p>
                    <p className="text-sm font-bold text-slate-900">{selectedAgentDetail.atasNamaRekening || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedAgentDetail.type && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Dokumen / Berkas Agent</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(selectedAgentDetail.type === 'PRIBADI'
                    ? ['fileKtp', 'fileNpwp', 'kwitansiBookingFee']
                    : ['fileSuratKeterangan', 'fileKtpDirektur', 'fileNpwpPerusahaan']
                  ).map((type) => (
                    <div key={type} className="flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 text-center">
                        {type.replace('file', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div
                        onClick={() => selectedAgentDetail[type as keyof AgentData] && setPreviewImage(selectedAgentDetail[type as keyof AgentData] as string)}
                        className={`aspect-[4/3] rounded-xl border flex items-center justify-center overflow-hidden transition-all ${selectedAgentDetail[type as keyof AgentData] ? 'border-slate-200 cursor-zoom-in bg-white' : 'border-slate-100 bg-slate-50'}`}
                      >
                        {selectedAgentDetail[type as keyof AgentData] ? (
                          <img src={selectedAgentDetail[type as keyof AgentData] as string} alt={type} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 italic text-center px-2">Belum Upload</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAgentDetail.pics && selectedAgentDetail.pics.length > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Kontak Tim / PIC Pendukung</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedAgentDetail.pics.map((pic, idx) => (
                    <div key={pic.id || idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                      <p className="text-sm font-bold text-slate-800 mb-1">{pic.nama}</p>
                      <p className="text-xs text-slate-500 tabular-nums mb-1">📞 {pic.noHp}</p>
                      <p className="text-xs text-slate-400 truncate">📍 {pic.alamat || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer shadow-md"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL LIGHTBOX PREVIEW GAMBAR */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20">Tutup</button>
          </div>
        </div>
      </Modal>

      {/* MODAL DETAIL PENJUALAN KETIKA ROW DI KLIK */}
      <Modal isOpen={!!selectedDetailPenjualan} onClose={() => setSelectedDetailPenjualan(null)} title="Informasi Transaksi Penjualan">
        {selectedDetailPenjualan && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer / Pembeli</p>
                  <p className="text-lg font-black text-slate-900">{selectedDetailPenjualan.nama || selectedDetailPenjualan.customer?.nama || '-'}</p>
                  <p className="text-sm text-slate-500 font-medium">Transaksi: {selectedDetailPenjualan.id || selectedDetailPenjualan.noTransaksi}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedDetailPenjualan.status === 'LUNAS' ? 'bg-green-100 text-green-800' :
                    selectedDetailPenjualan.status === 'BATAL' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {selectedDetailPenjualan.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kavling</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.perumahan || selectedDetailPenjualan.kavling?.perumahan?.nama} - Blok {selectedDetailPenjualan.blok || selectedDetailPenjualan.kavling?.blok} No. {selectedDetailPenjualan.nomorUnit || selectedDetailPenjualan.kavling?.nomorUnit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Metode Pembayaran</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.caraPembayaran?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Harga Jual</p>
                  <p className="text-sm font-bold text-blue-700">
                    {selectedDetailPenjualan.hargaJual ? formatRupiah(selectedDetailPenjualan.hargaJual) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Transaksi</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.tanggal ? new Date(selectedDetailPenjualan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedDetailPenjualan(null)} className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black transition-colors cursor-pointer shadow-md">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Agents;