import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";

interface AgentData {
  id: string;
  nik: string;
  nama: string;
  alamat: string;
  noHp: string;
  email: string;
}

const initialFormState: AgentData = {
  id: '',
  nik: '',
  nama: '',
  alamat: '',
  noHp: '',
  email: ''
};

const Agents = () => {
  // State untuk Data Table
  const [data, setData] = useState<AgentData[]>([
    {
      id: '1',
      nik: '3671012345670001',
      nama: 'Andi Pratama',
      alamat: 'Jl. Sudirman No. 10, Jakarta',
      noHp: '081234567890',
      email: 'andi@example.com'
    }
  ]);

  // State untuk Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AgentData>(initialFormState);
  const [errors, setErrors] = useState<Partial<AgentData>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'NIK', accessor: 'nik' },
    { header: 'Nama Agent', accessor: 'nama' },
    { header: 'No. WhatsApp', accessor: 'noHp' },
    { header: 'Email', accessor: 'email' },
    { header: 'Alamat', accessor: 'alamat' },
  ];

  // Handler Buka/Tutup Modal
  const openModal = (item?: AgentData) => {
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

  // Handler Perubahan Input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof AgentData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validasi Dasar
  const validateForm = () => {
    const newErrors: Partial<AgentData> = {};
    if (!formData.nik.trim()) newErrors.nik = 'NIK wajib diisi';
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Form (Create / Update)
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

  // Delete Data
  const handleDelete = (item: AgentData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus agen ${item.nama}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Agent Marketing"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Agent" : "Tambah Data Agent"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="NIK"
              name="nik"
              value={formData.nik}
              onChange={handleChange}
              error={errors.nik}
              placeholder="Masukkan 16 digit NIK"
            />
            <Input
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              error={errors.nama}
              placeholder="Masukkan nama agent"
            />
            <Input
              label="No. WhatsApp / HP"
              name="noHp"
              value={formData.noHp}
              onChange={handleChange}
              error={errors.noHp}
              placeholder="08xxxxxxxxxx"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="email@example.com"
            />
            <Input
              label="Alamat Lengkap"
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              placeholder="Masukkan alamat lengkap agent"
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

export default Agents;