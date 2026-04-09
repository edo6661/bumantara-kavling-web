import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";


interface CustomerData {
  id: string;
  nikKtp: string;
  nama: string;
  noHp: string;
  email: string;
  pekerjaan: string;
  perusahaan: string;
  bank: string;
  alamatKtp: string;
  alamatTinggal: string;
  alamatKoresponden: string;
}

const initialFormState: CustomerData = {
  id: '',
  nikKtp: '',
  nama: '',
  noHp: '',
  email: '',
  pekerjaan: '',
  perusahaan: '',
  bank: '',
  alamatKtp: '',
  alamatTinggal: '',
  alamatKoresponden: ''
};

const DataSosial = () => {

  const [data, setData] = useState<CustomerData[]>([
    {
      id: '1',
      nama: 'Budi Santoso',
      alamatKtp: 'Jl. Merdeka No. 1, Tangerang',
      alamatTinggal: 'Jl. Merdeka No. 1, Tangerang',
      alamatKoresponden: 'Jl. Merdeka No. 1, Tangerang',
      nikKtp: '3671012345670001',
      noHp: '081234567890',
      email: 'budi@example.com',
      pekerjaan: 'Pegawai Swasta',
      perusahaan: 'PT Maju Jaya',
      bank: 'BCA'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerData>(initialFormState);
  const [errors, setErrors] = useState<Partial<CustomerData>>({});
  const [isEditing, setIsEditing] = useState(false);


  const columns = [
    { header: 'NIK', accessor: 'nikKtp' },
    { header: 'Nama Lengkap', accessor: 'nama' },
    { header: 'No. WhatsApp', accessor: 'noHp' },
    { header: 'Pekerjaan', accessor: 'pekerjaan' },
    { header: 'Bank', accessor: 'bank' },
  ];

  const openModal = (item?: CustomerData) => {
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

    if (errors[name as keyof CustomerData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<CustomerData> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.nikKtp.trim() || formData.nikKtp.length !== 16) {
      newErrors.nikKtp = 'NIK wajib diisi 16 digit';
    }
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';
    if (!formData.alamatKtp.trim()) newErrors.alamatKtp = 'Alamat KTP wajib diisi';

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

  const handleDelete = (item: CustomerData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data ${item.nama}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Sosial Customer"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as CustomerData)}
        onDelete={(item) => handleDelete(item as CustomerData)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Sosial Customer" : "Tambah Data Sosial Customer"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Sesuai KTP"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              error={errors.nama}
              placeholder="Masukkan nama lengkap"
            />
            <Input
              label="NIK"
              name="nikKtp"
              value={formData.nikKtp}
              onChange={handleChange}
              error={errors.nikKtp}
              placeholder="Masukkan 16 digit NIK"
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
              label="Pekerjaan"
              name="pekerjaan"
              value={formData.pekerjaan}
              onChange={handleChange}
              placeholder="PNS / Swasta / Wiraswasta"
            />
            <Input
              label="Perusahaan"
              name="perusahaan"
              value={formData.perusahaan}
              onChange={handleChange}
              placeholder="Nama Perusahaan"
            />
            <Input
              label="Bank / Bank KPR"
              name="bank"
              value={formData.bank}
              onChange={handleChange}
              placeholder="BCA / Mandiri / BTN"
            />
            <Input
              label="Alamat Sesuai KTP"
              name="alamatKtp"
              value={formData.alamatKtp}
              onChange={handleChange}
              error={errors.alamatKtp}
              placeholder="Masukkan alamat KTP"
            />
            <Input
              label="Alamat Tinggal Sekarang"
              name="alamatTinggal"
              value={formData.alamatTinggal}
              onChange={handleChange}
              placeholder="Masukkan alamat domisili"
            />
            <Input
              label="Alamat Korespondensi"
              name="alamatKoresponden"
              value={formData.alamatKoresponden}
              onChange={handleChange}
              placeholder="Masukkan alamat surat-menyurat"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800 cursor-pointer"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DataSosial;