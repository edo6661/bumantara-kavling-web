import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";

interface PicNotarisData {
  nama: string;
  noHp: string;
  alamat?: string;
}

interface NotarisData {
  id: string;
  nik: string;
  nama: string;
  noHp: string;
  alamat: string;
  pics: PicNotarisData[];
}

const initialFormState: NotarisData = {
  id: '',
  nik: '',
  nama: '',
  noHp: '',
  alamat: '',
  pics: [{ nama: '', noHp: '', alamat: '' }]
};

const Notaris = () => {
  const [data, setData] = useState<NotarisData[]>([
    {
      id: '1',
      nik: '3271012345678901',
      nama: 'Notaris PPAT Budi Hartono, S.H., M.Kn.',
      noHp: '081234567890',
      alamat: 'Jl. Jendral Sudirman No. 45, Tangerang',
      pics: [
        {
          nama: 'Siti Aminah',
          noHp: '085612341234',
          alamat: 'Jl. Merdeka Raya, Tangerang'
        }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NotarisData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    { header: 'NIK', accessor: 'nik' },
    { header: 'Nama Notaris', accessor: 'nama' },
    { header: 'No. Telepon / HP', accessor: 'noHp' },
    {
      header: 'Total PIC',
      accessor: 'pics',
      render: (pics: PicNotarisData[]) => `${pics?.length || 0} Orang`
    },
    { header: 'Alamat', accessor: 'alamat', render: (val: string) => val || '-' },
  ];

  const openModal = (item?: NotarisData) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;


    const validPics = formData.pics.filter(pic => pic.nama.trim() !== '' && pic.noHp.trim() !== '');
    const finalData = { ...formData, pics: validPics };

    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === finalData.id ? finalData : item)));
    } else {
      const newData = { ...finalData, id: Date.now().toString() };
      setData((prev) => [...prev, newData]);
    }
    closeModal();
  };

  const handleDelete = (item: NotarisData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data Notaris ${item.nama}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  const expandedRowRender = (row: NotarisData) => {

    const relatedAjb = [
      { id: 'PJL-01', customer: 'Budi Santoso', kavling: 'Puri Safana (A-01)' },
      { id: 'PJL-02', customer: 'Andi Pratama', kavling: 'Puri Safana (B-12)' },
    ];

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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {relatedAjb.map((ajb, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{ajb.id}</td>
                    <td className="px-4 py-3">{ajb.customer}</td>
                    <td className="px-4 py-3 font-medium">{ajb.kavling}</td>

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

  return (
    <div>
      <DataTable
        title="Data Notaris"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as NotarisData)}
        onDelete={(item) => handleDelete(item as NotarisData)}
        expandedRowRender={expandedRowRender}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Notaris" : "Tambah Data Notaris"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <p className="text-xs text-gray-500">Tambahkan staf/PIC yang bisa dihubungi di notaris ini</p>
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
                        placeholder="Masukkan alamat PIC jika ada"
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