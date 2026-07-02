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
import { getNikValidationError, getOptionalNikValidationError, isNikDuplicate, sanitizeNikInput } from '../../utils/nik';
import {
  TUKANG_MAX_JUMLAH_ANAK,
  formatTukangStatusPernikahan,
  initialTukangMaritalForm,
  tukangMaritalFromData,
  tukangMaritalToPayload,
  validateTukangMaritalForm,
  type TukangMaritalFormValue,
} from '../../utils/tukang';

interface TukangFormState {
  nik: string;
  nama: string;
  ktp: string;
  marital: TukangMaritalFormValue;
}

const initialForm = (): TukangFormState => ({
  nik: '',
  nama: '',
  ktp: '',
  marital: initialTukangMaritalForm(),
});

const TukangMaritalFields = ({
  marital,
  onChange,
  errors,
  idPrefix,
}: {
  marital: TukangMaritalFormValue;
  onChange: (next: TukangMaritalFormValue) => void;
  errors: Partial<Record<'sudahMenikah' | 'jumlahAnak', string>>;
  idPrefix: string;
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Status pernikahan
      </label>
      <select
        id={`${idPrefix}-sudah-menikah`}
        name="sudahMenikah"
        value={marital.sudahMenikah === '' ? '' : marital.sudahMenikah ? '1' : '0'}
        onChange={(e) => {
          const value = e.target.value;
          if (value === '') {
            onChange({ sudahMenikah: '', jumlahAnak: '' });
            return;
          }
          const sudahMenikah = value === '1';
          onChange({
            sudahMenikah,
            jumlahAnak: sudahMenikah ? marital.jumlahAnak : 0,
          });
        }}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
          errors.sudahMenikah ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        <option value="">Pilih status</option>
        <option value="0">Belum menikah</option>
        <option value="1">Sudah menikah</option>
      </select>
      {errors.sudahMenikah && (
        <p className="mt-1 text-xs text-red-600">{errors.sudahMenikah}</p>
      )}
    </div>
    {marital.sudahMenikah === true && (
      <div>
        <label
          htmlFor={`${idPrefix}-jumlah-anak`}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Jumlah anak
        </label>
        <select
          id={`${idPrefix}-jumlah-anak`}
          name="jumlahAnak"
          value={marital.jumlahAnak === '' ? '' : String(marital.jumlahAnak)}
          onChange={(e) =>
            onChange({
              ...marital,
              jumlahAnak: e.target.value === '' ? '' : Number(e.target.value),
            })
          }
          className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
            errors.jumlahAnak ? 'border-red-400' : 'border-slate-200'
          }`}
        >
          <option value="">Pilih jumlah anak</option>
          {Array.from({ length: TUKANG_MAX_JUMLAH_ANAK + 1 }, (_, i) => (
            <option key={i} value={i}>
              {i} anak
            </option>
          ))}
        </select>
        {errors.jumlahAnak && (
          <p className="mt-1 text-xs text-red-600">{errors.jumlahAnak}</p>
        )}
      </div>
    )}
  </div>
);

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
    {
      header: 'Status pernikahan',
      accessor: 'sudahMenikah' as const,
      render: (_: boolean | null, row: TukangData) => (
        <span className="text-slate-600">
          {formatTukangStatusPernikahan(row.sudahMenikah, row.jumlahAnak)}
        </span>
      ),
    },
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
    {
      header: 'KTP',
      accessor: 'ktp' as const,
      render: (val: string | null | undefined) => (
        <span className="text-slate-600 tabular-nums">{val || '—'}</span>
      ),
    },
  ];

  const openCreate = () => {
    setEditingNik(null);
    setForm(initialForm());
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (row: TukangData) => {
    setEditingNik(row.nik);
    setForm({
      nik: row.nik,
      nama: row.nama,
      ktp: row.ktp ?? '',
      marital: tukangMaritalFromData(row.sudahMenikah, row.jumlahAnak),
    });
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
    const nextValue =
      name === 'nik' || name === 'ktp' ? sanitizeNikInput(value) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleMaritalChange = (marital: TukangMaritalFormValue) => {
    setForm((prev) => ({ ...prev, marital }));
    setErrors((prev) => ({
      ...prev,
      sudahMenikah: undefined,
      jumlahAnak: undefined,
    }));
  };

  const validate = () => {
    const next: Partial<Record<string, string>> = {};
    // Edit hanya mengubah nama; NIK dikunci & backend tidak mengubah NIK.
    if (!editingNik) {
      const nikError = getNikValidationError(form.nik);
      if (nikError) next.nik = nikError;
      else if (isNikDuplicate(form.nik, list, { field: 'nik' })) {
        next.nik = 'NIK sudah terdaftar';
      }
    }
    if (!form.nama.trim()) next.nama = 'Nama wajib diisi';
    const ktpError = getOptionalNikValidationError(form.ktp, 'KTP');
    if (ktpError) next.ktp = ktpError;
    const maritalErrors = validateTukangMaritalForm(form.marital);
    Object.assign(next, maritalErrors);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const maritalPayload = tukangMaritalToPayload(form.marital);
      const ktpDigits = sanitizeNikInput(form.ktp);
      await upsertMutation.mutateAsync({
        nik: sanitizeNikInput(form.nik),
        nama: form.nama.trim(),
        ktp: ktpDigits || null,
        ...maritalPayload,
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
            placeholder="16 digit"
            inputMode="numeric"
            maxLength={16}
          />
          <Input
            label="Nama"
            name="nama"
            value={form.nama}
            onChange={handleChange}
            error={errors.nama}
          />
          <Input
            label="KTP (16 digit, opsional)"
            name="ktp"
            value={form.ktp}
            onChange={handleChange}
            error={errors.ktp}
            placeholder="Kosongkan jika belum tersedia"
            inputMode="numeric"
            maxLength={16}
          />
          <TukangMaritalFields
            idPrefix="tukang-form"
            marital={form.marital}
            onChange={handleMaritalChange}
            errors={{
              sudahMenikah: errors.sudahMenikah,
              jumlahAnak: errors.jumlahAnak,
            }}
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
