import { useRef, useState } from 'react';
import { FileText, HardHat, UploadCloud, ZoomIn } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import PageLoader from '../PageLoader';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import {
  useGetTukangList,
  useUploadTukangKtp,
  useUpsertTukang,
} from '../../hooks/queries/useTukang';
import type { TukangData } from '../../services/tukang.service';
import { handleApiError } from '../../utils/errorHandler';
import { getNikValidationError, isNikDuplicate, sanitizeNikInput } from '../../utils/nik';
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
  marital: TukangMaritalFormValue;
}

const initialForm = (): TukangFormState => ({
  nik: '',
  nama: '',
  marital: initialTukangMaritalForm(),
});

const isPdfUrl = (url: string) =>
  url.split('?')[0].toLowerCase().endsWith('.pdf') || url.includes('application/pdf');

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
  const [existingFileKtp, setExistingFileKtp] = useState<string | null>(null);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [previewKtpUrl, setPreviewKtpUrl] = useState<string | null>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  const { data: list = [], isLoading } = useGetTukangList(search || undefined);
  const upsertMutation = useUpsertTukang();
  const uploadKtpMutation = useUploadTukangKtp();

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
      accessor: 'fileKtp' as const,
      render: (val: string | null | undefined) => {
        if (!val) return <span className="text-slate-400">—</span>;
        const pdf = isPdfUrl(val);
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setPreviewKtpUrl(val);
            }}
            className="relative w-14 h-10 rounded border border-slate-200 overflow-hidden cursor-zoom-in group shadow-sm bg-slate-100"
            title="Lihat KTP"
          >
            {pdf ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500">
                <FileText size={16} />
                <span className="text-[8px] font-bold mt-0.5">PDF</span>
              </div>
            ) : (
              <img
                src={val}
                alt="KTP"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <ZoomIn className="text-white" size={14} />
            </div>
          </div>
        );
      },
    },
  ];

  const resetKtpState = () => {
    if (ktpPreview?.startsWith('blob:')) URL.revokeObjectURL(ktpPreview);
    setExistingFileKtp(null);
    setKtpFile(null);
    setKtpPreview(null);
    if (ktpInputRef.current) ktpInputRef.current.value = '';
  };

  const openCreate = () => {
    setEditingNik(null);
    setForm(initialForm());
    setErrors({});
    resetKtpState();
    setIsModalOpen(true);
  };

  const openEdit = (row: TukangData) => {
    setEditingNik(row.nik);
    setForm({
      nik: row.nik,
      nama: row.nama,
      marital: tukangMaritalFromData(row.sudahMenikah, row.jumlahAnak),
    });
    setErrors({});
    resetKtpState();
    setExistingFileKtp(row.fileKtp);
    setKtpPreview(row.fileKtp);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNik(null);
    setForm(initialForm());
    resetKtpState();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'nik' ? sanitizeNikInput(value) : value;
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

  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Hanya format gambar dan PDF yang diperbolehkan.');
      e.target.value = '';
      return;
    }
    if (ktpPreview?.startsWith('blob:')) URL.revokeObjectURL(ktpPreview);
    setKtpFile(file);
    setKtpPreview(URL.createObjectURL(file));
    if (errors.fileKtp) setErrors((prev) => ({ ...prev, fileKtp: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<string, string>> = {};
    if (!editingNik) {
      const nikError = getNikValidationError(form.nik);
      if (nikError) next.nik = nikError;
      else if (isNikDuplicate(form.nik, list, { field: 'nik' })) {
        next.nik = 'NIK sudah terdaftar';
      }
    }
    if (!form.nama.trim()) next.nama = 'Nama wajib diisi';
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
      const nik = sanitizeNikInput(form.nik);
      await upsertMutation.mutateAsync({
        nik,
        nama: form.nama.trim(),
        ...maritalPayload,
      });
      if (ktpFile) {
        await uploadKtpMutation.mutateAsync({ nik, file: ktpFile });
      }
      closeModal();
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const previewUrl = ktpPreview ?? existingFileKtp;
  const isSaving = upsertMutation.isPending || uploadKtpMutation.isPending;

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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Foto KTP (opsional)
            </label>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
                <span className="text-xs text-slate-500">
                  Format gambar atau PDF
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 cursor-pointer">
                  <UploadCloud size={14} />
                  {previewUrl ? 'Ganti File' : 'Upload File'}
                  <input
                    ref={ktpInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleKtpFileChange}
                    disabled={isSaving}
                  />
                </label>
              </div>
              <div className="h-44 bg-slate-100 flex items-center justify-center">
                {previewUrl ? (
                  isPdfUrl(previewUrl) ? (
                    <iframe
                      src={previewUrl}
                      title="Preview KTP"
                      className="w-full h-full border-none"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview KTP"
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <span className="text-sm text-slate-400">Belum ada foto KTP</span>
                )}
              </div>
            </div>
            {errors.fileKtp && (
              <p className="mt-1 text-xs text-red-600">{errors.fileKtp}</p>
            )}
          </div>
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
              disabled={isSaving}
              className="px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!previewKtpUrl}
        onClose={() => setPreviewKtpUrl(null)}
        title="Pratinjau Foto KTP"
      >
        <div className="flex flex-col items-center">
          {previewKtpUrl && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {isPdfUrl(previewKtpUrl) ? (
                <iframe
                  src={previewKtpUrl}
                  className="w-full h-[70vh] rounded-lg border-none"
                  title="PDF KTP"
                />
              ) : (
                <img
                  src={previewKtpUrl}
                  alt="Foto KTP"
                  className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain"
                />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a
              href={previewKtpUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              Buka Tab Baru
            </a>
            <button
              type="button"
              onClick={() => setPreviewKtpUrl(null)}
              className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tukang;
