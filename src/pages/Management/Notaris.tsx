import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import { formatRupiah } from "../../utils/formatters";

interface NotarisData {
  id: string;
  nama: string;
  biayaAjb: number;
}

const initialFormState: NotarisData = {
  id: '',
  nama: '',
  biayaAjb: 0,
};

const Notaris = () => {
  const [data, setData] = useState<NotarisData[]>([
    {
      id: '1',
      nama: 'Notaris PPAT Budi Hartono, S.H., M.Kn.',
      biayaAjb: 3500000
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NotarisData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof NotarisData, string>>>({});

  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'Nama Notaris', accessor: 'nama' },
    {
      header: 'Biaya Pembuatan AJB',
      accessor: 'biayaAjb',
      render: (val: number) => formatRupiah(val)
    },
  ];

  const openModal = (item?: NotarisData) => {
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
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    if (errors[name as keyof NotarisData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof NotarisData, string>> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama Notaris wajib diisi';
    if (formData.biayaAjb < 0) newErrors.biayaAjb = 'Biaya AJB tidak boleh minus';

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

  const handleDelete = (item: NotarisData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data Notaris ${item.nama}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Data Notaris"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Notaris" : "Tambah Data Notaris"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Nama Notaris"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              error={errors.nama}
              placeholder="Contoh: Notaris Budi Hartono, S.H."
            />
            <Input
              label="Biaya Notaris Pembuatan AJB (Rp)"
              name="biayaAjb"
              type="number"
              value={formData.biayaAjb === 0 ? '' : formData.biayaAjb}
              onChange={handleChange}
              error={errors.biayaAjb as string}
              placeholder="Contoh: 3500000"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 cursor-pointer transition-colors"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Notaris;