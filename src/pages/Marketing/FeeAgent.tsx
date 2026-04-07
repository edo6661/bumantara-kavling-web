import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import { formatRupiah } from "../../utils/formatters";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import FileInput from "../../components/shared/FileInput";
interface FeeData {
  id: string;
  namaMarketing: string;
  bookingNominal: string;
  bookingTanggal: string;
  bookingBukti: string;
  closingNominal: string;
  closingTanggal: string;
  closingBukti: string;
  marketingNominal: string;
  marketingTanggal: string;
  marketingBukti: string;
}
const initialFormState: FeeData = {
  id: '',
  namaMarketing: '',
  bookingNominal: '',
  bookingTanggal: '',
  bookingBukti: '',
  closingNominal: '',
  closingTanggal: '',
  closingBukti: '',
  marketingNominal: '',
  marketingTanggal: '',
  marketingBukti: ''
};
const FeeAgent = () => {
  const [data, setData] = useState<FeeData[]>([
    {
      id: '1',
      namaMarketing: 'Andi Pratama',
      bookingNominal: '1000000',
      bookingTanggal: '2026-04-01',
      bookingBukti: 'tf_booking_andi.jpg',
      closingNominal: '2500000',
      closingTanggal: '2026-04-05',
      closingBukti: 'tf_closing_andi.jpg',
      marketingNominal: '5000000',
      marketingTanggal: '2026-04-10',
      marketingBukti: 'tf_marketing_andi.jpg'
    }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FeeData>(initialFormState);
  const [errors, setErrors] = useState<Partial<FeeData>>({});
  const [isEditing, setIsEditing] = useState(false);
  const columns = [
    { header: 'Nama Marketing', accessor: 'namaMarketing' },
    {
      header: 'Booking Fee',
      accessor: 'bookingNominal',
      render: (val: string) => formatRupiah(val)
    },
    {
      header: 'Closing Fee',
      accessor: 'closingNominal',
      render: (val: string) => formatRupiah(val)
    },
    {
      header: 'Marketing Fee',
      accessor: 'marketingNominal',
      render: (val: string) => formatRupiah(val)
    },
  ];
  const openModal = (item?: FeeData) => {
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
    if (errors[name as keyof FeeData]) {
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
    const newErrors: Partial<FeeData> = {};
    if (!formData.namaMarketing.trim()) newErrors.namaMarketing = 'Nama marketing wajib diisi';
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
  const handleDelete = (item: FeeData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data fee ${item.namaMarketing}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };
  return (
    <div className="space-y-6">
      <DataTable
        title="Data Fee Agent Marketing"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Fee Agent" : "Tambah Data Fee Agent"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <Input
              label="Nama Marketing"
              name="namaMarketing"
              value={formData.namaMarketing}
              onChange={handleChange}
              error={errors.namaMarketing}
              placeholder="Masukkan nama agent marketing"
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">1. Booking Fee</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nominal (Rp)"
                name="bookingNominal"
                type="number"
                value={formData.bookingNominal}
                onChange={handleChange}
                placeholder="Contoh: 1000000"
              />
              <Input
                label="Tanggal Transfer"
                name="bookingTanggal"
                type="date"
                value={formData.bookingTanggal}
                onChange={handleChange}
              />
              <FileInput
                label="Bukti Transfer"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'bookingBukti')}
              />
            </div>
            {formData.bookingBukti && (
              <p className="text-xs text-green-600 mt-1">File saat ini: {formData.bookingBukti}</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">2. Closing Fee</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nominal (Rp)"
                name="closingNominal"
                type="number"
                value={formData.closingNominal}
                onChange={handleChange}
                placeholder="Contoh: 2500000"
              />
              <Input
                label="Tanggal Transfer"
                name="closingTanggal"
                type="date"
                value={formData.closingTanggal}
                onChange={handleChange}
              />
              <FileInput
                label="Bukti Transfer"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'closingBukti')}
              />
            </div>
            {formData.closingBukti && (
              <p className="text-xs text-green-600 mt-1">File saat ini: {formData.closingBukti}</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">3. Marketing Fee</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nominal (Rp)"
                name="marketingNominal"
                type="number"
                value={formData.marketingNominal}
                onChange={handleChange}
                placeholder="Contoh: 5000000"
              />
              <Input
                label="Tanggal Transfer"
                name="marketingTanggal"
                type="date"
                value={formData.marketingTanggal}
                onChange={handleChange}
              />
              <FileInput
                label="Bukti Transfer"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'marketingBukti')}
              />
            </div>
            {formData.marketingBukti && (
              <p className="text-xs text-green-600 mt-1">File saat ini: {formData.marketingBukti}</p>
            )}
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
              Simpan Data Fee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default FeeAgent;