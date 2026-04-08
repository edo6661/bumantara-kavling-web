import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import { formatRupiah } from "../../utils/formatters";

interface NotarisData {
  id: string;
  nama: string;
  biayaAjb: number;
}

const initialFormState: NotarisData = {
  id: '',
  nama: '',
  biayaAjb: 0,
};

const Notaris = () => {
  const [data, setData] = useState<NotarisData[]>([
    {
      id: '1',
      nama: 'Notaris PPAT Budi Hartono, S.H., M.Kn.',
      biayaAjb: 3500000
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NotarisData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof NotarisData, string>>>({});

  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'Nama Notaris', accessor: 'nama' },
    {
      header: 'Biaya Pembuatan AJB',
      accessor: 'biayaAjb',
      render: (val: number) => <span className="font-bold text-slate-800">{formatRupiah(val)}</span>
    },
  ];

  const openModal = (item?: NotarisData) => {
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
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    if (errors[name as keyof NotarisData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof NotarisData, string>> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama Notaris wajib diisi';
    if (formData.biayaAjb < 0) newErrors.biayaAjb = 'Biaya AJB tidak boleh minus';

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

  const handleDelete = (item: NotarisData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data Notaris ${item.nama}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  // Fungsi untuk me-render data relasi di bawah baris tabel
  const expandedRowRender = (row: NotarisData) => {
    // Simulasi data AJB/Kavling yang ditangani notaris ini (Nantinya diganti dengan data dari API)
    const relatedAjb = [
      { id: 'AJB-101', customer: 'Budi Santoso', kavling: 'Puri Safana (A-01)', tanggal: '2026-03-20', status: 'Selesai' },
      { id: 'AJB-102', customer: 'Andi Pratama', kavling: 'Puri Safana (B-12)', tanggal: '2026-04-05', status: 'Proses' },
    ];

    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Daftar AJB / Kavling yang Ditangani: <span className="text-blue-600">{row.nama}</span></h4>
        {relatedAjb.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">No. Berkas</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Kavling</th>
                  <th className="px-4 py-3 font-bold">Tanggal Masuk</th>
                  <th className="px-4 py-3 rounded-r-lg text-center font-bold">Status Berkas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {relatedAjb.map((ajb, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{ajb.id}</td>
                    <td className="px-4 py-3">{ajb.customer}</td>
                    <td className="px-4 py-3 font-medium">{ajb.kavling}</td>
                    <td className="px-4 py-3 text-slate-500">{ajb.tanggal}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${ajb.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ajb.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">Belum ada berkas kavling yang ditangani notaris ini.</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Data Notaris"
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
        title={isEditing ? "Edit Data Notaris" : "Tambah Data Notaris"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Nama Notaris"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              error={errors.nama}
              placeholder="Contoh: Notaris Budi Hartono, S.H."
            />
            <Input
              label="Biaya Notaris Pembuatan AJB (Rp)"
              name="biayaAjb"
              type="number"
              value={formData.biayaAjb === 0 ? '' : formData.biayaAjb}
              onChange={handleChange}
              error={errors.biayaAjb as string}
              placeholder="Contoh: 3500000"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 cursor-pointer transition-colors"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Notaris;