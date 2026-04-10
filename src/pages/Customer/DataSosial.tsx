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
    { header: 'Pekerjaan', accessor: 'pekerjaan', render: (val: string | null) => val || '-' },
    { header: 'Bank', accessor: 'bank', render: (val: string | null) => val || '-' },
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

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
    setErrors({});
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
    setErrors({});

    if (!validateForm()) return;

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      closeModal();
    } catch (err: any) {
      const responseData = err.response?.data;


      if (responseData?.success === false && responseData?.error) {
        if (Array.isArray(responseData.error)) {
          const backendErrors: Partial<Record<keyof CreateCustomerDTO, string>> = {};
          responseData.error.forEach((item: { field: string; message: string }) => {

            backendErrors[item.field as keyof CreateCustomerDTO] = item.message;
          });
          setErrors(backendErrors);
        } else {
          alert(responseData.message || "Terjadi kesalahan validasi");
        }
      } else {
        alert("Gagal terhubung ke server. Silakan coba lagi.");
      }
    }
  };

  const handleDelete = async (item: CustomerData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data ${item.nama}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        alert(error.response?.data?.message || "Gagal menghapus data");
      }
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
        onClose={closeModal}
        title={editingId ? "Edit Data Sosial Customer" : "Tambah Data Sosial Customer"}
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
              label="NIK (16 Digit)"
              name="nikKtp"
              value={formData.nikKtp}
              onChange={handleChange}
              error={errors.nikKtp}
              maxLength={16}
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
              error={errors.pekerjaan}
              placeholder="PNS / Swasta / Wiraswasta"
            />
            <Input
              label="Perusahaan"
              name="perusahaan"
              value={formData.perusahaan}
              onChange={handleChange}
              error={errors.perusahaan}
              placeholder="Nama Perusahaan"
            />
            <Input
              label="Bank / Bank KPR"
              name="bank"
              value={formData.bank}
              onChange={handleChange}
              error={errors.bank}
              placeholder="BCA / Mandiri / BSI"
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
              error={errors.alamatTinggal}
              placeholder="Masukkan alamat domisili"
            />
            <Input
              label="Alamat Korespondensi"
              name="alamatKoresponden"
              value={formData.alamatKoresponden}
              onChange={handleChange}
              error={errors.alamatKoresponden}
              placeholder="Alamat surat-menyurat"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-8 py-2 text-sm font-bold text-white bg-black rounded-xl uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-black/10"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DataSosial;