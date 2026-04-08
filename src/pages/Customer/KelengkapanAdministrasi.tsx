import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import Input from "../../components/shared/Input";

interface AdministrasiData {
  id: string;
  customerId: string;
  customerName: string;
  perumahan: string;
  blok: string;
  tipe: string;
  unit: string;
  fileKtp: string;
  fileKk: string;
  fileNpwp: string;
}

const initialFormState: AdministrasiData = {
  id: '',
  customerId: '',
  customerName: '',
  perumahan: '',
  blok: '',
  tipe: '',
  unit: '',
  fileKtp: '',
  fileKk: '',
  fileNpwp: '',
};

// Mock data customer yang diperkaya dengan data pembelian unitnya
const mockCustomers = [
  { id: 'CUST-001', name: 'Budi Santoso', perumahan: 'Puri Safana', blok: 'A', tipe: '45/90', unit: '01' },
  { id: 'CUST-002', name: 'Andi Pratama', perumahan: 'Puri Safana', blok: 'B', tipe: '60/120', unit: '12' },
  { id: 'CUST-003', name: 'Siti Aminah', perumahan: 'Puri Safana', blok: 'C', tipe: '36/72', unit: '05' },
  { id: 'CUST-004', name: 'Rina Wijaya', perumahan: 'Puri Safana', blok: 'D', tipe: '45/90', unit: '08' },
];

const KelengkapanAdministrasi = () => {

  const [data, setData] = useState<AdministrasiData[]>([
    {
      id: '1',
      customerId: 'CUST-001',
      customerName: 'Budi Santoso',
      perumahan: 'Puri Safana',
      blok: 'A',
      tipe: '45/90',
      unit: '01',
      fileKtp: 'KTP_Budi.pdf',
      fileKk: 'KK_Budi.pdf',
      fileNpwp: '',
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AdministrasiData>(initialFormState);
  const [errors, setErrors] = useState<Partial<AdministrasiData>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'Nama Customer', accessor: 'customerName' },
    { header: 'Perumahan', accessor: 'perumahan' },
    {
      header: 'Kavling',
      accessor: 'blok',
      render: (_: any, row: AdministrasiData) => (
        <span className="font-medium text-slate-700">Blok {row.blok} - {row.unit} (Tipe {row.tipe})</span>
      )
    },
    {
      header: 'KTP',
      accessor: 'fileKtp',
      render: (val: string) => val ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-200">Ada</span> : <span className="text-red-400 text-xs">-</span>
    },
    {
      header: 'Kartu Keluarga',
      accessor: 'fileKk',
      render: (val: string) => val ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-200">Ada</span> : <span className="text-red-400 text-xs">-</span>
    },
    {
      header: 'NPWP',
      accessor: 'fileNpwp',
      render: (val: string) => val ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-200">Ada</span> : <span className="text-red-400 text-xs">-</span>
    },
  ];

  const openModal = (item?: AdministrasiData) => {
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

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedCustomer = mockCustomers.find(c => c.id === selectedId);

    // Auto-fill data perumahan saat customer dipilih
    setFormData((prev) => ({
      ...prev,
      customerId: selectedId,
      customerName: selectedCustomer ? selectedCustomer.name : '',
      perumahan: selectedCustomer ? selectedCustomer.perumahan : '',
      blok: selectedCustomer ? selectedCustomer.blok : '',
      tipe: selectedCustomer ? selectedCustomer.tipe : '',
      unit: selectedCustomer ? selectedCustomer.unit : '',
    }));

    if (errors.customerId) {
      setErrors((prev) => ({ ...prev, customerId: undefined }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof AdministrasiData) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldName]: file.name }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<AdministrasiData> = {};
    if (!formData.customerId) newErrors.customerId = 'Customer wajib dipilih';
    if (!formData.perumahan) newErrors.perumahan = 'Perumahan wajib diisi';
    if (!formData.blok) newErrors.blok = 'Blok wajib diisi';
    if (!formData.unit) newErrors.unit = 'Unit wajib diisi';

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

  const handleDelete = (item: AdministrasiData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data administrasi untuk ${item.customerName}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Kelengkapan Administrasi"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Kelengkapan Administrasi" : "Tambah Kelengkapan Administrasi"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">1. Pilih Customer</h4>
            <Select
              label="Pilih Customer Pembeli"
              name="customerId"
              value={formData.customerId}
              onChange={handleCustomerChange}
              error={errors.customerId}
              options={mockCustomers.map(c => ({ value: c.id, label: c.name }))}
              disabled={isEditing}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">2. Detail Unit Pembelian</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nama Perumahan"
                  name="perumahan"
                  value={formData.perumahan}
                  onChange={handleChange}
                  error={errors.perumahan}
                  placeholder="Contoh: Puri Safana"
                />
              </div>
              <Input
                label="Blok"
                name="blok"
                value={formData.blok}
                onChange={handleChange}
                error={errors.blok}
                placeholder="Contoh: A"
              />
              <Input
                label="Nomor Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                error={errors.unit}
                placeholder="Contoh: 01"
              />
              <div className="md:col-span-2">
                <Input
                  label="Tipe Bangunan (Opsional)"
                  name="tipe"
                  value={formData.tipe}
                  onChange={handleChange}
                  placeholder="Contoh: 45/90"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">3. Upload Berkas Legal</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 p-3 rounded-lg bg-white shadow-sm">
                <FileInput
                  label="Upload KTP"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'fileKtp')}
                />
                {formData.fileKtp && (
                  <p className="text-xs text-green-600 mt-1 truncate">
                    File tersimpan: <span className="font-medium">{formData.fileKtp}</span>
                  </p>
                )}
              </div>

              <div className="border border-gray-200 p-3 rounded-lg bg-white shadow-sm">
                <FileInput
                  label="Upload Kartu Keluarga (KK)"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'fileKk')}
                />
                {formData.fileKk && (
                  <p className="text-xs text-green-600 mt-1 truncate">
                    File tersimpan: <span className="font-medium">{formData.fileKk}</span>
                  </p>
                )}
              </div>

              <div className="border border-gray-200 p-3 rounded-lg bg-white shadow-sm md:col-span-2">
                <FileInput
                  label="Upload NPWP (Opsional)"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'fileNpwp')}
                />
                {formData.fileNpwp && (
                  <p className="text-xs text-green-600 mt-1 truncate">
                    File tersimpan: <span className="font-medium">{formData.fileNpwp}</span>
                  </p>
                )}
              </div>
            </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 cursor-pointer shadow-lg shadow-black/10"
            >
              Simpan Administrasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KelengkapanAdministrasi;