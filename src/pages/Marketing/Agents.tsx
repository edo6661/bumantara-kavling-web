import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import { formatRupiah } from "../../utils/formatters";
import {
  useGetAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent
} from "../../hooks/queries/useAgent";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import type { AgentData, CreateAgentDTO, PenjualanAgentData, PicAgentData } from '../../types/models/agent';

interface AgentFormState {
  id: number | '';
  nik: string;
  nama: string;
  alamat: string;
  noHp: string;
  email: string;
  pics: PicAgentData[];
}

const initialFormState: AgentFormState = {
  id: '',
  nik: '',
  nama: '',
  alamat: '',
  noHp: '',
  email: '',
  pics: [{ nama: '', noHp: '', alamat: '' }]
};

const Agents = () => {
  const { data: agentData = [], isLoading } = useGetAgents();
  // Ambil data penjualan untuk detail
  const { data: penjualanList = [] } = useGetPenjualan();

  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AgentFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  // State untuk Detail Penjualan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedDetailPenjualan, setSelectedDetailPenjualan] = useState<any>(null);

  const columns = [
    { header: 'NIK', accessor: 'nik' },
    { header: 'Nama Agent', accessor: 'nama', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    { header: 'No. WhatsApp', accessor: 'noHp' },
    {
      header: 'Total PIC',
      accessor: 'pics',
      render: (pics: PicAgentData[]) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">
          {pics?.length || 0} Orang
        </span>
      )
    },
    { header: 'Alamat', accessor: 'alamat', render: (val: string | null) => val || '-' },
  ];

  const openModal = (item?: AgentData) => {
    if (item) {
      setFormData({
        id: item.id,
        nik: item.nik,
        nama: item.nama,
        alamat: item.alamat || '',
        noHp: item.noHp,
        email: item.email || '',
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

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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
    const newErrors: Record<string, string> = {};
    if (!formData.nik.trim()) newErrors.nik = 'NIK wajib diisi';
    if (formData.nik.trim().length !== 16) newErrors.nik = 'NIK harus 16 digit';
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const validPics = formData.pics.filter(pic => pic.nama.trim() !== '' && pic.noHp.trim() !== '');
    const payload: CreateAgentDTO = {
      nik: formData.nik,
      nama: formData.nama,
      noHp: formData.noHp,
      email: formData.email || undefined,
      alamat: formData.alamat || undefined,
      pics: validPics.length > 0 ? validPics : undefined,
    };

    try {
      if (isEditing && formData.id) {
        await updateMutation.mutateAsync({ id: formData.id as number, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleDelete = async (item: AgentData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus agen ${item.nama}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        alert(error.response?.data?.message || 'Gagal menghapus agen');
      }
    }
  };

  const expandedRowRender = (row: AgentData) => {
    const relatedSales = row.penjualan || [];

    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Riwayat Penjualan Agent: <span className="text-blue-600">{row.nama}</span>
        </h4>
        {relatedSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">No. Transaksi</th>
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Kavling</th>
                  <th className="px-4 py-3 text-right font-bold">Nilai Penjualan (Rp)</th>
                  <th className="px-4 py-3 rounded-r-lg text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {relatedSales.map((sale: PenjualanAgentData) => (
                  <tr
                    key={sale.id}
                    onClick={() => {
                      // Cari data lengkap dari list penjualan berdasarkan noTransaksi
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const detail = penjualanList.find((p: any) => p.id === sale.noTransaksi);
                      setSelectedDetailPenjualan(detail || sale);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    title="Klik untuk melihat detail"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{sale.noTransaksi}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(sale.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium">{sale.customer?.nama || '-'}</td>
                    <td className="px-4 py-3">
                      {sale.kavling?.perumahan?.nama} ({sale.kavling?.blok}-{sale.kavling?.nomorUnit})
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">
                      {formatRupiah(sale.hargaJual)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${sale.status.toUpperCase() === 'LUNAS' ? 'bg-green-100 text-green-700' :
                        sale.status.toUpperCase() === 'BATAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada riwayat penjualan untuk agent ini.
          </p>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="p-4 text-slate-500 font-medium flex justify-center h-40 items-center">Memuat data agen...</div>;

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Agent Marketing"
        columns={columns}
        data={agentData}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as AgentData)}
        onDelete={(item) => handleDelete(item as AgentData)}
        expandedRowRender={expandedRowRender}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Agent" : "Tambah Data Agent"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Utama Agent</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="NIK" name="nik" value={formData.nik} onChange={handleChange} error={errors.nik} placeholder="Masukkan 16 digit NIK" />
              <Input label="Nama Lengkap" name="nama" value={formData.nama} onChange={handleChange} error={errors.nama} placeholder="Masukkan nama agent" />
              <Input label="No. WhatsApp / HP" name="noHp" value={formData.noHp} onChange={handleChange} error={errors.noHp} placeholder="08xxxxxxxxxx" />
              <Input label="Email (Opsional)" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
              <div className="md:col-span-2">
                <Input label="Alamat Lengkap (Opsional)" name="alamat" value={formData.alamat} onChange={handleChange} error={errors.alamat} placeholder="Masukkan alamat lengkap agent" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Daftar PIC Agent (Opsional)</h4>
                <p className="text-xs text-gray-500">Tambahkan kontak PIC untuk di bawah agent ini</p>
              </div>
              <button type="button" onClick={handleAddPIC} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-black rounded-lg transition-colors cursor-pointer">
                + Tambah PIC
              </button>
            </div>

            <div className="space-y-4">
              {formData.pics.map((pic, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg relative">
                  {formData.pics.length > 1 && (
                    <button type="button" onClick={() => handleRemovePIC(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer">Hapus</button>
                  )}
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">PIC #{index + 1}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nama PIC" name="nama" value={pic.nama} onChange={(e) => handlePICChange(index, e)} placeholder="Masukkan nama PIC" />
                    <Input label="No. Telepon / HP PIC" name="noHp" value={pic.noHp} onChange={(e) => handlePICChange(index, e)} placeholder="08xxxxxxxxxx" />
                    <div className="md:col-span-2">
                      <Input label="Alamat PIC (Opsional)" name="alamat" value={pic.alamat || ''} onChange={(e) => handlePICChange(index, e)} placeholder="Masukkan alamat lengkap PIC" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 cursor-pointer disabled:opacity-50">
              Batal
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 cursor-pointer disabled:opacity-50">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DETAIL PENJUALAN */}
      <Modal isOpen={!!selectedDetailPenjualan} onClose={() => setSelectedDetailPenjualan(null)} title="Informasi Transaksi Penjualan">
        {selectedDetailPenjualan && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer / Pembeli</p>
                  <p className="text-lg font-black text-slate-900">{selectedDetailPenjualan.nama || selectedDetailPenjualan.customer?.nama || '-'}</p>
                  <p className="text-sm text-slate-500 font-medium">Transaksi: {selectedDetailPenjualan.id || selectedDetailPenjualan.noTransaksi}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedDetailPenjualan.status === 'LUNAS' ? 'bg-green-100 text-green-800' :
                      selectedDetailPenjualan.status === 'BATAL' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {selectedDetailPenjualan.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kavling</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.perumahan || selectedDetailPenjualan.kavling?.perumahan?.nama} - Blok {selectedDetailPenjualan.blok || selectedDetailPenjualan.kavling?.blok} No. {selectedDetailPenjualan.nomorUnit || selectedDetailPenjualan.kavling?.nomorUnit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Metode Pembayaran</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.caraPembayaran?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Harga Jual</p>
                  <p className="text-sm font-bold text-blue-700">
                    {selectedDetailPenjualan.hargaJual ? formatRupiah(selectedDetailPenjualan.hargaJual) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Transaksi</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.tanggal ? new Date(selectedDetailPenjualan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedDetailPenjualan(null)} className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black transition-colors cursor-pointer shadow-md">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Agents;