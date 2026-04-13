import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
import {
  useGetNotaris,
  useCreateNotaris,
  useUpdateNotaris,
  useDeleteNotaris
} from "../../hooks/queries/useNotaris";
import type { NotarisData, CreateNotarisDTO, PicNotarisData } from "../../services/notaris.service";

interface AjbDitanganiData {
  id: string;
  customer: string;
  kavling: string;
  biayaAjbTransaksi?: number;
}

type ExtendedNotarisData = NotarisData & {
  ajbDitangani?: AjbDitanganiData[];
};

interface NotarisFormState {
  id: number | '';
  nik: string;
  nama: string;
  noHp: string;
  alamat: string;
  pics: PicNotarisData[];
}

const initialFormState: NotarisFormState = {
  id: '',
  nik: '',
  nama: '',
  noHp: '',
  alamat: '',
  pics: []
};

const Notaris = () => {
  const { data: notarisData = [], isLoading } = useGetNotaris();
  const createMutation = useCreateNotaris();
  const updateMutation = useUpdateNotaris();
  const deleteMutation = useDeleteNotaris();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NotarisFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  // State untuk Modal Detail AJB
  const [selectedAjb, setSelectedAjb] = useState<AjbDitanganiData | null>(null);

  const columns = [
    { header: 'Nama Notaris', accessor: 'nama' },
    {
      header: 'Kontak Utama (PIC)',
      accessor: 'pics',
      render: (pics: PicNotarisData[]) => pics?.[0]?.noHp || '-'
    },
    {
      header: 'Total PIC',
      accessor: 'pics',
      render: (pics: PicNotarisData[]) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">
          {pics?.length || 0} Orang
        </span>
      )
    },
  ];

  const openModal = (item?: ExtendedNotarisData) => {
    if (item) {
      const mainPic = item.pics?.[0];
      const additionalPics = item.pics?.slice(1) || [];
      setFormData({
        id: item.id,
        nik: '',
        nama: item.nama,
        noHp: mainPic?.noHp || '',
        alamat: mainPic?.alamat || '',
        pics: additionalPics
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
    const errorKey = `pics.${index}.${name}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
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
    if (!formData.nama.trim()) newErrors.nama = 'Nama Notaris wajib diisi';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const additionalPics = formData.pics.filter(pic => pic.nama.trim() !== '' && pic.noHp.trim() !== '');
    const allPics = [
      { nama: `Admin/PIC Utama ${formData.nama}`, noHp: formData.noHp, alamat: formData.alamat },
      ...additionalPics
    ];
    const payload: CreateNotarisDTO = {
      nama: formData.nama,
      biayaAjb: 0,
      pics: allPics,
    };
    try {
      if (isEditing && formData.id !== '') {
        await updateMutation.mutateAsync({ id: formData.id as number, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (error: any) {
      const responseData = error.response?.data;
      if (responseData?.error && Array.isArray(responseData.error)) {
        const backendErrors: Record<string, string> = {};
        responseData.error.forEach((err: { field: string; message: string }) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else {
        alert(responseData?.message || 'Terjadi kesalahan saat menyimpan data');
      }
    }
  };

  const handleDelete = async (item: ExtendedNotarisData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data Notaris ${item.nama}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Gagal menghapus data notaris');
      }
    }
  };

  const expandedRowRender = (row: ExtendedNotarisData) => {
    const relatedAjb = row.ajbDitangani || [];
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Daftar AJB / Kavling yang Ditangani: <span className="text-blue-600">{row.nama}</span>
        </h4>
        {relatedAjb.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">ID Penjualan</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Kavling</th>
                  <th className="px-4 py-3 rounded-r-lg font-bold text-right">Biaya AJB Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {relatedAjb.map((ajb, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedAjb(ajb)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 group-hover:text-blue-600">{ajb.id}</td>
                    <td className="px-4 py-3 text-slate-600 group-hover:text-slate-900">{ajb.customer}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{ajb.kavling}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 text-right">
                      {ajb.biayaAjbTransaksi ? formatRupiah(ajb.biayaAjbTransaksi) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada berkas kavling yang ditangani notaris ini.
          </p>
        )}
      </div>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Data Notaris"
        columns={columns}
        data={notarisData as ExtendedNotarisData[]}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as ExtendedNotarisData)}
        onDelete={(item) => handleDelete(item as ExtendedNotarisData)}
        expandedRowRender={expandedRowRender}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Notaris" : "Tambah Data Notaris"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Utama Notaris</h4>
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
                label="Nama Notaris / PPAT"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                error={errors.nama}
                placeholder="Contoh: Notaris Budi Hartono, S.H."
              />
              <Input
                label="No. Telepon / HP"
                name="noHp"
                value={formData.noHp}
                onChange={handleChange}
                error={errors.noHp}
                placeholder="08xxxxxxxxxx"
              />
              <div className="md:col-span-2">
                <Input
                  label="Alamat Lengkap (Opsional)"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  error={errors.alamat}
                  placeholder="Masukkan alamat lengkap kantor notaris"
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Daftar PIC Notaris (Opsional)</h4>
                <p className="text-xs text-gray-500">Tambahkan staf tambahan/PIC yang bisa dihubungi</p>
              </div>
              <button
                type="button"
                onClick={handleAddPIC}
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-black rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                + Tambah PIC
              </button>
            </div>
            <div className="space-y-4">
              {formData.pics.map((pic, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg relative">
                  <button
                    type="button"
                    onClick={() => handleRemovePIC(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">PIC Tambahan #{index + 1}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama PIC"
                      name="nama"
                      value={pic.nama}
                      onChange={(e) => handlePICChange(index, e)}
                      error={errors[`pics.${index}.nama`]}
                      placeholder="Masukkan nama PIC"
                    />
                    <Input
                      label="No. Telepon / HP PIC"
                      name="noHp"
                      value={pic.noHp}
                      onChange={(e) => handlePICChange(index, e)}
                      error={errors[`pics.${index}.noHp`]}
                      placeholder="08xxxxxxxxxx"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Alamat PIC (Opsional)"
                        name="alamat"
                        value={pic.alamat || ''}
                        onChange={(e) => handlePICChange(index, e)}
                        error={errors[`pics.${index}.alamat`]}
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DETAIL AJB */}
      <Modal isOpen={!!selectedAjb} onClose={() => setSelectedAjb(null)} title="Detail Transaksi AJB">
        {selectedAjb && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">No. Transaksi Penjualan</p>
                <p className="text-sm font-black text-slate-900">{selectedAjb.id}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Biaya AJB Transaksi</p>
                <p className="text-xl font-black text-blue-700">
                  {selectedAjb.biayaAjbTransaksi ? formatRupiah(selectedAjb.biayaAjbTransaksi) : 'Rp 0'}
                </p>
              </div>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer / Pembeli</p>
              <p className="text-base font-bold text-slate-800">{selectedAjb.customer}</p>

              <div className="h-px w-full bg-slate-100 my-4"></div>

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kavling / Unit Dibeli</p>
              <p className="text-sm font-bold text-slate-700">{selectedAjb.kavling}</p>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setSelectedAjb(null)}
                className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl cursor-pointer hover:bg-slate-800 transition-colors shadow-md"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Notaris;