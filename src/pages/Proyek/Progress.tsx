import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import PageLoader from "../PageLoader";
import { useAuth } from "../../context/AuthContext";
import {
  useAddTahapanLog,
  useGetProgressProyek,
  useGetProgressProyekList,
  useUploadTahapanPhotos,
  type ProgressProyekScope,
} from "../../hooks/queries/useProgressProyek";
import { useGetSpk } from "../../hooks/queries/useSpk";
import TotalProgressOverrideControls from '../../components/proyek/TotalProgressOverrideControls';
import { handleApiError } from '../../utils/errorHandler';
import type { LucideIcon } from 'lucide-react';
import {
  HardHat, UploadCloud, Loader2, Trash2, Edit2,
  Layers, Columns3, BrickWall, Home, LayoutGrid,
  PanelTop, Droplets, Zap, Paintbrush, CheckCircle2, Circle,
  ArrowUpDown, ChevronDown, Building2,
} from 'lucide-react';
import ProgressInfrastrukturPanel from './ProgressInfrastrukturPanel';
import type { ProgressProyekData, TahapanProyekData } from '../../services/progressProyek.service';
import { formatDate } from '../../utils/formatters';

interface ProgressProyekSummary {
  persentase: number;
  persentaseIsOverride?: boolean;
  mandorId: number | null;
  mandor: { id: number; username: string } | null;
  tahapanLatest?: Record<string, number>;
}

interface ProyekRow {
  id: string;
  dbId: number | null;
  kavlingId: number;
  nama: string;
  blok: string;
  nomorUnit: string;
  progressProyek: ProgressProyekSummary | null;
  status: string;
}

const getProgressScope = (row: ProyekRow): ProgressProyekScope =>
  row.dbId != null ? { penjualanId: row.dbId } : { kavlingId: row.kavlingId };

const TAHAPAN_LIST = [
  'Pondasi', 'Kolom', 'Dinding', 'Atap', 'Lantai',
  'Plafon', 'Pipa', 'Electrical', 'Finishing'
] as const;

const canUploadProgress = (
  userRole: string | undefined,
  userId: number | undefined,
  mandorId: number | null | undefined,
): boolean => {
  if (userRole !== 'MANDOR') return true;
  return !!userId && mandorId === userId;
};

const TAHAPAN_ICON_MAP: Record<(typeof TAHAPAN_LIST)[number], LucideIcon> = {
  Pondasi: Layers,
  Kolom: Columns3,
  Dinding: BrickWall,
  Atap: Home,
  Lantai: LayoutGrid,
  Plafon: PanelTop,
  Pipa: Droplets,
  Electrical: Zap,
  Finishing: Paintbrush,
};

// Warna per tahapan — hanya dipakai jika tahapan sudah punya progress
const TAHAPAN_COLOR_MAP: Record<(typeof TAHAPAN_LIST)[number], string> = {
  Pondasi:    'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100',
  Kolom:      'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
  Dinding:    'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100',
  Atap:       'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
  Lantai:     'text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100',
  Plafon:     'text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
  Pipa:       'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
  Electrical: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  Finishing:  'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
};

const TAHAPAN_IDLE_CLASS =
  'text-slate-400 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const Progress = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'infra' ? 'infra' : 'rumah';

  const handleTabChange = (tab: 'rumah' | 'infra') => {
    setSearchParams((prev) => {
      if (tab === 'infra') prev.set('tab', 'infra');
      else prev.delete('tab');
      prev.set('page', '1');
      return prev;
    });
  };

  const progressTabBar = (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
      <button
        type="button"
        onClick={() => handleTabChange('rumah')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          activeTab === 'rumah'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Building2 size={16} />
        Progress Rumah
      </button>
      <button
        type="button"
        onClick={() => handleTabChange('infra')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          activeTab === 'infra'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Layers size={16} />
        Progress Infrastruktur
      </button>
    </div>
  );

  if (activeTab === 'infra') {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        {progressTabBar}
        <ProgressInfrastrukturPanel />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {progressTabBar}
      <ProgressRumahContent searchParams={searchParams} setSearchParams={setSearchParams} />
    </div>
  );
};

const ProgressRumahContent = ({
  searchParams,
  setSearchParams,
}: {
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
}) => {
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const orderBy = searchParams.get('orderBy') || '';
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;

  const { user } = useAuth();
  const isMandorRole = user?.role === 'MANDOR';
  const canEditTotalProgress = user?.role !== 'MANDOR';

  const { data: proyekResponse, isLoading: loadingProyek } = useGetProgressProyekList({
    page,
    limit,
    ...(search ? { search } : {}),
    ...(orderBy ? { orderBy } : {}),
  });

  const meta = proyekResponse?.meta;

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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      if (e.target.value) prev.set('orderBy', e.target.value);
      else prev.delete('orderBy');
      prev.set('page', '1');
      return prev;
    });
  };

  const filterSelectClass =
    'w-full px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none transition-all shadow-sm cursor-pointer';

  const tableToolbar = canEditTotalProgress ? (
    <div className="relative group w-full sm:w-56">
      <select
        className={`${filterSelectClass} pl-9`}
        value={orderBy}
        onChange={handleSortChange}
        aria-label="Urutkan data"
      >
        <option value="">Mandor & Blok (Default)</option>
        <option value="progress:desc">Progress Tertinggi</option>
        <option value="progress:asc">Progress Terendah</option>
      </select>
      <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500" />
      <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
    </div>
  ) : undefined;

  const { data: spkList = [] } = useGetSpk();

  const spkByKavlingId = useMemo(() => {
    const map = new Map<number, { noSpk: string; progress: number }>();
    spkList.forEach((spk) => {
      spk.kavlingItems.forEach((k) => {
        map.set(k.kavlingId, { noSpk: spk.noSpk, progress: Number(spk.progress ?? 0) });
      });
    });
    return map;
  }, [spkList]);

  const proyekList: ProyekRow[] = useMemo(() => {
    if (!proyekResponse?.items) return [];
    return proyekResponse.items.map((item) => ({
      id: item.penjualanNoTransaksi ?? `kavling-${item.kavlingId}`,
      dbId: item.penjualanId,
      kavlingId: item.kavlingId,
      nama: item.nama,
      blok: item.blok,
      nomorUnit: item.nomorUnit,
      progressProyek: item.progressProyek
        ? {
            persentase: Number(item.progressProyek.persentase),
            persentaseIsOverride: item.progressProyek.persentaseIsOverride,
            mandorId: item.progressProyek.mandorId,
            mandor: item.progressProyek.mandor,
            tahapanLatest: item.progressProyek.tahapanLatest,
          }
        : null,
      status: item.status,
    }));
  }, [proyekResponse]);

  const [selectedProyek, setSelectedProyek] = useState<ProyekRow | null>(null);
  const [directTahapan, setDirectTahapan] = useState<string | null>(null);

  const openDetailModal = (row: ProyekRow) => {
    setSelectedProyek(row);
    setDirectTahapan(null);
  };

  const openTahapanModal = (row: ProyekRow, tahapan: string) => {
    setSelectedProyek(row);
    setDirectTahapan(tahapan);
  };

  const closeModals = () => {
    setSelectedProyek(null);
    setDirectTahapan(null);
  };

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = [
    {
      header: 'Customer & Blok',
      accessor: 'nama',
      render: (_val: string, row: ProyekRow) => {
        const spkInfo = spkByKavlingId.get(row.kavlingId);
        return (
          <div className="py-0.5">
            <span className="font-bold text-slate-900 block text-sm">{row.nama === '-' ? '' : row.nama}</span>
            <span className="text-xs font-medium text-slate-500 block mt-0.5">
              Blok {row.blok}-{row.nomorUnit}
            </span>
            {spkInfo && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md mt-1">
                SPK {spkInfo.noSpk}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Mandor',
      accessor: 'progressProyek',
      render: (val: ProgressProyekSummary | null) => {
        if (!val?.mandor?.username) {
          return <span className="text-slate-300 text-xs">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
          
            <span className="text-slate-700 font-semibold text-sm">{val.mandor.username}</span>
          </div>
        );
      },
    },
    {
      header: 'Total Progress',
      accessor: 'progressProyek',
      render: (_val: ProgressProyekSummary | null, row: ProyekRow) => (
        <TotalProgressOverrideControls
          scope={getProgressScope(row)}
          kavlingId={row.kavlingId}
          canEdit={canEditTotalProgress}
          compact
        />
      ),
    },
    {
      // ── Layout aksi DIPERTAHANKAN sesuai permintaan, hanya dipoles tampilan ──
      header: 'Aksi',
      accessor: 'dbId',
      render: (_val: number | null, row: ProyekRow) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {TAHAPAN_LIST.map((tahapan) => {
            const Icon = TAHAPAN_ICON_MAP[tahapan];
            const latest = row.progressProyek?.tahapanLatest?.[tahapan];
            const hasProgress = latest != null && latest > 0;
            const colorClass = hasProgress ? TAHAPAN_COLOR_MAP[tahapan] : TAHAPAN_IDLE_CLASS;
            return (
              <button
                key={tahapan}
                type="button"
                title={tahapan}
                onClick={() => openTahapanModal(row, tahapan)}
                className={`p-1.5 rounded-lg border text-xs font-medium shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110 hover:shadow-md ${colorClass}`}
              >
                <Icon size={14} strokeWidth={1.5} />
              </button>
            );
          })}
          <button
            type="button"
            title="Kelola Progress Lapangan"
            onClick={() => openDetailModal(row)}
            className="p-1.5 rounded-lg border border-slate-900 bg-slate-900 text-white shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-black hover:shadow-md"
          >
            <HardHat size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (loadingProyek && !proyekResponse) return <PageLoader />;

  return (
    <div className="space-y-6">
      {isMandorRole && proyekList.length === 0 && !loadingProyek && page === 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <HardHat size={24} className="text-amber-600" />
          </div>
          <p className="text-sm font-bold text-amber-900">Belum ada proyek yang ditugaskan</p>
          <p className="text-xs text-amber-700 mt-1">Hubungi admin untuk menambahkan kavling Anda ke SPK.</p>
        </div>
      )}

      {canEditTotalProgress && (
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <span className="text-slate-400 mt-0.5 shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="currentColor"/>
              <path d="M7 6v4M7 4.5V5" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            Admin dapat <strong>override total progress</strong> per unit atau reset ke default (kalkulasi dari tahapan). Progress unit mempengaruhi <strong>progress SPK</strong>.
          </p>
        </div>
      )}

      <DataTable
        title={isMandorRole ? 'Proyek Saya' : 'Laporan Progress Lapangan'}
        columns={columns}
        data={proyekList}
        serverSide
        searchTerm={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Cari mandor, customer, blok, atau no. SPK..."
        toolbarPrefix={tableToolbar}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={handlePageChange}
        pageSize={limit}
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        onPageSizeChange={handlePageSizeChange}
      />

      {selectedProyek && !directTahapan && (
        <ProgressDetailModal
          key={selectedProyek.id}
          isOpen={!!selectedProyek}
          onClose={closeModals}
          proyek={selectedProyek}
          scope={getProgressScope(selectedProyek)}
          canEditTotalProgress={canEditTotalProgress}
        />
      )}
      {selectedProyek && directTahapan && (
        <TahapanDirectEditModal
          key={`${selectedProyek.id}-${directTahapan}`}
          isOpen
          onClose={closeModals}
          proyek={selectedProyek}
          scope={getProgressScope(selectedProyek)}
          namaTahapan={directTahapan}
        />
      )}
    </div>
  );
};

interface TahapanDirectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyek: ProyekRow;
  scope: ProgressProyekScope;
  namaTahapan: string;
}

const TahapanDirectEditModal: React.FC<TahapanDirectEditModalProps> = ({
  isOpen,
  onClose,
  scope,
  namaTahapan,
}) => {
  const { user } = useAuth();
  const { data: progressData, isLoading } = useGetProgressProyek(scope);
  if (!isOpen) return null;
  if (isLoading || !progressData) {
    return (
      <Modal isOpen onClose={onClose} title={`Tahapan: ${namaTahapan}`} size="md">
        <div className="py-16 flex flex-col items-center justify-center">
          <Loader2 size={28} className="animate-spin text-blue-500 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Memuat detail tahapan...</p>
        </div>
      </Modal>
    );
  }
  return (
    <EditTahapanModal
      isOpen
      onClose={onClose}
      scope={scope}
      namaTahapan={namaTahapan}
      progressData={progressData}
      canUpload={canUploadProgress(user?.role, user?.id, progressData.mandorId)}
    />
  );
};

// ── ProgressDetailModal ────────────────────────────────────────────────────────
interface ProgressDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyek: ProyekRow;
  scope: ProgressProyekScope;
  canEditTotalProgress: boolean;
}

const ProgressDetailModal: React.FC<ProgressDetailModalProps> = ({
  isOpen,
  onClose,
  proyek,
  scope,
  canEditTotalProgress,
}) => {
  const { user } = useAuth();
  const isMandorRole = user?.role === 'MANDOR';
  const { data: progressData, isLoading } = useGetProgressProyek(scope);
  const [selectedTahapanToEdit, setSelectedTahapanToEdit] = useState<string | null>(null);

  const canUpload = canUploadProgress(
    user?.role,
    user?.id,
    progressData?.mandorId ?? proyek.progressProyek?.mandorId,
  );

  const mandorName =
    progressData?.mandor?.username ?? proyek.progressProyek?.mandor?.username;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Kelola Progress Lapangan" size="lg">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 size={28} className="animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-semibold text-slate-500">Memuat detail proyek...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kavling</p>
                <h3 className="text-xl font-black">Blok {proyek.blok}-{proyek.nomorUnit}</h3>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-sm font-bold text-slate-200">{proyek.nama}</p>
              </div>
            </div>

            {/* Mandor & Total Progress side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-4 border rounded-2xl ${mandorName ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mandor Proyek</p>
                {mandorName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-black text-blue-800">{mandorName.slice(0,2).toUpperCase()}</span>
                    </div>
                    <p className="font-bold text-blue-900">{mandorName}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-600 text-sm">Belum ditugaskan</p>
                    {!isMandorRole && (
                      <p className="text-xs text-slate-500 mt-0.5">Assign via menu SPK.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50/40">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">Total Progress Unit</p>
                <TotalProgressOverrideControls
                  scope={scope}
                  kavlingId={proyek.kavlingId}
                  canEdit={canEditTotalProgress}
                />
              </div>
            </div>

            {/* Tabel Tahapan */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Detail Tahapan</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse bg-white">
                  <thead className="bg-slate-50/60 border-b border-slate-100">
                    <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-3.5 font-bold">Tahapan</th>
                      <th className="px-4 py-3.5 font-bold">Progress</th>
                      <th className="px-4 py-3.5 font-bold">Tgl Update</th>
                      <th className="px-4 py-3.5 font-bold">Deskripsi</th>
                      <th className="px-4 py-3.5 font-bold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {TAHAPAN_LIST.map((tahapan) => {
                      const tDataLogs = progressData?.tahapan.filter((t) => t.namaTahapan === tahapan) || [];
                      const tData = tDataLogs.sort((a, b) => {
                        const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
                        if (dateDiff !== 0) return dateDiff;
                        return (b.id || 0) - (a.id || 0);
                      })[0];
                      const isCompleted = tData && tData.persentase > 0;
                      const Icon = TAHAPAN_ICON_MAP[tahapan];

                      return (
                        <tr key={tahapan} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {isCompleted
                                ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                : <Circle size={13} className="text-slate-300 shrink-0" />
                              }
                              <Icon size={13} className={isCompleted ? 'text-emerald-600' : 'text-slate-400'} strokeWidth={1.5} />
                              <span className={`font-semibold text-xs ${isCompleted ? 'text-emerald-700' : 'text-slate-600'}`}>
                                {tahapan}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {tData ? (
                              <div className="flex items-center gap-2">
                                <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-1.5 rounded-full"
                                    style={{ width: `${tData.persentase}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{tData.persentase}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 italic">Belum dimulai</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {tData ? (
                              <span className="text-xs font-medium text-slate-500">{formatDate(tData.tanggal)}</span>
                            ) : (
                              <span className="text-slate-200 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {tData?.deskripsi ? (
                              <p className="text-xs text-slate-600 line-clamp-2 max-w-[180px]" title={tData.deskripsi}>
                                {tData.deskripsi}
                              </p>
                            ) : (
                              <span className="text-slate-200 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {canUpload ? (
                              <button
                                onClick={() => setSelectedTahapanToEdit(tahapan)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                              >
                                <Edit2 size={11} /> Input
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedTahapanToEdit(tahapan)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wide rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Edit2 size={11} /> Riwayat
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {selectedTahapanToEdit && progressData && (
        <EditTahapanModal
          key={`${proyek.id}-${selectedTahapanToEdit}`}
          isOpen={!!selectedTahapanToEdit}
          onClose={() => setSelectedTahapanToEdit(null)}
          scope={scope}
          namaTahapan={selectedTahapanToEdit}
          progressData={progressData}
          canUpload={canUpload}
        />
      )}
    </>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const getLatestTahapanLog = (tahapan: TahapanProyekData[], namaTahapan: string) =>
  tahapan
    .filter((t) => t.namaTahapan === namaTahapan)
    .sort((a, b) => {
      const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
    })[0];

const clampPersentase = (value: number) => {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

const persentaseToInput = (value: number) => String(clampPersentase(value));

const parsePersentaseInput = (raw: string): number | null => {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return null;
  return clampPersentase(parseInt(digits, 10));
};

const getEditTahapanFormDefaults = (progressData: ProgressProyekData, namaTahapan: string) => {
  const today = new Date().toISOString().split('T')[0]!;
  const logTerbaru = getLatestTahapanLog(progressData.tahapan, namaTahapan);
  return {
    persentase: clampPersentase(logTerbaru ? Number(logTerbaru.persentase) : 0),
    deskripsi: '',
    tanggal: today,
  };
};

// ── EditTahapanModal ───────────────────────────────────────────────────────────
interface EditTahapanModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: ProgressProyekScope;
  namaTahapan: string;
  progressData: ProgressProyekData;
  canUpload: boolean;
}

const EditTahapanModal: React.FC<EditTahapanModalProps> = ({
  isOpen,
  onClose,
  scope,
  namaTahapan,
  progressData,
  canUpload,
}) => {
  const uploadPhotoMutation = useUploadTahapanPhotos();
  const addLogMutation = useAddTahapanLog();

  const [formData, setFormData] = useState(() =>
    getEditTahapanFormDefaults(progressData, namaTahapan)
  );
  const [persentaseInput, setPersentaseInput] = useState(() =>
    persentaseToInput(getEditTahapanFormDefaults(progressData, namaTahapan).persentase)
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const TahapanIcon = TAHAPAN_ICON_MAP[namaTahapan as (typeof TAHAPAN_LIST)[number]];
  const tahapanColor = TAHAPAN_COLOR_MAP[namaTahapan as (typeof TAHAPAN_LIST)[number]];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((f: File) => f.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(files => files.filter((_, index) => index !== indexToRemove));
  };

  const syncPersentaseFromInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits === '') {
      setPersentaseInput('');
      return;
    }
    const parsed = parsePersentaseInput(digits)!;
    setPersentaseInput(String(parsed));
    setFormData((prev) => ({ ...prev, persentase: parsed }));
  };

  const syncPersentaseFromSlider = (raw: string) => {
    const parsed = clampPersentase(Number(raw));
    setPersentaseInput(String(parsed));
    setFormData((prev) => ({ ...prev, persentase: parsed }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const persentase = parsePersentaseInput(persentaseInput);
    if (persentase === null) {
      alert('Persentase pembangunan wajib diisi (0–100%).');
      return;
    }
    try {
      const updatedProgress = await addLogMutation.mutateAsync({
        scope,
        namaTahapan,
        persentase,
        deskripsi: formData.deskripsi,
        tanggal: formData.tanggal,
        files: selectedFiles,
      });
      alert(`Log progres ${namaTahapan} berhasil ditambahkan!`);
      setSelectedFiles([]);
      const defaults = getEditTahapanFormDefaults(updatedProgress, namaTahapan);
      setFormData(defaults);
      setPersentaseInput(persentaseToInput(defaults.persentase));
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const isSaving = uploadPhotoMutation.isPending || addLogMutation.isPending;
  const assignedMandorName = progressData.mandor?.username;
  const riwayat = progressData.tahapan
    .filter((t) => t.namaTahapan === namaTahapan)
    .sort((a, b) => {
      const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tahapan: ${namaTahapan}`} size="md">
      {/* Tahapan badge header */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold mb-5 ${tahapanColor ?? 'text-slate-600 bg-slate-50 border-slate-200'}`}>
        {TahapanIcon && <TahapanIcon size={14} strokeWidth={1.5} />}
        {namaTahapan}
      </div>

      {!canUpload && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-bold text-amber-900 text-sm">Mode lihat saja</p>
          <p className="text-xs mt-1 text-amber-800 leading-relaxed">
            Hanya mandor yang ditugaskan{assignedMandorName ? ` (${assignedMandorName})` : ''}
            {' '}yang dapat mengunggah laporan progress.
          </p>
        </div>
      )}

      {canUpload && (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Persentase */}
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
                value={formData.persentase}
                onChange={(e) => syncPersentaseFromSlider(e.target.value)}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  placeholder="0"
                  value={persentaseInput}
                  onChange={(e) => syncPersentaseFromInput(e.target.value)}
                  onBlur={() => {
                    if (persentaseInput === '') return;
                    const parsed = parsePersentaseInput(persentaseInput);
                    if (parsed !== null) setPersentaseInput(String(parsed));
                  }}
                  className="w-14 px-2 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-black text-blue-700 text-center outline-none focus:ring-2 focus:ring-blue-400/30"
                />
                <span className="font-bold text-blue-600 text-sm">%</span>
              </div>
            </div>
            {/* Visual progress */}
            <div className="mt-3 bg-blue-100/70 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${formData.persentase}%` }}
              />
            </div>
          </div>

          <Input
            label="Tanggal Laporan"
            type="date"
            name="tanggal"
            value={formData.tanggal}
            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
              Deskripsi
            </label>
            <textarea
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all min-h-[90px] text-slate-900 resize-none"
              placeholder={`Catatan kondisi pengerjaan ${namaTahapan}...`}
            />
          </div>

          {/* Upload foto */}
          <div className="space-y-3 pt-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5 block">
              Galeri Foto Dokumentasi
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all
                ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}
              `}
            >
              <UploadCloud size={24} className={`mb-2 transition-colors ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
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
                    <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-200 group">
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
                <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
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

      {/* Riwayat */}
      <div className={`${canUpload ? 'mt-8' : 'mt-2'} border-t border-slate-200 pt-6`}>
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-4">
          Riwayat — {namaTahapan}
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
                    Belum ada riwayat progres untuk tahapan ini.
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

export default Progress;