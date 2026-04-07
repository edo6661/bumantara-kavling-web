import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";

interface BankData {
  id: string;
  namaBank: string;
  noRekening: string;
  atasNama: string;
}

const initialFormState: BankData = {
  id: '',
  namaBank: '',
  noRekening: '',
  atasNama: '',
};

const Bank = () => {
  const [data, setData] = useState<BankData[]>([
    {
      id: '1',
      namaBank: 'Bank BSI',
      noRekening: '7326575644',
      atasNama: 'PT. Bintang Safana Gajah'
    },
    {
      id: '2',
      namaBank: 'Bank BSI',
      noRekening: '7326573692',
      atasNama: 'PT. Bintang Safana Mahligai'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<BankData>(initialFormState);
  const [errors, setErrors] = useState<Partial<BankData>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'Nama Bank', accessor: 'namaBank' },
    { header: 'No Rekening', accessor: 'noRekening' },
    { header: 'Atas Nama (a/n)', accessor: 'atasNama' },
  ];

  const openModal = (item?: BankData) => {
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
    if (errors[name as keyof BankData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<BankData> = {};
    if (!formData.namaBank.trim()) newErrors.namaBank = 'Nama Bank wajib diisi';
    if (!formData.noRekening.trim()) newErrors.noRekening = 'No Rekening wajib diisi';
    if (!formData.atasNama.trim()) newErrors.atasNama = 'Atas Nama wajib diisi';

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

  const handleDelete = (item: BankData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data ${item.namaBank} - ${item.noRekening}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Bank"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Bank" : "Tambah Data Bank"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Nama Bank"
              name="namaBank"
              value={formData.namaBank}
              onChange={handleChange}
              error={errors.namaBank}
              placeholder="Contoh: Bank BSI"
            />
            <Input
              label="No Rekening"
              name="noRekening"
              value={formData.noRekening}
              onChange={handleChange}
              error={errors.noRekening}
              placeholder="Masukkan nomor rekening"
            />
            <Input
              label="Atas Nama"
              name="atasNama"
              value={formData.atasNama}
              onChange={handleChange}
              error={errors.atasNama}
              placeholder="Contoh: PT. Bintang Safana"
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

export default Bank;