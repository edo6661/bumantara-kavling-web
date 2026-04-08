import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import FileInput from "../../components/shared/FileInput";
import { formatRupiah } from "../../utils/formatters";
interface SpkData {
  id: string;
  noSpk: string;
  tanggalSpk: string;
  judulPekerjaan: string;
  lokasi: string;
  jangkaWaktu: number;
  nilaiKontrak: number;
  namaPihakPertama: string;
  nikPihakPertama: string;
  namaPihakKedua: string;
  nikPihakKedua: string;
  alamatPihakKedua: string;
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  fileSpk: string;
}
const initialFormState: SpkData = {
  id: '',
  noSpk: '',
  tanggalSpk: '',
  judulPekerjaan: '',
  lokasi: '',
  jangkaWaktu: 0,
  nilaiKontrak: 0,
  namaPihakPertama: '',
  nikPihakPertama: '',
  namaPihakKedua: '',
  nikPihakKedua: '',
  alamatPihakKedua: '',
  namaBank: '',
  noRekening: '',
  atasNamaRekening: '',
  fileSpk: '',
};
const SPK = () => {
  const [data, setData] = useState<SpkData[]>([
    {
      id: 'SPK-001',
      noSpk: '026/SPK/AA24/FTR/PSC/III/2026',
      tanggalSpk: '2026-03-30',
      judulPekerjaan: 'Pembangunan Rumah Tinggal di Perumahan Puri Safana Cikeas (8 Unit)',
      lokasi: 'Jl. Bojong Nangka Rt.001 Rw.012 Kel. Cikeas Udik, Kec. Gunung Putri Kab. Bogor',
      jangkaWaktu: 120,
      nilaiKontrak: 1330626827.04,
      namaPihakPertama: 'Yusdi Nurfauzi, ST',
      nikPihakPertama: '3671081002770009',
      namaPihakKedua: 'Fathor Rosid',
      nikPihakKedua: '3201021208780028',
      alamatPihakKedua: 'Lembur Rt 002 Rw 009 Kel. Bojong Kulur Kec. Gunung Putri, Kab Bogor, Jawa Barat',
      namaBank: 'BCA',
      noRekening: '5725393927',
      atasNamaRekening: 'Saiful Hasan',
      fileSpk: 'SPK_026_Fathor_Rosid.pdf',
    }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SpkData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof SpkData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const columns = [
    { header: 'No. SPK', accessor: 'noSpk' },
    { header: 'Judul Pekerjaan', accessor: 'judulPekerjaan' },
    { header: 'Pihak Kedua (Vendor)', accessor: 'namaPihakKedua' },
    {
      header: 'Nilai Kontrak',
      accessor: 'nilaiKontrak',
      render: (val: number) => formatRupiah(val)
    },
    {
      header: 'Waktu',
      accessor: 'jangkaWaktu',
      render: (val: number) => `${val} Hari`
    },
    {
      header: 'Dokumen',
      accessor: 'fileSpk',
      render: (val: string) => val ? (
        <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded">{val}</span>
      ) : (
        <span className="text-gray-400 text-xs">-</span>
      )
    },
  ];
  const openModal = (item?: SpkData) => {
    if (item) {
      setFormData(item);
      setIsEditing(true);
    } else {
      setFormData({ ...initialFormState, tanggalSpk: new Date().toISOString().split('T')[0] });
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (errors[name as keyof SpkData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof SpkData) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldName]: file.name }));
    }
  };
  const validateForm = () => {
    const newErrors: Partial<Record<keyof SpkData, string>> = {};
    if (!formData.noSpk.trim()) newErrors.noSpk = 'Nomor SPK wajib diisi';
    if (!formData.judulPekerjaan.trim()) newErrors.judulPekerjaan = 'Judul pekerjaan wajib diisi';
    if (formData.nilaiKontrak <= 0) newErrors.nilaiKontrak = 'Nilai kontrak harus lebih dari 0';
    if (!formData.namaPihakKedua.trim()) newErrors.namaPihakKedua = 'Nama vendor wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
    } else {
      const newId = `SPK-${Date.now()}`;
      setData((prev) => [...prev, { ...formData, id: newId }]);
    }
    closeModal();
  };
  const handleDelete = (item: SpkData) => {
    if (window.confirm(`Hapus data SPK ${item.noSpk}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Surat Perjanjian Kerja (SPK)"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />
      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit SPK" : "Buat SPK Baru"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Informasi Proyek */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">1. Informasi Pekerjaan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nomor SPK" name="noSpk" value={formData.noSpk} onChange={handleChange} error={errors.noSpk} />
              <Input label="Tanggal SPK" type="date" name="tanggalSpk" value={formData.tanggalSpk} onChange={handleChange} />
              <div className="md:col-span-2">
                <Input label="Judul Pekerjaan" name="judulPekerjaan" value={formData.judulPekerjaan} onChange={handleChange} error={errors.judulPekerjaan} />
              </div>
              {/* step="any" ditambahkan agar form mengizinkan input koma/desimal pada nilai kontrak */}
              <Input label="Nilai Kontrak (Rp)" type="number" step="any" name="nilaiKontrak" value={formData.nilaiKontrak === 0 ? '' : formData.nilaiKontrak} onChange={handleChange} error={errors.nilaiKontrak} />
              <Input label="Jangka Waktu (Hari)" type="number" name="jangkaWaktu" value={formData.jangkaWaktu === 0 ? '' : formData.jangkaWaktu} onChange={handleChange} />
            </div>
          </div>
          {/* Section 2: Pihak Pertama & Kedua */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">2. Data Para Pihak</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pihak Pertama (Pemberi Tugas)</p>
                <Input label="Nama" name="namaPihakPertama" value={formData.namaPihakPertama} onChange={handleChange} />
                <Input label="NIK" name="nikPihakPertama" value={formData.nikPihakPertama} onChange={handleChange} />
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pihak Kedua (Pemborong)</p>
                <Input label="Nama Vendor" name="namaPihakKedua" value={formData.namaPihakKedua} onChange={handleChange} error={errors.namaPihakKedua} />
                <Input label="NIK Vendor" name="nikPihakKedua" value={formData.nikPihakKedua} onChange={handleChange} />
                <Input label="Alamat" name="alamatPihakKedua" value={formData.alamatPihakKedua} onChange={handleChange} />
              </div>
            </div>
          </div>
          {/* Section 3: Pembayaran & File */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">3. Pembayaran & Dokumen</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input label="Nama Bank" name="namaBank" value={formData.namaBank} onChange={handleChange} />
              <Input label="No Rekening" name="noRekening" value={formData.noRekening} onChange={handleChange} />
              <Input label="Atas Nama" name="atasNamaRekening" value={formData.atasNamaRekening} onChange={handleChange} />
            </div>
            <div className="border border-gray-200 p-3 rounded-md bg-white">
              <FileInput label="Upload SPK (PDF)" accept=".pdf" onChange={(e) => handleFileChange(e, 'fileSpk')} />
              {formData.fileSpk && (
                <p className="text-xs text-green-600 mt-1 truncate">File terlampir: {formData.fileSpk}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 transition-colors">
              Simpan SPK
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default SPK;