/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import { ShoppingCart } from "lucide-react";
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
  const { data: penjualanResponse, isLoading: isLoadingPenjualan } = useGetPenjualan({ limit: 500 });
  const penjualanData = penjualanResponse?.items || [];

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
    if (window.confirm(`Apakah Anda yakin ingin menghapus data ${item.nama} ?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        alert(error.response?.data?.message || "Gagal menghapus data");
      }
    }
  };

  const expandedRowRender = (row: CustomerData) => {
    const customerSales = penjualanData.filter((p: any) => p.noIdentitas === row.nikKtp);
    return (
      <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={16} className="text-blue-600" /> Riwayat Pembelian & Penjualan
          </h4>
        </div>
        {customerSales.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[10px]">
                  <th className="p-3 font-bold">Tanggal</th>
                  <th className="p-3 font-bold">Kavling</th>
                  <th className="p-3 font-bold">Pembayaran</th>
                  <th className="p-3 font-bold text-right">Nilai Transaksi</th>
                  <th className="p-3 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerSales.map((item: any) => (
                  <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-600 font-medium">{formatDate(item.tanggal)}</td>
                    <td className="p-3 font-semibold text-slate-800">{item.perumahan} - Blok {item.blok}-{item.nomorUnit}</td>
                    <td className="p-3 text-slate-600">{item.caraPembayaran.replace('_', ' ')}</td>
                    <td className="p-3 text-slate-900 font-bold text-right">{formatRupiah(item.hargaJual)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${item.status === 'LUNAS' ? 'bg-green-100 text-green-700' : item.status === 'BATAL' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic text-center py-4 bg-white rounded-lg border border-slate-100">Belum ada riwayat transaksi penjualan untuk customer ini.</p>
        )
        }
      </div >
    );
  };

  if (isLoading || isLoadingPenjualan) return <PageLoader />;

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Sosial Customer"
        columns={columns}
        data={customers}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as CustomerData)}
        onDelete={(item) => handleDelete(item as CustomerData)}
        expandedRowRender={expandedRowRender}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Data Sosial Customer" : "Tambah Data Sosial Customer"}
      >
        {/* Form nya tetap sama */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Sesuai KTP" name="nama" value={formData.nama} onChange={handleChange} error={errors.nama} placeholder="Masukkan nama lengkap" />
            <Input label="NIK (16 Digit)" name="nikKtp" value={formData.nikKtp} onChange={handleChange} error={errors.nikKtp} maxLength={16} placeholder="Masukkan 16 digit NIK" />
            <Input label="No. WhatsApp / HP" name="noHp" value={formData.noHp} onChange={handleChange} error={errors.noHp} placeholder="08xxxxxxxxxx" />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
            <Input label="Pekerjaan" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange} error={errors.pekerjaan} placeholder="PNS / Swasta / Wiraswasta" />
            <Input label="Perusahaan" name="perusahaan" value={formData.perusahaan} onChange={handleChange} error={errors.perusahaan} placeholder="Nama Perusahaan" />
            <Input label="Bank / Bank KPR" name="bank" value={formData.bank} onChange={handleChange} error={errors.bank} placeholder="BCA / Mandiri / BSI" />
            <Input label="Alamat Sesuai KTP" name="alamatKtp" value={formData.alamatKtp} onChange={handleChange} error={errors.alamatKtp} placeholder="Masukkan alamat KTP" />
            <Input label="Alamat Tinggal Sekarang" name="alamatTinggal" value={formData.alamatTinggal} onChange={handleChange} error={errors.alamatTinggal} placeholder="Masukkan alamat domisili" />
            <Input label="Alamat Korespondensi" name="alamatKoresponden" value={formData.alamatKoresponden} onChange={handleChange} error={errors.alamatKoresponden} placeholder="Alamat surat-menyurat" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button type="button" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50">Batal</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-8 py-2 text-sm font-bold text-white bg-black rounded-xl uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-black/10">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DataSosial;