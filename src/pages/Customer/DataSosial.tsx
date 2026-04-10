// src/pages/Customer/DataSosial.tsx
import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import PageLoader from "../PageLoader";
import {
  useGetCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer
} from "../../hooks/queries/useCustomer";
import type { CustomerData, CreateCustomerDTO } from "../../services/customer.service";

const initialFormState: CreateCustomerDTO = {
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
  const { data: customers = [], isLoading } = useGetCustomers();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerDTO>(initialFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCustomerDTO, string>>>({});

  const columns = [
    { header: 'NIK', accessor: 'nikKtp' },
    { header: 'Nama Lengkap', accessor: 'nama' },
    { header: 'No. WhatsApp', accessor: 'noHp' },
    { header: 'Pekerjaan', accessor: 'pekerjaan', render: (val: string) => val || '-' },
    { header: 'Bank', accessor: 'bank', render: (val: string) => val || '-' },
  ];

  const openModal = (item?: CustomerData) => {
    if (item) {
      setFormData({
        nikKtp: item.nikKtp,
        nama: item.nama,
        noHp: item.noHp,
        email: item.email || '',
        pekerjaan: item.pekerjaan || '',
        perusahaan: item.perusahaan || '',
        bank: item.bank || '',
        alamatKtp: item.alamatKtp,
        alamatTinggal: item.alamatTinggal || '',
        alamatKoresponden: item.alamatKoresponden || ''
      });
      setEditingId(item.id);
    } else {
      setFormData(initialFormState);
      setEditingId(null);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateCustomerDTO]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CreateCustomerDTO, string>> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (formData.nikKtp.length !== 16) newErrors.nikKtp = 'NIK harus 16 digit';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';
    if (!formData.alamatKtp.trim()) newErrors.alamatKtp = 'Alamat KTP wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async (item: CustomerData) => {
    if (window.confirm(`Hapus data ${item.nama}?`)) {
      await deleteMutation.mutateAsync(item.id);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Sosial Customer"
        columns={columns}
        data={customers}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as CustomerData)}
        onDelete={(item) => handleDelete(item as CustomerData)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Data Sosial" : "Tambah Data Sosial"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Sesuai KTP" name="nama" value={formData.nama} onChange={handleChange} error={errors.nama} />
            <Input label="NIK (16 Digit)" name="nikKtp" value={formData.nikKtp} onChange={handleChange} error={errors.nikKtp} maxLength={16} />
            <Input label="No. WhatsApp" name="noHp" value={formData.noHp} onChange={handleChange} error={errors.noHp} />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
            <Input label="Pekerjaan" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange} />
            <Input label="Perusahaan" name="perusahaan" value={formData.perusahaan} onChange={handleChange} />
            <Input label="Bank" name="bank" value={formData.bank} onChange={handleChange} />
            <Input label="Alamat KTP" name="alamatKtp" value={formData.alamatKtp} onChange={handleChange} error={errors.alamatKtp} />
            <Input label="Alamat Tinggal" name="alamatTinggal" value={formData.alamatTinggal} onChange={handleChange} />
            <Input label="Alamat Koresponden" name="alamatKoresponden" value={formData.alamatKoresponden} onChange={handleChange} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DataSosial;