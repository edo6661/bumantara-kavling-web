import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import { useAuth } from "../../context/AuthContext";
import {
  useGetBankRekening,
  useCreateBankRekening,
  useUpdateBankRekening,
  useDeleteBankRekening
} from "../../hooks/queries/useBankRekening";
import type { BankRekeningPt } from "../../services/bankRekening.service";
import { handleApiError } from '../../utils/errorHandler';

interface BankFormState {
  id: number | '';
  perumahanId: number | '';
  perumahan: string;
  namaBank: string;
  noRekening: string;
  atasNama: string;
}

const initialFormState: BankFormState = {
  id: '',
  perumahanId: '',
  perumahan: '',
  namaBank: '',
  noRekening: '',
  atasNama: '',
};

const Bank = () => {
  const { selectedPerumahan } = useAuth();
  const { data: bankData = [], isLoading } = useGetBankRekening();
  const createMutation = useCreateBankRekening();
  const updateMutation = useUpdateBankRekening();
  const deleteMutation = useDeleteBankRekening();

  const filteredData = bankData.filter(
    bank => bank.perumahan === (selectedPerumahan?.nama || '')
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<BankFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const columns = [
    {
      header: 'Perumahan',
      accessor: 'perumahan',
      render: (val: string) => <span className="font-semibold text-blue-700">{val}</span>
    },
    { header: 'Nama Bank', accessor: 'namaBank' },
    { header: 'No Rekening', accessor: 'noRekening' },
    { header: 'Atas Nama (a/n)', accessor: 'atasNama' },
  ];

  const openModal = (item?: BankRekeningPt) => {
    if (item) {
      setFormData({
        id: item.id,
        perumahanId: item.perumahanId,
        perumahan: item.perumahan || '',
        namaBank: item.namaBank,
        noRekening: item.noRekening,
        atasNama: item.atasNama,
      });
      setIsEditing(true);
    } else {
      setFormData({
        ...initialFormState,
        perumahanId: selectedPerumahan ? Number(selectedPerumahan.id) : '',
        perumahan: selectedPerumahan?.nama || ''
      });
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.perumahanId) newErrors.perumahan = 'Perumahan wajib ada';
    if (!formData.namaBank.trim()) newErrors.namaBank = 'Nama Bank wajib diisi';
    if (!formData.noRekening.trim()) newErrors.noRekening = 'No Rekening wajib diisi';
    if (!formData.atasNama.trim()) newErrors.atasNama = 'Atas Nama wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      perumahanId: Number(formData.perumahanId),
      namaBank: formData.namaBank,
      noRekening: formData.noRekening,
      atasNama: formData.atasNama,
    };

    try {
      if (isEditing && formData.id) {
        await updateMutation.mutateAsync({ id: formData.id as number, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (error: any) {
      const { message, errors: backendErrors } = handleApiError(error);

      if (backendErrors && Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((err: { field: string; message: string }) => {
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        alert(message);
      }
    }
  };

  const handleDelete = async (item: BankRekeningPt) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data ${item.namaBank} - ${item.noRekening}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        const { message } = handleApiError(error);
        alert(message);
      }
    }
  };

  if (isLoading) {
    return <div className="p-4 text-slate-500">Memuat data bank...</div>;
  }

  return (
    <div className="space-y-6">
      <DataTable
        title={`Data Bank`}
        columns={columns}
        data={filteredData}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as BankRekeningPt)}
        onDelete={(item) => handleDelete(item as BankRekeningPt)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Bank" : "Tambah Data Bank"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
              <Input
                label="Peruntukan Perumahan"
                name="perumahan"
                value={formData.perumahan}
                readOnly
                className="bg-gray-100 cursor-not-allowed w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-500"
              />
            </div>

            <Input
              label="Nama Bank"
              name="namaBank"
              value={formData.namaBank}
              onChange={handleChange}
              error={errors.namaBank}
              placeholder="Contoh: Bank BSI"
            />
            <Input
              label="No Rekening"
              name="noRekening"
              value={formData.noRekening}
              onChange={handleChange}
              error={errors.noRekening}
              placeholder="Masukkan nomor rekening"
            />
            <Input
              label="Atas Nama"
              name="atasNama"
              value={formData.atasNama}
              onChange={handleChange}
              error={errors.atasNama}
              placeholder="Contoh: PT. Bintang Safana"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Bank;