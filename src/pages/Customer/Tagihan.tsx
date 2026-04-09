import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { FileText, Printer } from 'lucide-react';

interface TagihanData {
  id: string;
  namaCustomer: string;
  perumahan: string;
  blok: string;
  pembayaran: string;
  nominal: number;
  jatuhTempo: string;
  status: string;
  fileBukti: string;
}

const initialFormState: TagihanData = {
  id: '',
  namaCustomer: '',
  perumahan: '',
  blok: '',
  pembayaran: '',
  nominal: 0,
  jatuhTempo: '',
  status: 'Belum Bayar',
  fileBukti: '',
};


const mockCustomers = [
  { id: 'CUST-001', name: 'Budi Santoso', perumahan: 'Puri Safana', blok: 'A-01' },
  { id: 'CUST-002', name: 'Andi Pratama', perumahan: 'Puri Safana', blok: 'B-12' },
  { id: 'CUST-003', name: 'Siti Aminah', perumahan: 'Puri Safana', blok: 'C-05' },
];

const Tagihan = () => {
  const [data, setData] = useState<TagihanData[]>([
    {
      id: 'INV-001',
      namaCustomer: 'Budi Santoso',
      perumahan: 'Puri Safana',
      blok: 'A-01',
      pembayaran: 'Cicilan DP Pertama',
      nominal: 15000000,
      jatuhTempo: '2026-05-01',
      status: 'Lunas',
      fileBukti: 'bukti_tf_budi.pdf',
    },
    {
      id: 'INV-002',
      namaCustomer: 'Andi Pratama',
      perumahan: 'Puri Safana',
      blok: 'B-12',
      pembayaran: 'Cicilan KPR Bulan ke-1',
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
    { header: 'Perumahan', accessor: 'perumahan' },
    { header: 'Blok/Unit', accessor: 'blok' },
    { header: 'Pembayaran', accessor: 'pembayaran' },
    {
      header: 'Nominal',
      accessor: 'nominal',
      render: (val: number) => <span className="font-bold text-slate-800">{formatRupiah(val)}</span>
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
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${bg}`}>{val}</span>;
      }
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

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const customer = mockCustomers.find(c => c.name === selectedName);

    setFormData(prev => ({
      ...prev,
      namaCustomer: selectedName,
      perumahan: customer?.perumahan || '',
      blok: customer?.blok || ''
    }));

    if (errors.namaCustomer) setErrors(prev => ({ ...prev, namaCustomer: undefined }));
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
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file.name,
        status: 'Lunas'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: '',
        status: 'Belum Bayar'
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof TagihanData, string>> = {};
    if (!formData.namaCustomer) newErrors.namaCustomer = 'Customer wajib dipilih';
    if (!formData.pembayaran.trim()) newErrors.pembayaran = 'Keterangan pembayaran wajib diisi';
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
      const newId = `INV-${String(data.length + 1).padStart(3, '0')}`;
      setData((prev) => [...prev, { ...formData, id: newId }]);
    }
    closeModal();
  };

  const handleDelete = (item: TagihanData) => {
    if (window.confirm(`Hapus data tagihan ${item.pembayaran} untuk ${item.namaCustomer}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };


  const expandedRowRender = () => {
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-800">Manajemen Invoice & Cetak</h4>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-md cursor-pointer">
            <FileText size={14} />
            Create Invoice
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <Printer size={14} />
            Cetak Invoice (PDF)
          </button>
        </div>
      </div>
    );
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
        expandedRowRender={expandedRowRender}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Tagihan" : "Buat Tagihan Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100 flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-800">Status Pembayaran</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${formData.status === 'Lunas' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {formData.status}
            </span>
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <Select
              label="Pilih Customer"
              name="namaCustomer"
              value={formData.namaCustomer}
              onChange={handleCustomerChange}
              error={errors.namaCustomer}
              options={mockCustomers.map(c => ({ value: c.name, label: `${c.name} (${c.perumahan} - ${c.blok})` }))}
            />

            {formData.namaCustomer && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input label="Perumahan" name="perumahan" value={formData.perumahan} readOnly className="bg-gray-100" />
                <Input label="Blok/Unit" name="blok" value={formData.blok} readOnly className="bg-gray-100" />
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Detail Tagihan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Pembayaran"
                  name="pembayaran"
                  value={formData.pembayaran}
                  onChange={handleChange}
                  error={errors.pembayaran}
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
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Bukti Pembayaran</h4>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Upload bukti transfer di sini. Sistem akan otomatis mengubah status tagihan menjadi <strong className="text-green-700">LUNAS</strong>.
            </p>
            <FileInput
              label="Upload Bukti Transfer"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, 'fileBukti')}
            />
            {formData.fileBukti && (
              <p className="text-xs text-green-600 mt-2 truncate flex items-center gap-1 font-medium bg-green-50 p-2 rounded border border-green-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                File tersimpan: {formData.fileBukti}
              </p>
            )}
          </div>

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