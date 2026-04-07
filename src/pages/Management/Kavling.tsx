import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import { formatRupiah } from "../../utils/formatters";

interface KavlingMasterData {
  id: string;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  tipe: string;
  hargaJual: number;
  status: string;
  filePbg: string;
  fileSertifikatTanah: string;
  fileNopPbb: string;
}

const initialFormState: KavlingMasterData = {
  id: '',
  perumahan: '',
  blok: '',
  nomorUnit: '',
  tipe: '',
  hargaJual: 0,
  status: 'Available',
  filePbg: '',
  fileSertifikatTanah: '',
  fileNopPbb: '',
};

const Kavling = () => {
  const [data, setData] = useState<KavlingMasterData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<KavlingMasterData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof KavlingMasterData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'Perumahan', accessor: 'perumahan' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { header: 'Blok/Nomor Unit', accessor: 'blok', render: (_: any, row: KavlingMasterData) => `${row.blok} - ${row.nomorUnit}` },
    { header: 'Tipe', accessor: 'tipe' },
    { header: 'Harga Jual', accessor: 'hargaJual', render: (val: number) => formatRupiah(val) },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        const getStatusStyle = (status: string) => {
          switch (status) {
            case 'Available': return 'bg-green-100 text-green-800';
            case 'Booking': return 'bg-blue-100 text-blue-800';
            case 'Terjual': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
          }
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(val)}`}>
            {val}
          </span>
        );
      }
    },
  ];

  const openModal = (item?: KavlingMasterData) => {
    if (item) {
      setFormData(item);
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
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    if (errors[name as keyof KavlingMasterData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldName]: file.name }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof KavlingMasterData, string>> = {};
    if (!formData.perumahan.trim()) newErrors.perumahan = 'Perumahan wajib diisi';
    if (!formData.blok.trim()) newErrors.blok = 'Blok wajib diisi';
    if (!formData.nomorUnit.trim()) newErrors.nomorUnit = 'Nomor Unit wajib diisi';
    if (!formData.tipe.trim()) newErrors.tipe = 'Tipe wajib diisi';
    if (formData.hargaJual <= 0) newErrors.hargaJual = 'Harga Jual harus lebih dari 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
    } else {
      setData((prev) => [...prev, { ...formData, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleDelete = (item: KavlingMasterData) => {
    if (window.confirm(`Hapus data kavling Blok ${item.blok} - ${item.nomorUnit}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Master Data Kavling"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Kavling" : "Tambah Data Kavling"}>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">1. Data Utama</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Perumahan" name="perumahan" value={formData.perumahan} onChange={handleChange} error={errors.perumahan} />
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: 'Available', label: 'Available' },
                  { value: 'Booking', label: 'Booking' },
                  { value: 'Terjual', label: 'Terjual' }
                ]}
              />
              <Input label="Blok" name="blok" value={formData.blok} onChange={handleChange} error={errors.blok} placeholder="Contoh: A" />
              <Input label="Nomor Unit" name="nomorUnit" value={formData.nomorUnit} onChange={handleChange} error={errors.nomorUnit} placeholder="Contoh: 01" />
              <Input label="Tipe" name="tipe" value={formData.tipe} onChange={handleChange} error={errors.tipe} placeholder="Contoh: 45/90" />
              <Input label="Harga Jual (Rp)" type="number" name="hargaJual" value={formData.hargaJual === 0 ? '' : formData.hargaJual} onChange={handleChange} error={errors.hargaJual} />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">2. Upload Dokumen (Opsional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FileInput label="Upload File PBG" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'filePbg')} />
                {formData.filePbg && <p className="text-xs text-green-600 mt-1 truncate">File: {formData.filePbg}</p>}
              </div>
              <div>
                <FileInput label="Sertifikat Tanah" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'fileSertifikatTanah')} />
                {formData.fileSertifikatTanah && <p className="text-xs text-green-600 mt-1 truncate">File: {formData.fileSertifikatTanah}</p>}
              </div>
              <div>
                <FileInput label="NOP PBB" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'fileNopPbb')} />
                {formData.fileNopPbb && <p className="text-xs text-green-600 mt-1 truncate">File: {formData.fileNopPbb}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 transition-colors cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 transition-colors cursor-pointer">
              Simpan Kavling
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Kavling;