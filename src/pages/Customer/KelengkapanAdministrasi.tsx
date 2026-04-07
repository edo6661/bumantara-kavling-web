import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";


interface AdministrasiData {
  id: string;
  customerId: string;
  customerName: string;
  fileKtp: string;
  fileKk: string;
  fileNpwp: string;
}

const initialFormState: AdministrasiData = {
  id: '',
  customerId: '',
  customerName: '',
  fileKtp: '',
  fileKk: '',
  fileNpwp: '',
};


const mockCustomers = [
  { id: 'CUST-001', name: 'Budi Santoso' },
  { id: 'CUST-002', name: 'Andi Pratama' },
  { id: 'CUST-003', name: 'Siti Aminah' },
  { id: 'CUST-004', name: 'Rina Wijaya' },
];

const KelengkapanAdministrasi = () => {

  const [data, setData] = useState<AdministrasiData[]>([
    {
      id: '1',
      customerId: 'CUST-001',
      customerName: 'Budi Santoso',
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
    {
      header: 'KTP',
      accessor: 'fileKtp',
      render: (val: string) => val ? <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">{val}</span> : <span className="text-gray-400 text-xs">- Belum ada -</span>
    },
    {
      header: 'Kartu Keluarga',
      accessor: 'fileKk',
      render: (val: string) => val ? <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">{val}</span> : <span className="text-gray-400 text-xs">- Belum ada -</span>
    },
    {
      header: 'NPWP',
      accessor: 'fileNpwp',
      render: (val: string) => val ? <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">{val}</span> : <span className="text-gray-400 text-xs">- Belum ada -</span>
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

    setFormData((prev) => ({
      ...prev,
      customerId: selectedId,
      customerName: selectedCustomer ? selectedCustomer.name : ''
    }));

    if (errors.customerId) {
      setErrors((prev) => ({ ...prev, customerId: undefined }));
    }
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <Select
              label="Pilih Customer"
              name="customerId"
              value={formData.customerId}
              onChange={handleCustomerChange}
              error={errors.customerId}
              options={mockCustomers.map(c => ({ value: c.id, label: c.name }))}
              disabled={isEditing}
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">Upload Berkas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* KTP */}
              <div className="border border-gray-200 p-3 rounded-md bg-white">
                <FileInput
                  label="Upload KTP"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'fileKtp')}
                />
                {formData.fileKtp && (
                  <p className="text-xs text-green-600 mt-1 truncate">
                    File tersimpan: {formData.fileKtp}
                  </p>
                )}
              </div>

              {/* KK */}
              <div className="border border-gray-200 p-3 rounded-md bg-white">
                <FileInput
                  label="Upload Kartu Keluarga (KK)"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'fileKk')}
                />
                {formData.fileKk && (
                  <p className="text-xs text-green-600 mt-1 truncate">
                    File tersimpan: {formData.fileKk}
                  </p>
                )}
              </div>

              {/* NPWP */}
              <div className="border border-gray-200 p-3 rounded-md bg-white md:col-span-2">
                <FileInput
                  label="Upload NPWP (Opsional)"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'fileNpwp')}
                />
                {formData.fileNpwp && (
                  <p className="text-xs text-green-600 mt-1 truncate">
                    File tersimpan: {formData.fileNpwp}
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

export default KelengkapanAdministrasi;