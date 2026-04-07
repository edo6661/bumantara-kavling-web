import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import { formatRupiah } from "../../utils/formatters";

// Data dummy untuk simulasi relasi ID -> Nama di Frontend
const mockCustomers = [
  { value: 'CUST-001', label: 'Budi Santoso' },
  { value: 'CUST-002', label: 'Siti Aminah' }
];

const mockKavling = [
  { value: 'KAV-001', label: 'Bumantara - Blok A-01 (Tipe 45/90)' },
  { value: 'KAV-002', label: 'Bumantara - Blok B-12 (Tipe 36/72)' }
];

interface PenjualanData {
  id: string;
  customerId: string;
  kavlingId: string;
  diskonPenjualan: number;
  bank: string;
  caraPembayaran: string;
  nilaiPengajuanKpr: number;
  rekeningTujuan: string;
  bookingFee: number;
}

const initialFormState: PenjualanData = {
  id: '',
  customerId: '',
  kavlingId: '',
  diskonPenjualan: 0,
  bank: '',
  caraPembayaran: '',
  nilaiPengajuanKpr: 0,
  rekeningTujuan: '',
  bookingFee: 5000000, // Fixed 5 Juta
};

const CustomerKavling = () => {
  const [data, setData] = useState<PenjualanData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PenjualanData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof PenjualanData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Helper untuk menampilkan nama di tabel
  const getCustomerName = (id: string) => mockCustomers.find(c => c.value === id)?.label || '-';
  const getKavlingInfo = (id: string) => mockKavling.find(k => k.value === id)?.label || '-';

  const columns = [
    { header: 'Nama Customer', accessor: 'customerId', render: (val: string) => getCustomerName(val) },
    { header: 'Kavling', accessor: 'kavlingId', render: (val: string) => getKavlingInfo(val) },
    { header: 'Cara Pembayaran', accessor: 'caraPembayaran' },
    { header: 'Diskon', accessor: 'diskonPenjualan', render: (val: number) => formatRupiah(val) },
    {
      header: 'Status',
      accessor: 'id', // Dummy status based on existence
      render: () => <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Booked</span>
    },
  ];

  const openModal = (item?: PenjualanData) => {
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

    // Auto-reset field KPR jika metode pembayaran diganti
    if (name === 'caraPembayaran' && value !== 'KPR') {
      setFormData(prev => ({ ...prev, [name]: value, bank: '', nilaiPengajuanKpr: 0 }));
    } else {
      const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    }

    if (errors[name as keyof PenjualanData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof PenjualanData, string>> = {};
    if (!formData.customerId) newErrors.customerId = 'Customer wajib dipilih';
    if (!formData.kavlingId) newErrors.kavlingId = 'Kavling wajib dipilih';
    if (!formData.caraPembayaran) newErrors.caraPembayaran = 'Cara pembayaran wajib dipilih';
    if (!formData.rekeningTujuan) newErrors.rekeningTujuan = 'Rekening transfer wajib dipilih';

    if (formData.caraPembayaran === 'KPR') {
      if (!formData.bank.trim()) newErrors.bank = 'Bank KPR wajib diisi';
      if (formData.nilaiPengajuanKpr <= 0) newErrors.nilaiPengajuanKpr = 'Nilai pengajuan harus lebih dari 0';
    }

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

  const handleDelete = (item: PenjualanData) => {
    if (window.confirm(`Hapus data penjualan untuk customer ini?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Data Penjualan Kavling (Customer)"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Penjualan" : "Tambah Data Penjualan"}>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Bagian 1: Data Utama */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Utama</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Nama Customer"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                options={mockCustomers}
                error={errors.customerId}
              />
              <Select
                label="Pilih Kavling"
                name="kavlingId"
                value={formData.kavlingId}
                onChange={handleChange}
                options={mockKavling}
                error={errors.kavlingId}
              />
            </div>
          </div>

          {/* Bagian 2: Skema Pembayaran */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Skema Pembayaran</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Cara Pembayaran"
                name="caraPembayaran"
                value={formData.caraPembayaran}
                onChange={handleChange}
                options={[
                  { value: 'CASH KERAS', label: 'CASH KERAS' },
                  { value: 'CASH BERTAHAP', label: 'CASH BERTAHAP' },
                  { value: 'KPR', label: 'KPR' }
                ]}
                error={errors.caraPembayaran}
              />
              <Input
                label="Diskon Penjualan (Rp)"
                type="number"
                name="diskonPenjualan"
                value={formData.diskonPenjualan || ''}
                onChange={handleChange}
                error={errors.diskonPenjualan}
              />
            </div>

            {/* Conditional Rendering Khusus KPR */}
            {formData.caraPembayaran === 'KPR' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <Input
                  label="Bank KPR"
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  placeholder="Contoh: BTN, BSI"
                  error={errors.bank}
                />
                <Input
                  label="Nilai Pengajuan KPR (Rp)"
                  type="number"
                  name="nilaiPengajuanKpr"
                  value={formData.nilaiPengajuanKpr || ''}
                  onChange={handleChange}
                  error={errors.nilaiPengajuanKpr}
                />
              </div>
            )}
          </div>

          {/* Bagian 3: Pembayaran Booking */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Pembayaran Booking Fee</h4>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Booking Fee (Rp)"
                type="number"
                name="bookingFee"
                value={formData.bookingFee}
                readOnly
                className="px-3 py-2 border rounded-md focus:outline-none bg-gray-200 text-gray-600 cursor-not-allowed w-full"
              />
              <Select
                label="Transfer ke Rekening"
                name="rekeningTujuan"
                value={formData.rekeningTujuan}
                onChange={handleChange}
                options={[
                  { value: '7326575644', label: 'Bank BSI - 7326575644 a/n PT. Bintang Safana Gajah' },
                  { value: '7326573692', label: 'Bank BSI - 7326573692 a/n PT. Bintang Safana Mahligai' }
                ]}
                error={errors.rekeningTujuan}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 transition-colors">
              Simpan Data Penjualan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerKavling;