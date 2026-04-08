import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import { formatRupiah } from "../../utils/formatters";

interface PICData {
  nama: string;
  noHp: string;
  alamat: string;
}

interface AgentData {
  id: string;
  nik: string;
  nama: string;
  alamat: string;
  noHp: string;
  email: string;
  pics: PICData[];
}

const initialFormState: AgentData = {
  id: '',
  nik: '',
  nama: '',
  alamat: '',
  noHp: '',
  email: '',
  pics: [{ nama: '', noHp: '', alamat: '' }]
};

const Agents = () => {

  const [data, setData] = useState<AgentData[]>([
    {
      id: '1',
      nik: '3671012345670001',
      nama: 'Andi Pratama',
      alamat: 'Jl. Sudirman No. 10, Jakarta',
      noHp: '081234567890',
      email: 'andi@example.com',
      pics: [
        {
          nama: 'Budi Santoso',
          noHp: '081987654321',
          alamat: 'Jl. Melati No. 5, Jakarta'
        }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AgentData>(initialFormState);
  const [errors, setErrors] = useState<Partial<AgentData>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'NIK', accessor: 'nik' },
    { header: 'Nama Agent', accessor: 'nama' },
    { header: 'No. WhatsApp', accessor: 'noHp' },
    {
      header: 'Total PIC',
      accessor: 'pics',
      render: (pics: PICData[]) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">
          {pics?.length || 0} Orang
        </span>
      )
    },
    { header: 'Alamat', accessor: 'alamat' },
  ];

  const openModal = (item?: AgentData) => {
    if (item) {
      setFormData({
        ...item,
        pics: item.pics && item.pics.length > 0 ? item.pics : [{ nama: '', noHp: '', alamat: '' }]
      });
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
    if (errors[name as keyof AgentData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePICChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newPics = [...prev.pics];
      newPics[index] = { ...newPics[index], [name]: value };
      return { ...prev, pics: newPics };
    });
  };

  const handleAddPIC = () => {
    setFormData((prev) => ({
      ...prev,
      pics: [...prev.pics, { nama: '', noHp: '', alamat: '' }]
    }));
  };

  const handleRemovePIC = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pics: prev.pics.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<AgentData> = {};
    if (!formData.nik.trim()) newErrors.nik = 'NIK wajib diisi';
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';

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

  const handleDelete = (item: AgentData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus agen ${item.nama}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  // Fungsi untuk me-render data relasi di bawah baris tabel
  const expandedRowRender = (row: AgentData) => {
    // Simulasi data penjualan yang terkait dengan agent ini (Nantinya diganti dengan data dari API)
    const relatedSales = [
      { id: 'TRX-001', tanggal: '2026-03-15', customer: 'Budi Santoso', kavling: 'Puri Safana (A-01)', komisi: 5000000, status: 'Lunas' },
      { id: 'TRX-002', tanggal: '2026-04-02', customer: 'Siti Aminah', kavling: 'Puri Safana (C-05)', komisi: 4500000, status: 'Pending' },
    ];

    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Riwayat Penjualan Agent: <span className="text-blue-600">{row.nama}</span></h4>
        {relatedSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">ID Penjualan</th>
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Kavling</th>
                  <th className="px-4 py-3 text-right font-bold">Estimasi Komisi</th>
                  <th className="px-4 py-3 rounded-r-lg text-center font-bold">Status Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {relatedSales.map((sale, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{sale.id}</td>
                    <td className="px-4 py-3 text-slate-500">{sale.tanggal}</td>
                    <td className="px-4 py-3">{sale.customer}</td>
                    <td className="px-4 py-3 font-medium">{sale.kavling}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{formatRupiah(sale.komisi)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${sale.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">Belum ada riwayat penjualan untuk agent ini.</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Agent"
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
        title={isEditing ? "Edit Data Agent" : "Tambah Data Agent"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Utama Agent</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="NIK"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                error={errors.nik}
                placeholder="Masukkan 16 digit NIK"
              />
              <Input
                label="Nama Lengkap"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                error={errors.nama}
                placeholder="Masukkan nama"
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
              <div className="md:col-span-2">
                <Input
                  label="Alamat Lengkap"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap agent"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Daftar PIC Agent</h4>
                <p className="text-xs text-gray-500">Tambahkan kontak PIC untuk agent ini</p>
              </div>
              <button
                type="button"
                onClick={handleAddPIC}
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-black rounded-lg transition-colors cursor-pointer"
              >
                + Tambah PIC
              </button>
            </div>

            <div className="space-y-4">
              {formData.pics.map((pic, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg relative">
                  {formData.pics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePIC(index)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">PIC #{index + 1}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama PIC"
                      name="nama"
                      value={pic.nama}
                      onChange={(e) => handlePICChange(index, e)}
                      placeholder="Masukkan nama PIC"
                    />
                    <Input
                      label="No. Telepon / HP PIC"
                      name="noHp"
                      value={pic.noHp}
                      onChange={(e) => handlePICChange(index, e)}
                      placeholder="08xxxxxxxxxx"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Alamat PIC"
                        name="alamat"
                        value={pic.alamat}
                        onChange={(e) => handlePICChange(index, e)}
                        placeholder="Masukkan alamat lengkap PIC"
                      />
                    </div>
                  </div>
                </div>
              ))}
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

export default Agents;