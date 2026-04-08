import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";

interface SPRData {
  id: string;
  nama: string;
  noTelepon: string;
  perumahan: string;
  blok: string;
}

const initialFormState: SPRData = {
  id: '',
  nama: '',
  noTelepon: '',
  perumahan: '',
  blok: '',
};

const SPR = () => {
  const [data, setData] = useState<SPRData[]>([
    {
      id: '1',
      nama: 'Budi Santoso',
      noTelepon: '081234567890',
      perumahan: 'Griya Indah Pesona',
      blok: 'A-01',
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SPRData>(initialFormState);
  const [errors, setErrors] = useState<Partial<SPRData>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'Nama', accessor: 'nama' },
    { header: 'No Telepon', accessor: 'noTelepon' },
    { header: 'Perumahan', accessor: 'perumahan' },
    { header: 'Blok', accessor: 'blok' },
    {
      header: 'File SPR',
      accessor: 'filePdfSpr',
      render: (val: string) => val ? (
        <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">{val}</span>
      ) : (
        <span className="text-gray-400 text-xs">- Belum ada -</span>
      )
    },
  ];

  const openModal = (item?: SPRData) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SPRData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<SPRData> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noTelepon.trim()) newErrors.noTelepon = 'No Telepon wajib diisi';
    if (!formData.perumahan.trim()) newErrors.perumahan = 'Perumahan wajib diisi';
    if (!formData.blok.trim()) newErrors.blok = 'Blok wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
    } else {
      const newData = { ...formData, id: Date.now().toString() };
      setData((prev) => [...prev, newData]);
    }
    closeModal();
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Surat Pesanan Rumah (SPR)"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
      // onDelete sengaja tidak diteruskan agar tombol hapus tidak muncul
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data SPR" : "Tambah Data SPR"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              error={errors.nama}
              placeholder="Masukkan nama lengkap"
            />
            <Input
              label="No Telepon / HP"
              name="noTelepon"
              value={formData.noTelepon}
              onChange={handleChange}
              error={errors.noTelepon}
              placeholder="08xxxxxxxxxx"
            />
            <Input
              label="Perumahan"
              name="perumahan"
              value={formData.perumahan}
              onChange={handleChange}
              error={errors.perumahan}
              placeholder="Nama perumahan"
            />
            <Input
              label="Blok / Unit"
              name="blok"
              value={formData.blok}
              onChange={handleChange}
              error={errors.blok}
              placeholder="Contoh: A-01"
            />
          </div>


          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 cursor-pointer"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SPR;