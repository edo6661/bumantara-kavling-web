import { useState } from 'react';
import { HardHat } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import PageLoader from '../PageLoader';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useGetTukangList, useUpsertTukang } from '../../hooks/queries/useTukang';
import type { TukangData } from '../../services/tukang.service';
import { handleApiError } from '../../utils/errorHandler';

interface TukangFormState {
  nik: string;
  nama: string;
}

const initialForm = (): TukangFormState => ({ nik: '', nama: '' });

const Tukang = () => {
  const { user } = useAuth();
  const isMandor = user?.role === 'MANDOR';
  const { canCreate, canUpdate } = usePermission('SPK');
  const canManage = isMandor ? true : canCreate || canUpdate;

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNik, setEditingNik] = useState<string | null>(null);
  const [form, setForm] = useState<TukangFormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const { data: list = [], isLoading } = useGetTukangList(search || undefined);
  const upsertMutation = useUpsertTukang();

  const columns = [
    { header: 'NIK', accessor: 'nik' as const },
    { header: 'Nama', accessor: 'nama' as const },
    ...(!isMandor
      ? [
          {
            header: 'Mandor',
            accessor: 'mandorUsername' as const,
            render: (val: string | null | undefined) => (
              <span className="text-slate-600">{val || '—'}</span>
            ),
          },
        ]
      : []),
  ];

  const openCreate = () => {
    setEditingNik(null);
    setForm(initialForm());
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (row: TukangData) => {
    setEditingNik(row.nik);
    setForm({ nik: row.nik, nama: row.nama });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNik(null);
    setForm(initialForm());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<string, string>> = {};
    if (!form.nik.trim()) next.nik = 'NIK wajib diisi';
    if (!form.nama.trim()) next.nama = 'Nama wajib diisi';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await upsertMutation.mutateAsync({
        nik: form.nik.trim(),
        nama: form.nama.trim(),
      });
      closeModal();
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4 max-w-[1000px] mx-auto pb-10">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
          <HardHat size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Data Tukang</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isMandor
              ? 'Kelola tukang untuk SPK Anda. Daftar ini hanya tampil untuk mandor yang login.'
              : 'Daftar tukang per mandor untuk pengajuan upah di SPK.'}
          </p>
        </div>
      </div>

      <DataTable
        title="Tukang"
        columns={columns}
        data={list}
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari NIK atau nama..."
        onAdd={canManage ? openCreate : undefined}
        onEdit={canManage ? openEdit : undefined}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingNik ? 'Edit Tukang' : 'Tambah Tukang'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="NIK"
            name="nik"
            value={form.nik}
            onChange={handleChange}
            error={errors.nik}
            disabled={!!editingNik}
          />
          <Input
            label="Nama"
            name="nama"
            value={form.nama}
            onChange={handleChange}
            error={errors.nama}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={upsertMutation.isPending}
              className="px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {upsertMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tukang;
