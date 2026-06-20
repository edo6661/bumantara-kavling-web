import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import PageLoader from '../PageLoader';
import { useAuth } from '../../context/AuthContext';
import {
  useAddTahapanLogBySpk,
  useGetProgressInfraDetail,
  useGetProgressInfraList,
} from '../../hooks/queries/useProgressProyek';
import InfraTotalProgressOverrideControls from '../../components/proyek/InfraTotalProgressOverrideControls';
import { handleApiError } from '../../utils/errorHandler';
import {
  HardHat, UploadCloud, Loader2, Trash2, Edit2,
  CheckCircle2, Circle,
} from 'lucide-react';
import type { ProgressInfraListItem, TahapanProyekData } from '../../services/progressProyek.service';
import { formatDate } from '../../utils/formatters';
import {
  groupPekerjaanByKategori,
  getPekerjaanInfraIcon,
  getPekerjaanInfraActiveColor,
  PEKERJAAN_INFRA_IDLE_CLASS,
  pekerjaanInfraHasProgress,
  type PekerjaanInfraKategori,
} from '../../constants/pekerjaanInfra';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

const canUploadProgress = (
  userRole: string | undefined,
  userId: number | undefined,
  mandorId: number | null | undefined,
): boolean => {
  if (userRole !== 'MANDOR') return true;
  return !!userId && mandorId === userId;
};

const ProgressInfrastrukturPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;

  const { user } = useAuth();
  const isMandorRole = user?.role === 'MANDOR';
  const canEditTotalProgress = user?.role !== 'MANDOR';

  const { data: listResponse, isLoading } = useGetProgressInfraList({
    page,
    limit,
    ...(search ? { search } : {}),
  });

  const meta = listResponse?.meta;
  const [selectedSpkId, setSelectedSpkId] = useState<number | null>(null);
  const [directPekerjaan, setDirectPekerjaan] = useState<string | null>(null);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
    });
  };

  const handlePageSizeChange = (newLimit: number) => {
    setSearchParams((prev) => {
      if (newLimit === DEFAULT_PAGE_SIZE) prev.delete('limit');
      else prev.set('limit', String(newLimit));
      prev.set('page', '1');
      return prev;
    });
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchParams((prev) => {
      if (newSearch) prev.set('search', newSearch);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  };

  const columns = [
    {
      header: 'SPK & Pekerjaan',
      accessor: 'noSpk',
      render: (_val: string, row: ProgressInfraListItem) => (
        <div className="py-0.5">
          <span className="font-bold text-slate-900 block text-sm">{row.noSpk}</span>
          <span className="text-xs text-slate-500 block mt-0.5">{row.judulPekerjaan}</span>
          {row.zonaNama && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md mt-1">
              Zona {row.zonaNama}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Mandor',
      accessor: 'mandor',
      render: (val: ProgressInfraListItem['mandor']) => (
        <span className="text-slate-700 font-semibold text-sm">{val.username}</span>
      ),
    },
    {
      header: 'Item Pekerjaan',
      accessor: 'pekerjaanItems',
      render: (val: ProgressInfraListItem['pekerjaanItems']) => (
        <span className="text-xs font-bold text-slate-700">{val.length} item</span>
      ),
    },
    {
      header: 'Total Progress',
      accessor: 'progressProyek',
      render: (_val: ProgressInfraListItem['progressProyek'], row: ProgressInfraListItem) => (
        <InfraTotalProgressOverrideControls
          spkId={row.spkId}
          fallbackProgress={Number(row.progressProyek?.persentase ?? 0)}
          fallbackIsOverride={row.progressProyek?.persentaseIsOverride}
          canEdit={canEditTotalProgress}
          compact
        />
      ),
    },
    {
      header: 'Aksi',
      accessor: 'spkId',
      render: (_val: number, row: ProgressInfraListItem) => (
        <div className="flex flex-col gap-2 min-w-[200px]">
          {groupPekerjaanByKategori(
            row.pekerjaanItems.map((item) => ({
              ...item,
              kategori: (item.kategori as PekerjaanInfraKategori) ?? 'LAINNYA',
            })),
          ).map((group) => (
            <div key={group.kategori}>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                {group.label}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {group.items.map((item) => {
                  const Icon = getPekerjaanInfraIcon(item.urutan);
                  const hasProgress = pekerjaanInfraHasProgress(item.latestPersentase);
                  const colorClass = hasProgress
                    ? getPekerjaanInfraActiveColor(item.urutan)
                    : PEKERJAAN_INFRA_IDLE_CLASS;
                  return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.nama}
                    onClick={() => {
                      setSelectedSpkId(row.spkId);
                      setDirectPekerjaan(item.nama);
                    }}
                    className={`p-1.5 rounded-lg border text-xs font-medium shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110 hover:shadow-md ${colorClass}`}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                  </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            type="button"
            title="Kelola Progress"
            onClick={() => {
              setSelectedSpkId(row.spkId);
              setDirectPekerjaan(null);
            }}
            className="p-1.5 rounded-lg border border-slate-900 bg-slate-900 text-white shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-black hover:shadow-md w-fit"
          >
            <HardHat size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading && !listResponse) return <PageLoader />;

  return (
    <div className="space-y-6">
      {isMandorRole && listResponse?.items.length === 0 && !isLoading && page === 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <HardHat size={24} className="text-amber-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-amber-900">Belum ada SPK infrastruktur yang ditugaskan</p>
        </div>
      )}

      {canEditTotalProgress && (
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Progress dihitung dari <strong>rata-rata persentase terbaru per item pekerjaan</strong>.
            Admin dapat override total progress per SPK infra.
          </p>
        </div>
      )}

      <DataTable
        title={isMandorRole ? 'SPK Infrastruktur Saya' : 'Progress Infrastruktur'}
        columns={columns}
        data={listResponse?.items ?? []}
        serverSide
        searchTerm={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Cari no. SPK, judul, zona, atau mandor..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={handlePageChange}
        pageSize={limit}
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        onPageSizeChange={handlePageSizeChange}
      />

      {selectedSpkId && !directPekerjaan && (
        <InfraDetailModal
          spkId={selectedSpkId}
          onClose={() => setSelectedSpkId(null)}
          canEditTotalProgress={canEditTotalProgress}
        />
      )}

      {selectedSpkId && directPekerjaan && (
        <InfraPekerjaanEditModal
          spkId={selectedSpkId}
          namaPekerjaan={directPekerjaan}
          onClose={() => {
            setSelectedSpkId(null);
            setDirectPekerjaan(null);
          }}
        />
      )}
    </div>
  );
};

interface InfraDetailModalProps {
  spkId: number;
  onClose: () => void;
  canEditTotalProgress: boolean;
}

const InfraDetailModal = ({ spkId, onClose, canEditTotalProgress }: InfraDetailModalProps) => {
  const { user } = useAuth();
  const { data, isLoading } = useGetProgressInfraDetail(spkId);
  const [selectedPekerjaan, setSelectedPekerjaan] = useState<string | null>(null);

  const canUpload = canUploadProgress(
    user?.role,
    user?.id,
    data?.progress.mandorId ?? data?.spk.mandorId,
  );

  if (!data && isLoading) {
    return (
      <Modal isOpen onClose={onClose} title="Progress Infrastruktur" size="lg">
        <div className="py-16 flex justify-center">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      </Modal>
    );
  }

  if (!data) return null;

  return (
    <>
      <Modal isOpen onClose={onClose} title="Kelola Progress Infrastruktur" size="lg">
        <div className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SPK</p>
            <h3 className="text-xl font-black">{data.spk.noSpk}</h3>
            <p className="text-sm text-slate-300 mt-1">{data.spk.judulPekerjaan}</p>
            {data.spk.zonaNama && (
              <p className="text-xs text-emerald-300 mt-2">{data.spk.zonaNama}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50/40">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1.5">Mandor Proyek</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-black text-blue-800">
                    {data.spk.mandor.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <p className="font-bold text-blue-900">{data.spk.mandor.username}</p>
              </div>
            </div>
            <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50/40">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">Total Progress SPK</p>
              <InfraTotalProgressOverrideControls
                spkId={spkId}
                fallbackProgress={Number(data.progress.persentase)}
                fallbackIsOverride={data.progress.persentaseIsOverride}
                canEdit={canEditTotalProgress}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Item Pekerjaan</h4>
            </div>
            <div className="overflow-x-auto space-y-4 p-4">
              {groupPekerjaanByKategori(
                data.pekerjaanItems.map((item) => ({
                  ...item,
                  kategori: (item.kategori as PekerjaanInfraKategori) ?? 'LAINNYA',
                })),
              ).map((group) => (
                <div key={group.kategori} className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {group.label}
                    </h5>
                  </div>
                  <table className="w-full text-left text-sm border-collapse bg-white">
                    <thead className="bg-slate-50/60 border-b border-slate-100">
                      <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                        <th className="px-4 py-2.5 font-bold">Pekerjaan</th>
                        <th className="px-4 py-2.5 font-bold">Progress</th>
                        <th className="px-4 py-2.5 font-bold">Tgl Update</th>
                        <th className="px-4 py-2.5 font-bold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item) => {
                        const logs = data.progress.tahapan.filter(
                          (t) => t.namaTahapan === item.nama,
                        );
                        const latest = logs.sort(
                          (a, b) =>
                            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
                        )[0];
                        const isCompleted = latest && latest.persentase > 0;
                        const ItemIcon = getPekerjaanInfraIcon(item.urutan);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <CheckCircle2 size={13} className="text-emerald-500" />
                                ) : (
                                  <Circle size={13} className="text-slate-300" />
                                )}
                                <ItemIcon
                                  size={13}
                                  className={isCompleted ? 'text-emerald-600' : 'text-slate-400'}
                                  strokeWidth={1.5}
                                />
                                <span
                                  className={`font-semibold text-xs ${isCompleted ? 'text-emerald-700' : 'text-slate-600'}`}
                                >
                                  {item.nama}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {latest ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-1.5 rounded-full"
                                      style={{ width: `${latest.persentase}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">
                                    {latest.persentase}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300 italic">Belum dimulai</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {latest ? (
                                <span className="text-xs text-slate-500">
                                  {formatDate(latest.tanggal)}
                                </span>
                              ) : (
                                <span className="text-slate-200">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setSelectedPekerjaan(item.nama)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-blue-700 cursor-pointer"
                              >
                                <Edit2 size={11} /> {canUpload ? 'Input' : 'Riwayat'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {selectedPekerjaan && (
        <InfraPekerjaanEditModal
          spkId={spkId}
          namaPekerjaan={selectedPekerjaan}
          onClose={() => setSelectedPekerjaan(null)}
        />
      )}
    </>
  );
};

const clampPersentase = (value: number) => {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

const getLatestTahapanLog = (tahapan: TahapanProyekData[], namaTahapan: string) =>
  tahapan
    .filter((t) => t.namaTahapan === namaTahapan)
    .sort((a, b) => {
      const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
    })[0];

interface InfraPekerjaanEditModalProps {
  spkId: number;
  namaPekerjaan: string;
  onClose: () => void;
}

const InfraPekerjaanEditModal = ({
  spkId,
  namaPekerjaan,
  onClose,
}: InfraPekerjaanEditModalProps) => {
  const { user } = useAuth();
  const { data, isLoading } = useGetProgressInfraDetail(spkId);
  const addLogMutation = useAddTahapanLogBySpk();

  const pekerjaanItem = data?.pekerjaanItems.find((p) => p.nama === namaPekerjaan);
  const PekerjaanIcon = getPekerjaanInfraIcon(pekerjaanItem?.urutan ?? 1);
  const pekerjaanColor = getPekerjaanInfraActiveColor(pekerjaanItem?.urutan ?? 1);

  const today = new Date().toISOString().split('T')[0]!;
  const latestLog = useMemo(() => {
    if (!data) return null;
    return getLatestTahapanLog(data.progress.tahapan, namaPekerjaan);
  }, [data, namaPekerjaan]);

  const [persentase, setPersentase] = useState(0);
  const [persentaseInput, setPersentaseInput] = useState('0');
  const [deskripsi, setDeskripsi] = useState('');
  const [tanggal, setTanggal] = useState(today);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  React.useEffect(() => {
    const initial = clampPersentase(latestLog ? Number(latestLog.persentase) : 0);
    setPersentase(initial);
    setPersentaseInput(String(initial));
  }, [latestLog]);

  const canUpload = canUploadProgress(
    user?.role,
    user?.id,
    data?.progress.mandorId ?? data?.spk.mandorId,
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((files) => files.filter((_, index) => index !== indexToRemove));
  };

  const syncPersentaseFromInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits === '') {
      setPersentaseInput('');
      return;
    }
    const parsed = clampPersentase(parseInt(digits, 10));
    setPersentaseInput(String(parsed));
    setPersentase(parsed);
  };

  const syncPersentaseFromSlider = (raw: string) => {
    const parsed = clampPersentase(Number(raw));
    setPersentaseInput(String(parsed));
    setPersentase(parsed);
  };

  if (isLoading || !data) {
    return (
      <Modal isOpen onClose={onClose} title={`Pekerjaan: ${namaPekerjaan}`} size="md">
        <div className="py-16 flex flex-col items-center justify-center">
          <Loader2 size={28} className="animate-spin text-blue-500 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Memuat detail pekerjaan...</p>
        </div>
      </Modal>
    );
  }

  const assignedMandorName = data.spk.mandor.username;
  const riwayat = data.progress.tahapan
    .filter((t) => t.namaTahapan === namaPekerjaan)
    .sort((a, b) => {
      const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
    });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpload) return;
    if (persentaseInput === '') {
      alert('Persentase pembangunan wajib diisi (0–100%).');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('Minimal 1 foto wajib diunggah');
      return;
    }
    try {
      await addLogMutation.mutateAsync({
        spkId,
        namaTahapan: namaPekerjaan,
        persentase,
        deskripsi,
        tanggal,
        files: selectedFiles,
      });
      alert(`Log progres ${namaPekerjaan} berhasil ditambahkan!`);
      setSelectedFiles([]);
      setDeskripsi('');
      setTanggal(today);
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const isSaving = addLogMutation.isPending;

  return (
    <Modal isOpen onClose={onClose} title={`Pekerjaan: ${namaPekerjaan}`} size="md">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold mb-5 ${pekerjaanColor}`}>
        <PekerjaanIcon size={14} strokeWidth={1.5} />
        {namaPekerjaan}
      </div>

      {!canUpload && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-bold text-amber-900 text-sm">Mode lihat saja</p>
          <p className="text-xs mt-1 text-amber-800 leading-relaxed">
            Hanya mandor yang ditugaskan ({assignedMandorName}) yang dapat mengunggah laporan progress.
          </p>
        </div>
      )}

      {canUpload && (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <label className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-3 block">
              Update Persentase Pembangunan
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={persentase}
                onChange={(e) => syncPersentaseFromSlider(e.target.value)}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  value={persentaseInput}
                  onChange={(e) => syncPersentaseFromInput(e.target.value)}
                  className="w-14 px-2 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-black text-blue-700 text-center outline-none focus:ring-2 focus:ring-blue-400/30"
                />
                <span className="font-bold text-blue-600 text-sm">%</span>
              </div>
            </div>
            <div className="mt-3 bg-blue-100/70 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${persentase}%` }}
              />
            </div>
          </div>

          <Input
            label="Tanggal Laporan"
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
              Deskripsi
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all min-h-[90px] text-slate-900 resize-none"
              placeholder={`Catatan kondisi pengerjaan ${namaPekerjaan}...`}
            />
          </div>

          <div className="space-y-3 pt-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 block">
              Galeri Foto Dokumentasi
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              <UploadCloud
                size={24}
                className={`mb-2 transition-colors ${dragActive ? 'text-blue-500' : 'text-slate-400'}`}
              />
              <p className="text-xs font-semibold text-slate-600 mb-0.5">Tarik &amp; lepas gambar ke sini</p>
              <p className="text-[10px] text-slate-400 mb-3">Bisa memilih lebih dari 1 file</p>
              <label className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-50 transition shadow-sm">
                Pilih Foto
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">
                  Foto Siap Diunggah ({selectedFiles.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-200 group"
                    >
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(idx)}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </button>
          </div>
        </form>
      )}

      {!canUpload && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <div className={`${canUpload ? 'mt-8' : 'mt-2'} border-t border-slate-200 pt-6`}>
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-4">
          Riwayat — {namaPekerjaan}
        </h4>
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm border-collapse bg-white">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-center">Progress</th>
                <th className="px-4 py-3">Pelapor</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3 text-center">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riwayat.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {formatDate(log.tanggal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100">
                      {log.persentase}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                    {log.reportedBy?.username || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px] truncate" title={log.deskripsi || ''}>
                    {log.deskripsi || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center -space-x-2">
                      {log.foto.map((url: string, fIdx: number) => (
                        <a
                          key={fIdx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-sm hover:z-10 hover:scale-110 transition-transform"
                        >
                          <img src={url} alt="Foto" className="w-full h-full object-cover" />
                        </a>
                      ))}
                      {log.foto.length === 0 && <span className="text-slate-300 text-xs">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 italic">
                    Belum ada riwayat progres untuk pekerjaan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default ProgressInfrastrukturPanel;
