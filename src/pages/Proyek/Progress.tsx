import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import { formatDate } from "../../utils/formatters";

interface ProgressData {
  id: string;
  kavlingId: string;
  kavlingLabel: string;
  pelaksana: string;
  tanggalLaporan: string;
  tahapanPekerjaan: string;
  persentase: number;
  keterangan: string;
  kendala: string;
  fotoLapangan: string[];
  status: string;
}

const initialFormState: ProgressData = {
  id: '',
  kavlingId: '',
  kavlingLabel: '',
  pelaksana: '',
  tanggalLaporan: '',
  tahapanPekerjaan: '',
  persentase: 0,
  keterangan: '',
  kendala: '',
  fotoLapangan: [],
  status: 'Menunggu Verifikasi',
};

// Mock data kavling (Nantinya diganti dengan data dari API/Backend)
const mockKavlings = [
  { id: 'KAV-001', perumahan: 'Griya Indah Pesona', blok: 'A', unit: '01' },
  { id: 'KAV-002', perumahan: 'Griya Indah Pesona', blok: 'B', unit: '12' },
  { id: 'KAV-003', perumahan: 'Puri Safana', blok: 'C', unit: '05' },
];

const Progress = () => {
  const [data, setData] = useState<ProgressData[]>([
    {
      id: 'PRG-001',
      kavlingId: 'KAV-001',
      kavlingLabel: 'Griya Indah Pesona - Blok A No. 01',
      pelaksana: 'Mandor Supri',
      tanggalLaporan: '2026-04-10',
      tahapanPekerjaan: 'Pekerjaan Pondasi & Sloof',
      persentase: 15,
      keterangan: 'Pengecoran sloof selesai 100%, persiapan naik bata.',
      kendala: 'Cuaca hujan di sore hari.',
      fotoLapangan: ['foto_pondasi_1.jpg', 'foto_sloof.jpg'],
      status: 'Disetujui',
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProgressData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof ProgressData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'Tanggal', accessor: 'tanggalLaporan', render: (val: string) => formatDate(val) },
    { header: 'Kavling', accessor: 'kavlingLabel' },
    { header: 'Tahapan', accessor: 'tahapanPekerjaan' },
    {
      header: 'Progress',
      accessor: 'persentase',
      render: (val: number) => (
        <div className="flex items-center gap-3 min-w-[120px]">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${val === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${val}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-gray-700">{val}%</span>
        </div>
      )
    },
    { header: 'Pelaksana', accessor: 'pelaksana' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        const bg = val === 'Disetujui' ? 'bg-green-100 text-green-800' :
          val === 'Revisi' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg}`}>{val}</span>;
      }
    },
  ];

  const openModal = (item?: ProgressData) => {
    if (item) {
      setFormData(item);
      setIsEditing(true);
    } else {
      setFormData({
        ...initialFormState,
        tanggalLaporan: new Date().toISOString().split('T')[0]
      });
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
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (type === 'number') {
      parsedValue = value === '' ? 0 : Number(value);
      if (name === 'persentase' && parsedValue > 100) parsedValue = 100;
      if (name === 'persentase' && parsedValue < 0) parsedValue = 0;
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    if (errors[name as keyof ProgressData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Mengambil nama semua file yang dipilih dan menyimpannya ke array fotoLapangan
      const fileNames = Array.from(files).map((file) => file.name);
      setFormData((prev) => ({ ...prev, fotoLapangan: fileNames }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ProgressData, string>> = {};
    if (!formData.kavlingId) newErrors.kavlingId = 'Kavling wajib dipilih';
    if (!formData.tahapanPekerjaan) newErrors.tahapanPekerjaan = 'Tahapan wajib dipilih';
    if (formData.persentase < 0 || formData.persentase > 100) newErrors.persentase = 'Progress harus 0 - 100';
    if (!formData.keterangan.trim()) newErrors.keterangan = 'Keterangan progress wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
    } else {
      const newId = `PRG-${String(data.length + 1).padStart(3, '0')}`;
      setData((prev) => [...prev, { ...formData, id: newId }]);
    }
    closeModal();
  };

  const handleDelete = (item: ProgressData) => {
    if (window.confirm(`Hapus laporan progress ${item.kavlingLabel} tanggal ${formatDate(item.tanggalLaporan)}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Laporan Progress Lapangan"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Progress Lapangan" : "Buat Laporan Progress Baru"}>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">1. Identitas Proyek</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Select
                  label="Pilih Kavling"
                  name="kavlingId"
                  value={formData.kavlingId}
                  onChange={(e) => {
                    const selected = mockKavlings.find(k => k.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      kavlingId: selected?.id || '',
                      kavlingLabel: selected ? `${selected.perumahan} - Blok ${selected.blok} No. ${selected.unit}` : ''
                    }));
                    if (errors.kavlingId) setErrors(prev => ({ ...prev, kavlingId: undefined }));
                  }}
                  options={mockKavlings.map(k => ({
                    value: k.id,
                    label: `${k.perumahan} - Blok ${k.blok} No. ${k.unit}`
                  }))}
                  error={errors.kavlingId}
                />
              </div>
              <Input label="Nama Pelaksana/Mandor" name="pelaksana" value={formData.pelaksana} onChange={handleChange} />
              <Input label="Tanggal Laporan" type="date" name="tanggalLaporan" value={formData.tanggalLaporan} onChange={handleChange} />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">2. Status Pekerjaan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tahapan Pekerjaan"
                name="tahapanPekerjaan"
                value={formData.tahapanPekerjaan}
                onChange={handleChange}
                error={errors.tahapanPekerjaan}
                options={[
                  { value: 'Persiapan Lahan', label: 'Persiapan Lahan' },
                  { value: 'Pekerjaan Pondasi & Sloof', label: 'Pekerjaan Pondasi & Sloof' },
                  { value: 'Struktur & Dinding', label: 'Struktur & Dinding' },
                  { value: 'Rangka Atap & Genteng', label: 'Rangka Atap & Genteng' },
                  { value: 'Pemasangan Keramik & Plafon', label: 'Pemasangan Keramik & Plafon' },
                  { value: 'Finishing & Pengecatan', label: 'Finishing & Pengecatan' },
                  { value: 'Siap Serah Terima (100%)', label: 'Siap Serah Terima (100%)' }
                ]}
              />
              <Input
                label="Total Persentase Progress (%)"
                type="number"
                name="persentase"
                value={formData.persentase}
                onChange={handleChange}
                error={errors.persentase}
                placeholder="0 - 100"
              />
              <div className="md:col-span-2">
                <Input
                  label="Keterangan Pekerjaan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  error={errors.keterangan}
                  placeholder="Deskripsikan pekerjaan yang selesai dilakukan hari ini..."
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Kendala di Lapangan (Opsional)"
                  name="kendala"
                  value={formData.kendala}
                  onChange={handleChange}
                  placeholder="Contoh: Hujan deras dari siang, pengiriman bata telat..."
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">3. Dokumentasi</h4>
            <div className="grid grid-cols-1 gap-4">
              {/* Input Multiple File */}
              <FileInput
                label="Foto Lapangan (Bisa pilih lebih dari 1)"
                accept="image/*"
                multiple
                onChange={handleMultipleFileChange}
              />
              {/* List Nama File Yang Terpilih */}
              {formData.fotoLapangan && formData.fotoLapangan.length > 0 && (
                <div className="mt-2 space-y-1 bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 mb-2">File terpilih ({formData.fotoLapangan.length}):</p>
                  {formData.fotoLapangan.map((name, i) => (
                    <p key={i} className="text-xs text-green-600 truncate flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <Select
              label="Status Verifikasi Pusat"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'Menunggu Verifikasi', label: 'Menunggu Verifikasi' },
                { value: 'Disetujui', label: 'Disetujui' },
                { value: 'Revisi', label: 'Butuh Revisi / Laporan Ditolak' }
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 transition-colors cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 transition-colors cursor-pointer">
              Simpan Progress
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Progress;