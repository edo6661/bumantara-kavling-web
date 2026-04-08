import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import { formatRupiah, formatDate } from "../../utils/formatters";

interface TagihanData {
  id: string;
  namaCustomer: string;
  keterangan: string;
  nominal: number;
  jatuhTempo: string;
  status: string;
  fileBukti: string;
}

const initialFormState: TagihanData = {
  id: '',
  namaCustomer: '',
  keterangan: '',
  nominal: 0,
  jatuhTempo: '',
  status: 'Belum Bayar',
  fileBukti: '',
};

// Mock data untuk pilihan customer
const mockCustomers = [
  { id: 'CUST-001', name: 'Budi Santoso' },
  { id: 'CUST-002', name: 'Andi Pratama' },
  { id: 'CUST-003', name: 'Siti Aminah' },
];

const Tagihan = () => {
  const [data, setData] = useState<TagihanData[]>([
    {
      id: 'INV-001',
      namaCustomer: 'Budi Santoso',
      keterangan: 'Cicilan DP Pertama',
      nominal: 15000000,
      jatuhTempo: '2026-05-01',
      status: 'Lunas',
      fileBukti: 'bukti_tf_budi.pdf',
    },
    {
      id: 'INV-002',
      namaCustomer: 'Andi Pratama',
      keterangan: 'Cicilan KPR Bulan ke-1',
      nominal: 4500000,
      jatuhTempo: '2026-05-15',
      status: 'Belum Bayar',
      fileBukti: '',
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<TagihanData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof TagihanData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'No. Tagihan', accessor: 'id' },
    { header: 'Nama Customer', accessor: 'namaCustomer' },
    { header: 'Keterangan', accessor: 'keterangan' },
    {
      header: 'Nominal',
      accessor: 'nominal',
      render: (val: number) => formatRupiah(val)
    },
    {
      header: 'Jatuh Tempo',
      accessor: 'jatuhTempo',
      render: (val: string) => formatDate(val)
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        const bg = val === 'Lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg}`}>{val}</span>;
      }
    },
    {
      header: 'Bukti',
      accessor: 'fileBukti',
      render: (val: string) => val ? (
        <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded">{val}</span>
      ) : (
        <span className="text-gray-400 text-xs">-</span>
      )
    },
  ];

  const openModal = (item?: TagihanData) => {
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

    if (errors[name as keyof TagihanData]) {
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
    const newErrors: Partial<Record<keyof TagihanData, string>> = {};
    if (!formData.namaCustomer) newErrors.namaCustomer = 'Customer wajib dipilih';
    if (!formData.keterangan.trim()) newErrors.keterangan = 'Keterangan wajib diisi';
    if (formData.nominal <= 0) newErrors.nominal = 'Nominal harus lebih dari 0';
    if (!formData.jatuhTempo) newErrors.jatuhTempo = 'Jatuh tempo wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
    } else {
      // Generate ID Tagihan Mock
      const newId = `INV-${String(data.length + 1).padStart(3, '0')}`;
      setData((prev) => [...prev, { ...formData, id: newId }]);
    }
    closeModal();
  };

  const handleDelete = (item: TagihanData) => {
    if (window.confirm(`Hapus data tagihan ${item.keterangan} untuk ${item.namaCustomer}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Data Tagihan Customer"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Tagihan" : "Buat Tagihan Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <Select
              label="Pilih Customer"
              name="namaCustomer"
              value={formData.namaCustomer}
              onChange={handleChange}
              error={errors.namaCustomer}
              options={mockCustomers.map(c => ({ value: c.name, label: c.name }))}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Detail Tagihan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Keterangan Tagihan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  error={errors.keterangan}
                  placeholder="Contoh: Cicilan Bertahap ke-1 / Pelunasan DP"
                />
              </div>
              <Input
                label="Nominal (Rp)"
                type="number"
                name="nominal"
                value={formData.nominal === 0 ? '' : formData.nominal}
                onChange={handleChange}
                error={errors.nominal}
                placeholder="0"
              />
              <Input
                label="Jatuh Tempo"
                type="date"
                name="jatuhTempo"
                value={formData.jatuhTempo}
                onChange={handleChange}
                error={errors.jatuhTempo}
              />
              <Select
                label="Status Pembayaran"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: 'Belum Bayar', label: 'Belum Bayar' },
                  { value: 'Lunas', label: 'Lunas' }
                ]}
              />
            </div>
          </div>

          {formData.status === 'Lunas' && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100 animate-in fade-in">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Bukti Pembayaran</h4>
              <FileInput
                label="Upload Bukti Transfer"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'fileBukti')}
              />
              {formData.fileBukti && (
                <p className="text-xs text-green-600 mt-1 truncate">File terlampir: {formData.fileBukti}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Simpan Tagihan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tagihan;