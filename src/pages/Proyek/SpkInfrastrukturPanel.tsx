import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  ListChecks,
  Plus,
  FileText,
  X,
  ExternalLink,
  ArrowUpDown,
} from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import CurrencyInput from '../../components/shared/CurrencyInput';
import Select from '../../components/shared/Select';
import FileInput from '../../components/shared/FileInput';
import PageLoader from '../PageLoader';
import { formatRupiah, formatDate, formatTanpaDesimal } from '../../utils/formatters';
import { handleApiError } from '../../utils/errorHandler';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useGetMandors } from '../../hooks/queries/useProgressProyek';
import { useGetBankRekening } from '../../hooks/queries/useBankRekening';
import { useGetZonaList, useCreateZona, useUpdateZona, useDeleteZona } from '../../hooks/queries/useZona';
import {
  useGetPekerjaanInfraList,
  useCreatePekerjaanInfra,
  useUpdatePekerjaanInfra,
  useDeletePekerjaanInfra,
} from '../../hooks/queries/usePekerjaanInfra';
import {
  useCreateSpk,
  useDeleteSpk,
  useGetSpkPaginated,
  useUpdateSpk,
} from '../../hooks/queries/useSpk';
import type { GetSpkParams, SpkData } from '../../services/spk.service';
import type { ZonaData } from '../../services/zona.service';
import type { PekerjaanInfraData } from '../../services/pekerjaanInfra.service';
import SpkPembayaranPanel from '../../components/proyek/SpkPembayaranPanel';
import CollapsibleDetailSection from '../../components/shared/CollapsibleDetailSection';
import {
  groupPekerjaanByKategori,
  isStandardPekerjaanKategori,
  PEKERJAAN_INFRA_KATEGORI_LABEL,
  type PekerjaanInfraKategori,
} from '../../constants/pekerjaanInfra';

interface InfraFormState {
  noSpk: string;
  tanggalSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number | '';
  bankRekeningPtId: number | '';
  progressOverride: number | '';
  notesPekerjaan: string;
  jatuhTempo: string;
  mandorId: number | '';
  zonaId: number | '';
  pekerjaanInfraIds: number[];
  fileSpk: File | null;
  existingFileSpk: string | null;
}

const todayIso = () => new Date().toISOString().split('T')[0]!;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileNameFromUrl = (url: string) => {
  try {
    const segment = url.split('/').pop() ?? url;
    return decodeURIComponent(segment.split('?')[0] ?? segment);
  } catch {
    return 'Dokumen_SPK.pdf';
  }
};

interface GroupedInfraSpkByMandor {
  id: number;
  mandorId: number;
  mandorUsername: string;
  jumlahSpk: number;
  totalPekerjaan: number;
  totalNilaiKontrak: number;
  spkSelesai: number;
  records: SpkData[];
}

const initialFormState = (): InfraFormState => ({
  noSpk: '',
  tanggalSpk: todayIso(),
  judulPekerjaan: '',
  nilaiKontrak: '',
  bankRekeningPtId: '',
  progressOverride: '',
  notesPekerjaan: '',
  jatuhTempo: '',
  mandorId: '',
  zonaId: '',
  pekerjaanInfraIds: [],
  fileSpk: null,
  existingFileSpk: null,
});

const formatShortNoSpk = (noSpk: string): string => {
  const trimmed = noSpk.trim();
  if (!trimmed) return '';
  if (trimmed.includes('/')) {
    const head = trimmed.split('/')[0] ?? '';
    const d = head.replace(/\D/g, '');
    return d ? d.padStart(3, '0') : head;
  }
  const digitGroups = trimmed.match(/\d+/g);
  if (digitGroups?.length) {
    const seq = digitGroups.find((g) => g.length >= 2 && g.length <= 3) ?? digitGroups[0];
    return seq.replace(/\D/g, '').padStart(3, '0');
  }
  return trimmed.slice(0, 3);
};

const formatKsoShortLabel = (atasNama: string): string => {
  const n = atasNama.trim().toLowerCase();
  if (n.includes('mahligai')) return 'BMS';
  if (n.includes('gajah')) return 'SGMP';
  return atasNama;
};

const initialZonaForm = () => ({
  nama: '',
  hgb: '',
  luas: '',
  deskripsi: '',
});

const SpkInfrastrukturPanel = () => {
  const { user, selectedPerumahan } = useAuth();
  const { canRead: canReadSpk } = usePermission('SPK');
  const canManageSpk = user?.role !== 'MANDOR';
  const isAdminRole = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const orderBy = (searchParams.get('orderBy') || 'mandor:asc') as GetSpkParams['orderBy'];
  const limit = 25;

  const { data: spkResponse, isLoading } = useGetSpkPaginated({
    page,
    limit,
    search: search || undefined,
    orderBy,
    jenis: 'INFRASTRUKTUR',
  }, { enabled: !isAdminRole });

  const { data: adminSpkResponse, isLoading: loadingAdminSpk } = useGetSpkPaginated({
    page: 1,
    limit: 500,
    search: search || undefined,
    orderBy,
    jenis: 'INFRASTRUKTUR',
  }, { enabled: isAdminRole });

  const { data: zonaList = [], isLoading: loadingZona } = useGetZonaList();
  const { data: pekerjaanList = [], isLoading: loadingPekerjaan } = useGetPekerjaanInfraList();
  const { data: mandorList = [] } = useGetMandors();
  const { data: bankList = [] } = useGetBankRekening();

  const createMutation = useCreateSpk();
  const updateMutation = useUpdateSpk();
  const deleteMutation = useDeleteSpk();
  const createZonaMutation = useCreateZona();
  const updateZonaMutation = useUpdateZona();
  const deleteZonaMutation = useDeleteZona();
  const createPekerjaanMutation = useCreatePekerjaanInfra();
  const updatePekerjaanMutation = useUpdatePekerjaanInfra();
  const deletePekerjaanMutation = useDeletePekerjaanInfra();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isZonaModalOpen, setIsZonaModalOpen] = useState(false);
  const [isPekerjaanModalOpen, setIsPekerjaanModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SpkData | null>(null);
  const [formData, setFormData] = useState<InfraFormState>(initialFormState);
  const [zonaForm, setZonaForm] = useState(initialZonaForm);
  const [editingZonaId, setEditingZonaId] = useState<number | null>(null);
  const [newPekerjaanNama, setNewPekerjaanNama] = useState('');
  const [newPekerjaanKategori, setNewPekerjaanKategori] =
    useState<PekerjaanInfraKategori>('LAINNYA');
  const [editingPekerjaan, setEditingPekerjaan] = useState<PekerjaanInfraData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [zonaErrors, setZonaErrors] = useState<Partial<Record<string, string>>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pekerjaanSearch, setPekerjaanSearch] = useState('');
  const [kasbonQuickSpk, setKasbonQuickSpk] = useState<SpkData | null>(null);
  const [historiKasbonSpk, setHistoriKasbonSpk] = useState<SpkData | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const spkData = spkResponse?.items ?? [];
  const adminSpkList = adminSpkResponse?.items ?? [];
  const displaySpkData = isAdminRole ? adminSpkList : spkData;
  const meta = isAdminRole ? adminSpkResponse?.meta : spkResponse?.meta;

  const bankOptions = useMemo(() => {
    return selectedPerumahan
      ? bankList.filter((b) => b.perumahanId === Number(selectedPerumahan.id))
      : bankList;
  }, [bankList, selectedPerumahan]);

  const bankShortLabelById = useMemo(() => {
    const map = new Map<number, string>();
    bankList.forEach((b) => map.set(b.id, formatKsoShortLabel(b.atasNama)));
    return map;
  }, [bankList]);

  const filteredPekerjaanList = useMemo(() => {
    const q = pekerjaanSearch.trim().toLowerCase();
    if (!q) return pekerjaanList;
    return pekerjaanList.filter((p) => p.nama.toLowerCase().includes(q));
  }, [pekerjaanList, pekerjaanSearch]);

  const groupedPekerjaanList = useMemo(
    () => groupPekerjaanByKategori(filteredPekerjaanList),
    [filteredPekerjaanList],
  );

  const standardPekerjaanIds = useMemo(
    () =>
      pekerjaanList
        .filter((p) => isStandardPekerjaanKategori(p.kategori))
        .map((p) => p.id),
    [pekerjaanList],
  );

  const usedZonaIds = useMemo(() => {
    const ids = new Set<number>();
    displaySpkData.forEach((s) => {
      if (s.zonaId && s.id !== editingId) ids.add(s.zonaId);
    });
    return ids;
  }, [displaySpkData, editingId]);

  const zonaOptions = useMemo(
    () =>
      zonaList
        .filter((z) => !usedZonaIds.has(z.id) || z.id === formData.zonaId)
        .map((z) => ({ value: String(z.id), label: z.nama })),
    [zonaList, usedZonaIds, formData.zonaId],
  );

  useEffect(() => {
    if (!formData.fileSpk) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formData.fileSpk);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.fileSpk]);

  const handleOrderByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      prev.set('orderBy', e.target.value);
      prev.set('page', '1');
      return prev;
    });
  };

  const clearUploadedFile = () => {
    setFormData((prev) => ({ ...prev, fileSpk: null, existingFileSpk: null }));
  };

  const hasUploadedFile = !!formData.fileSpk || !!formData.existingFileSpk;

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
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

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      ...initialFormState(),
      pekerjaanInfraIds: standardPekerjaanIds,
    });
    setErrors({});
    setPekerjaanSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: SpkData) => {
    setEditingId(item.id);
    setFormData({
      noSpk: item.noSpk,
      tanggalSpk: item.tanggalSpk.split('T')[0]!,
      judulPekerjaan: item.judulPekerjaan,
      nilaiKontrak: item.nilaiKontrak,
      bankRekeningPtId: item.bankRekeningPtId ?? '',
      progressOverride: item.progressOverride ?? '',
      notesPekerjaan: item.notesPekerjaan || '',
      jatuhTempo: item.jatuhTempo ? item.jatuhTempo.split('T')[0]! : '',
      mandorId: item.mandorId,
      zonaId: item.zonaId ?? '',
      pekerjaanInfraIds: item.pekerjaanInfraItems.map((p) => p.pekerjaanInfraId),
      fileSpk: null,
      existingFileSpk: item.fileSpk,
    });
    setErrors({});
    setPekerjaanSearch('');
    setIsModalOpen(true);
  };

  const openDetail = (item: SpkData) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState());
    setEditingId(null);
  };

  const togglePekerjaan = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      pekerjaanInfraIds: prev.pekerjaanInfraIds.includes(id)
        ? prev.pekerjaanInfraIds.filter((x) => x !== id)
        : [...prev.pekerjaanInfraIds, id],
    }));
    if (errors.pekerjaanInfraIds) {
      setErrors((prev) => ({ ...prev, pekerjaanInfraIds: undefined }));
    }
  };

  const toggleGroupPekerjaan = (ids: number[], checked: boolean) => {
    setFormData((prev) => {
      const set = new Set(prev.pekerjaanInfraIds);
      for (const id of ids) {
        if (checked) set.add(id);
        else set.delete(id);
      }
      return { ...prev, pekerjaanInfraIds: [...set] };
    });
    if (errors.pekerjaanInfraIds) {
      setErrors((prev) => ({ ...prev, pekerjaanInfraIds: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!formData.noSpk.trim()) newErrors.noSpk = 'Nomor SPK wajib diisi';
    if (!formData.judulPekerjaan.trim()) newErrors.judulPekerjaan = 'Judul pekerjaan wajib diisi';
    if (formData.nilaiKontrak === '' || Number(formData.nilaiKontrak) <= 0) {
      newErrors.nilaiKontrak = 'Nilai kontrak harus lebih dari 0';
    }
    if (!formData.mandorId) newErrors.mandorId = 'Mandor wajib dipilih';
    if (!formData.zonaId) newErrors.zonaId = 'Zona wajib dipilih';
    else if (usedZonaIds.has(Number(formData.zonaId))) {
      newErrors.zonaId = 'Zona ini sudah dipakai SPK infrastruktur lain';
    }
    if (formData.pekerjaanInfraIds.length === 0) {
      newErrors.pekerjaanInfraIds = 'Pilih minimal satu pekerjaan';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      jenis: 'INFRASTRUKTUR' as const,
      noSpk: formData.noSpk.trim(),
      tanggalSpk: formData.tanggalSpk,
      judulPekerjaan: formData.judulPekerjaan.trim(),
      nilaiKontrak: Number(formData.nilaiKontrak),
      bankRekeningPtId:
        formData.bankRekeningPtId === '' ? undefined : Number(formData.bankRekeningPtId),
      progressOverride:
        formData.progressOverride === '' ? undefined : Number(formData.progressOverride),
      notesPekerjaan: formData.notesPekerjaan.trim() || undefined,
      jatuhTempo: formData.jatuhTempo || undefined,
      mandorId: Number(formData.mandorId),
      zonaId: Number(formData.zonaId),
      pekerjaanInfraIds: formData.pekerjaanInfraIds,
      fileSpk: formData.fileSpk,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleDelete = async (item: SpkData) => {
    if (!window.confirm(`Hapus SPK infrastruktur ${item.noSpk}?`)) return;
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const openZonaModal = () => {
    setEditingZonaId(null);
    setZonaForm(initialZonaForm());
    setZonaErrors({});
    setIsZonaModalOpen(true);
  };

  const openEditZona = (zona: ZonaData) => {
    setEditingZonaId(zona.id);
    setZonaForm({
      nama: zona.nama,
      hgb: zona.hgb,
      luas: zona.luas,
      deskripsi: zona.deskripsi,
    });
    setZonaErrors({});
    setIsZonaModalOpen(true);
  };

  const validateZonaForm = () => {
    const next: Partial<Record<string, string>> = {};
    if (!zonaForm.nama.trim()) next.nama = 'Nama zona wajib diisi';
    if (!zonaForm.hgb.trim()) next.hgb = 'HGB wajib diisi';
    if (!zonaForm.luas.trim()) next.luas = 'Luas wajib diisi';
    if (!zonaForm.deskripsi.trim()) next.deskripsi = 'Deskripsi wajib diisi';
    setZonaErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveZona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateZonaForm()) return;
    const payload = {
      nama: zonaForm.nama.trim(),
      hgb: zonaForm.hgb.trim(),
      luas: zonaForm.luas.trim(),
      deskripsi: zonaForm.deskripsi.trim(),
    };
    try {
      if (editingZonaId) {
        await updateZonaMutation.mutateAsync({ id: editingZonaId, data: payload });
      } else {
        const created = await createZonaMutation.mutateAsync(payload);
        if (isModalOpen) {
          setFormData((p) => ({ ...p, zonaId: created.id }));
        }
      }
      setEditingZonaId(null);
      setZonaForm(initialZonaForm());
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleDeleteZona = async (zona: ZonaData) => {
    if (!window.confirm(`Hapus zona "${zona.nama}"?`)) return;
    try {
      await deleteZonaMutation.mutateAsync(zona.id);
      if (formData.zonaId === zona.id) {
        setFormData((p) => ({ ...p, zonaId: '' }));
      }
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleAddPekerjaan = async () => {
    const nama = newPekerjaanNama.trim();
    if (!nama) return;
    try {
      const created = await createPekerjaanMutation.mutateAsync({
        nama,
        kategori: newPekerjaanKategori,
      });
      setNewPekerjaanNama('');
      if (isModalOpen) {
        setFormData((p) => ({
          ...p,
          pekerjaanInfraIds: [...p.pekerjaanInfraIds, created.id],
        }));
      }
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleSavePekerjaanEdit = async () => {
    if (!editingPekerjaan) return;
    const nama = editingPekerjaan.nama.trim();
    if (!nama) return;
    try {
      await updatePekerjaanMutation.mutateAsync({
        id: editingPekerjaan.id,
        data: { nama },
      });
      setEditingPekerjaan(null);
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleDeletePekerjaan = async (item: PekerjaanInfraData) => {
    if (!window.confirm(`Hapus pekerjaan "${item.nama}"?`)) return;
    try {
      await deletePekerjaanMutation.mutateAsync(item.id);
      setFormData((p) => ({
        ...p,
        pekerjaanInfraIds: p.pekerjaanInfraIds.filter((id) => id !== item.id),
      }));
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const canAjukanPembayaranFor = (spk: SpkData) => {
    if (!user) return false;
    if (user.role === 'MANDOR') return spk.mandorId === user.id;
    return canReadSpk;
  };

  useEffect(() => {
    if (!detailItem) return;
    const fresh = displaySpkData.find((s) => s.id === detailItem.id);
    if (fresh) setDetailItem(fresh);
  }, [displaySpkData, detailItem?.id]);

  const columns = [
    {
      header: 'No',
      accessor: 'noSpk',
      render: (val: string) => (
        <span className="font-bold text-slate-900 font-mono text-xs" title={val}>
          {formatShortNoSpk(val)}
        </span>
      ),
    },
    {
      header: 'Mandor',
      accessor: 'mandor',
      render: (_: unknown, row: SpkData) => (
        <span className="text-xs font-semibold text-slate-700">{row.mandor.username}</span>
      ),
    },
    {
      header: 'Zona',
      accessor: 'zona',
      render: (_: unknown, row: SpkData) => (
        <div className="max-w-[180px]">
          <p className="text-xs font-bold text-slate-800 truncate">{row.zona?.nama ?? '-'}</p>
          <p className="text-[10px] text-slate-500 truncate">{row.zona?.hgb ?? ''}</p>
        </div>
      ),
    },
    {
      header: 'KSO',
      accessor: 'bankRekeningPtId',
      render: (val: number | null) => (
        <span className="text-xs font-bold text-slate-600">
          {val ? (bankShortLabelById.get(val) ?? '-') : '-'}
        </span>
      ),
    },
    {
      header: 'Pekerjaan',
      accessor: 'pekerjaanInfraItems',
      render: (_: unknown, row: SpkData) => (
        <span className="text-xs text-slate-600">{row.pekerjaanInfraItems.length} item</span>
      ),
    },
    {
      header: 'Nilai Kontrak',
      accessor: 'nilaiKontrak',
      render: (val: number, row: SpkData) => {
        const canAjukanKasbon = canAjukanPembayaranFor(row);
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-800 tabular-nums whitespace-nowrap">
              {formatTanpaDesimal(val)}
            </span>
            {canAjukanKasbon && (
              <button
                type="button"
                title="Ajukan kasbon"
                onClick={(e) => {
                  e.stopPropagation();
                  setKasbonQuickSpk(row);
                }}
                className="inline-flex items-center justify-center w-6 h-6 rounded-lg border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors shrink-0"
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        );
      },
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (_: unknown, row: SpkData) => {
        const persentase = Number(row.progress ?? 0);
        const isComplete = persentase === 100;
        return (
          <div className="flex items-center gap-1.5 w-[5.5rem]">
            <div className="flex-1 min-w-0 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${persentase}%` }}
              />
            </div>
            <span className={`text-[10px] font-black shrink-0 ${isComplete ? 'text-emerald-700' : 'text-slate-700'}`}>
              {persentase}%{row.progressIsOverride ? '*' : ''}
            </span>
          </div>
        );
      },
    },
  ];

  const spkDetailColumns = columns;

  const groupedSpkByMandor = useMemo((): GroupedInfraSpkByMandor[] => {
    const groups = new Map<number, GroupedInfraSpkByMandor>();

    adminSpkList.forEach((spk) => {
      if (!groups.has(spk.mandorId)) {
        groups.set(spk.mandorId, {
          id: spk.mandorId,
          mandorId: spk.mandorId,
          mandorUsername: spk.mandor?.username ?? `Mandor #${spk.mandorId}`,
          jumlahSpk: 0,
          totalPekerjaan: 0,
          totalNilaiKontrak: 0,
          spkSelesai: 0,
          records: [],
        });
      }
      const group = groups.get(spk.mandorId)!;
      group.records.push(spk);
      group.jumlahSpk += 1;
      group.totalPekerjaan += spk.pekerjaanInfraItems.length;
      group.totalNilaiKontrak += Number(spk.nilaiKontrak ?? 0);
      if (Number(spk.progress ?? 0) === 100) group.spkSelesai += 1;
    });

    let result = Array.from(groups.values());
    if (orderBy === 'mandor:desc') {
      result = result.sort((a, b) => b.mandorUsername.localeCompare(a.mandorUsername, 'id'));
    } else if (orderBy === 'mandor:asc') {
      result = result.sort((a, b) => a.mandorUsername.localeCompare(b.mandorUsername, 'id'));
    } else {
      result = result.sort((a, b) => {
        const latestA = Math.max(...a.records.map((r) => r.id));
        const latestB = Math.max(...b.records.map((r) => r.id));
        return latestB - latestA;
      });
    }
    return result;
  }, [adminSpkList, orderBy]);

  const mandorGroupColumns = [
    {
      header: 'Mandor',
      accessor: 'mandorUsername',
      render: (val: string) => (
        <span className="font-bold text-slate-900 text-sm">{val}</span>
      ),
    },
    {
      header: 'SPK',
      accessor: 'jumlahSpk',
      className: 'text-center',
      render: (val: number, row: GroupedInfraSpkByMandor) => (
        <div className="text-center">
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold tabular-nums">
            {val}x
          </span>
          <p className="text-[10px] text-slate-500 mt-1">{row.spkSelesai} selesai</p>
        </div>
      ),
    },
    {
      header: 'Pekerjaan',
      accessor: 'totalPekerjaan',
      className: 'text-center',
      render: (val: number) => (
        <span className="text-xs font-bold text-slate-800 tabular-nums">{val}</span>
      ),
    },
    {
      header: 'Nilai Kontrak',
      accessor: 'totalNilaiKontrak',
      render: (val: number) => (
        <span className="text-xs font-bold text-slate-800 tabular-nums">{formatRupiah(val)}</span>
      ),
    },
  ];

  const expandedMandorRowRender = (row: GroupedInfraSpkByMandor) => (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
        Daftar SPK Infra: <span className="text-blue-600">{row.mandorUsername}</span>
      </h4>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              {spkDetailColumns.map((col) => (
                <th key={col.accessor} className="px-3 py-2.5 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center whitespace-nowrap w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {row.records.map((spk) => (
              <tr
                key={spk.id}
                onClick={() => setHistoriKasbonSpk(spk)}
                className="bg-white hover:bg-slate-50/80 cursor-pointer transition-colors"
              >
                {spkDetailColumns.map((col) => (
                  <td key={col.accessor} className="px-3 py-2.5 text-slate-700 font-medium align-top whitespace-nowrap">
                    {(col.render as ((value: unknown, row: SpkData) => React.ReactNode) | undefined)
                      ? (col.render as (value: unknown, row: SpkData) => React.ReactNode)(
                          spk[col.accessor as keyof SpkData],
                          spk,
                        )
                      : String(spk[col.accessor as keyof SpkData] ?? '')}
                  </td>
                ))}
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-2">
                    <button type="button" onClick={() => openDetail(spk)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Detail">
                      <Eye size={16} />
                    </button>
                    {canManageSpk && (
                      <>
                        <button type="button" onClick={() => openEditModal(spk)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(spk)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const tableToolbar = (
    <div className="relative w-full sm:w-56">
      <ArrowUpDown size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <select
        value={orderBy}
        onChange={handleOrderByChange}
        className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none shadow-sm cursor-pointer"
        aria-label="Urutkan berdasarkan mandor"
      >
        <option value="mandor:asc">Mandor A → Z</option>
        <option value="mandor:desc">Mandor Z → A</option>
        <option value="id:desc">Terbaru</option>
      </select>
    </div>
  );

  if ((isAdminRole ? loadingAdminSpk : isLoading) && displaySpkData.length === 0) {
    return <PageLoader />;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const masterToolbar = canManageSpk ? (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={openZonaModal}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
      >
        <MapPin size={14} />
        Kelola Zona ({zonaList.length})
      </button>
      <button
        type="button"
        onClick={() => {
          setNewPekerjaanNama('');
          setEditingPekerjaan(null);
          setIsPekerjaanModalOpen(true);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
      >
        <ListChecks size={14} />
        Kelola Pekerjaan ({pekerjaanList.length})
      </button>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Input manual: tambah zona & pekerjaan dulu, lalu buat SPK infrastruktur.
        </p>
        {masterToolbar}
      </div>

      {isAdminRole ? (
        <DataTable
          title="SPK Infrastruktur"
          columns={mandorGroupColumns}
          data={groupedSpkByMandor}
          expandedRowRender={expandedMandorRowRender}
          serverSide
          searchTerm={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Cari mandor, no SPK, zona, pekerjaan..."
          toolbarPrefix={tableToolbar}
          onAdd={canManageSpk ? openCreateModal : undefined}
          dense
        />
      ) : (
        <DataTable
          title="Daftar SPK Infrastruktur"
          data={spkData}
          columns={columns}
          serverSide
          searchTerm={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Cari no SPK, mandor, zona, pekerjaan..."
          toolbarPrefix={tableToolbar}
          page={page}
          totalPages={meta?.totalPages ?? 1}
          onPageChange={handlePageChange}
          onAdd={canManageSpk ? openCreateModal : undefined}
          onDetail={openDetail}
          onEdit={canManageSpk ? openEditModal : undefined}
          onDelete={canManageSpk ? handleDelete : undefined}
          onRowClick={setHistoriKasbonSpk}
          dense
        />
      )}

      {kasbonQuickSpk && (
        <SpkPembayaranPanel
          kasbonOnly
          spk={kasbonQuickSpk}
          canAjukan={canAjukanPembayaranFor(kasbonQuickSpk)}
          onKasbonModalClose={() => setKasbonQuickSpk(null)}
        />
      )}

      <Modal
        isOpen={!!historiKasbonSpk}
        onClose={() => setHistoriKasbonSpk(null)}
        title={
          historiKasbonSpk
            ? `Histori Pengajuan Kasbon — ${historiKasbonSpk.noSpk}`
            : 'Histori Pengajuan Kasbon'
        }
        size="lg"
      >
        {historiKasbonSpk && (
          <div className="max-h-[min(74vh,660px)] overflow-y-auto pr-1 -mr-1">
            <SpkPembayaranPanel
              spk={historiKasbonSpk}
              canAjukan={canAjukanPembayaranFor(historiKasbonSpk)}
              historiOnly
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={detailItem ? `Detail SPK ${detailItem.noSpk}` : 'Detail SPK'}
        size="lg"
      >
        {detailItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-slate-500">Mandor</p>
                <p className="font-bold text-slate-800">{detailItem.mandor.username}</p>
              </div>
              <div>
                <p className="text-slate-500">Nilai Kontrak</p>
                <p className="font-bold text-slate-800">{formatRupiah(detailItem.nilaiKontrak)}</p>
              </div>
              <div>
                <p className="text-slate-500">Progress</p>
                <p className="font-bold text-blue-700">{detailItem.progress}%</p>
              </div>
              <div>
                <p className="text-slate-500">Tanggal SPK</p>
                <p className="font-bold text-slate-800">{formatDate(detailItem.tanggalSpk)}</p>
              </div>
            </div>

            {detailItem.zona && (
              <CollapsibleDetailSection title="Zona" defaultOpen>
                <div className="space-y-1 text-xs text-slate-700">
                  <p><span className="font-semibold">Nama:</span> {detailItem.zona.nama}</p>
                  <p><span className="font-semibold">HGB:</span> {detailItem.zona.hgb}</p>
                  <p><span className="font-semibold">Luas:</span> {detailItem.zona.luas}</p>
                  <p><span className="font-semibold">Deskripsi:</span> {detailItem.zona.deskripsi}</p>
                </div>
              </CollapsibleDetailSection>
            )}

            <CollapsibleDetailSection title={`Pekerjaan (${detailItem.pekerjaanInfraItems.length})`} defaultOpen>
              <div className="space-y-4">
                {groupPekerjaanByKategori(detailItem.pekerjaanInfraItems).map((group) => (
                  <div key={group.kategori}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {group.label}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700">
                      {group.items.map((p) => (
                        <li key={p.id}>{p.nama}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </CollapsibleDetailSection>

            <CollapsibleDetailSection title="Dokumen SPK" defaultOpen>
              {detailItem.fileSpk ? (
                <a
                  href={detailItem.fileSpk}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                >
                  <FileText size={14} />
                  Buka PDF
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Belum ada dokumen</span>
              )}
            </CollapsibleDetailSection>

            <SpkPembayaranPanel
              spk={detailItem}
              canAjukan={canAjukanPembayaranFor(detailItem)}
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit SPK Infrastruktur' : 'Buat SPK Infrastruktur'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nomor SPK"
              name="noSpk"
              value={formData.noSpk}
              onChange={(e) => setFormData((p) => ({ ...p, noSpk: e.target.value }))}
              error={errors.noSpk}
              required
            />
            <Input
              label="Tanggal SPK"
              name="tanggalSpk"
              type="date"
              value={formData.tanggalSpk}
              onChange={(e) => setFormData((p) => ({ ...p, tanggalSpk: e.target.value }))}
              required
            />
            <Input
              label="Judul Pekerjaan"
              name="judulPekerjaan"
              value={formData.judulPekerjaan}
              onChange={(e) => setFormData((p) => ({ ...p, judulPekerjaan: e.target.value }))}
              error={errors.judulPekerjaan}
              className="md:col-span-2"
              required
            />
            <CurrencyInput
              label="Nilai Kontrak"
              name="nilaiKontrak"
              value={formData.nilaiKontrak}
              onValueChange={(_name, val) =>
                setFormData((p) => ({ ...p, nilaiKontrak: val }))
              }
              error={errors.nilaiKontrak}
            />
            <Select
              label="KSO (Rekening PT)"
              name="bankRekeningPtId"
              value={String(formData.bankRekeningPtId)}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  bankRekeningPtId: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              options={[
                { value: '', label: 'Pilih rekening PT' },
                ...bankOptions.map((b) => ({
                  value: String(b.id),
                  label: `${formatKsoShortLabel(b.atasNama)} · ${b.noRekening}`,
                })),
              ]}
            />
            <Select
              label="Mandor"
              name="mandorId"
              value={String(formData.mandorId)}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  mandorId: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              error={errors.mandorId}
              options={[
                { value: '', label: 'Pilih mandor' },
                ...mandorList.map((m) => ({ value: String(m.id), label: m.username })),
              ]}
              required
            />
            <div className="md:col-span-2 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <Select
                  label="Zona"
                  name="zonaId"
                  value={String(formData.zonaId)}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      zonaId: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  error={errors.zonaId}
                  options={[
                    { value: '', label: zonaOptions.length === 0 ? 'Belum ada zona tersedia — kelola zona dulu' : 'Pilih zona' },
                    ...zonaOptions.map((z) => {
                      const full = zonaList.find((item) => item.id === Number(z.value));
                      return {
                        value: z.value,
                        label: full ? `${full.nama} · ${full.luas}` : z.label,
                      };
                    }),
                  ]}
                  required
                  className="mb-0"
                />
              </div>
              {canManageSpk && (
                <button
                  type="button"
                  onClick={openZonaModal}
                  className="shrink-0 px-4 py-2.5 text-xs font-bold text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  + Tambah Zona
                </button>
              )}
            </div>
            {canManageSpk && editingId && (
              <Input
                label="Progress Override (%)"
                name="progressOverride"
                type="number"
                min={0}
                max={100}
                value={String(formData.progressOverride)}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    progressOverride: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
              />
            )}
            <Input
              label="Jatuh Tempo"
              name="jatuhTempo"
              type="date"
              value={formData.jatuhTempo}
              onChange={(e) => setFormData((p) => ({ ...p, jatuhTempo: e.target.value }))}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Daftar Pekerjaan
              </p>
              <span className="text-xs text-slate-500">
                {formData.pekerjaanInfraIds.length} dipilih
              </span>
            </div>
            {errors.pekerjaanInfraIds && (
              <p className="text-xs text-red-600">{errors.pekerjaanInfraIds}</p>
            )}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pekerjaanSearch}
                onChange={(e) => setPekerjaanSearch(e.target.value)}
                placeholder="Cari pekerjaan..."
                className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-4">
              {groupedPekerjaanList.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Belum ada pekerjaan. Klik &quot;Kelola Pekerjaan&quot; untuk menambah item.
                </p>
              ) : (
                groupedPekerjaanList.map((group) => {
                  const groupIds = group.items.map((p) => p.id);
                  const selectedInGroup = groupIds.filter((id) =>
                    formData.pekerjaanInfraIds.includes(id),
                  ).length;
                  const allSelected =
                    groupIds.length > 0 && selectedInGroup === groupIds.length;

                  return (
                    <div key={group.kategori} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          {group.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleGroupPekerjaan(groupIds, !allSelected)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                        >
                          {allSelected ? 'Batal semua' : 'Pilih semua'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {group.items.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.pekerjaanInfraIds.includes(p.id)}
                              onChange={() => togglePekerjaan(p.id)}
                              className="mt-0.5"
                            />
                            <span className="text-xs text-slate-700">{p.nama}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {canManageSpk && (
              <div className="flex flex-col sm:flex-row gap-2 pt-1 items-center">
                <Select
                  label=""
                  name="newPekerjaanKategori"
                  value={newPekerjaanKategori}
                  onChange={(e) =>
                    setNewPekerjaanKategori(e.target.value as PekerjaanInfraKategori)
                  }
                  className="mb-0 sm:w-40"
                  options={[
                    { value: 'LAINNYA', label: PEKERJAAN_INFRA_KATEGORI_LABEL.LAINNYA },
                    { value: 'SALURAN', label: PEKERJAAN_INFRA_KATEGORI_LABEL.SALURAN },
                    { value: 'JALAN', label: PEKERJAAN_INFRA_KATEGORI_LABEL.JALAN },
                  ]}
                />
                <input
                  type="text"
                  value={newPekerjaanNama}
                  onChange={(e) => setNewPekerjaanNama(e.target.value)}
                  placeholder="Tambah pekerjaan baru..."
                  className="flex-1 px-3 py-2.5 text-xs text-slate-900 border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={handleAddPekerjaan}
                  disabled={!newPekerjaanNama.trim() || createPekerjaanMutation.isPending}
                  className="px-3 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-lg disabled:opacity-50 self-end"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          <Input
            label="Catatan Pekerjaan"
            name="notesPekerjaan"
            value={formData.notesPekerjaan}
            onChange={(e) => setFormData((p) => ({ ...p, notesPekerjaan: e.target.value }))}
          />

          <FileInput
            label="Upload SPK (PDF, opsional)"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setFormData((p) => ({
                ...p,
                fileSpk: file,
                existingFileSpk: file ? null : p.existingFileSpk,
              }));
              e.target.value = '';
            }}
          />
          {hasUploadedFile && (
            <div className="mt-1 flex items-start gap-3 p-3.5 bg-white border border-red-100 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <FileText size={20} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {formData.fileSpk?.name ?? getFileNameFromUrl(formData.existingFileSpk!)}
                </p>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-0.5">
                  PDF
                  {formData.fileSpk && (
                    <span className="text-slate-400 normal-case tracking-normal font-medium ml-2">
                      {formatFileSize(formData.fileSpk.size)}
                    </span>
                  )}
                </p>
                {formData.existingFileSpk && !formData.fileSpk && (
                  <a
                    href={formData.existingFileSpk}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1 hover:underline"
                  >
                    <ExternalLink size={11} />
                    Pratinjau dokumen tersimpan
                  </a>
                )}
                {filePreviewUrl && formData.fileSpk && (
                  <a
                    href={filePreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1 hover:underline"
                  >
                    <ExternalLink size={11} />
                    Pratinjau file baru
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={clearUploadedFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                title="Hapus file"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat SPK'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isZonaModalOpen}
        onClose={() => setIsZonaModalOpen(false)}
        title="Kelola Zona"
        size="lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleSaveZona} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label="Nama Zona"
              value={zonaForm.nama}
              onChange={(e) => setZonaForm((p) => ({ ...p, nama: e.target.value }))}
              error={zonaErrors.nama}
              required
            />
            <Input
              label="HGB"
              value={zonaForm.hgb}
              onChange={(e) => setZonaForm((p) => ({ ...p, hgb: e.target.value }))}
              error={zonaErrors.hgb}
              placeholder="HGB 271 (26 JULI 2028)"
              required
            />
            <Input
              label="Luas"
              value={zonaForm.luas}
              onChange={(e) => setZonaForm((p) => ({ ...p, luas: e.target.value }))}
              error={zonaErrors.luas}
              placeholder="13.880 M2"
              required
            />
            <Input
              label="Deskripsi"
              value={zonaForm.deskripsi}
              onChange={(e) => setZonaForm((p) => ({ ...p, deskripsi: e.target.value }))}
              error={zonaErrors.deskripsi}
              className="md:col-span-2"
              required
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              {editingZonaId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingZonaId(null);
                    setZonaForm(initialZonaForm());
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                disabled={createZonaMutation.isPending || updateZonaMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg disabled:opacity-50"
              >
                {editingZonaId ? 'Simpan Perubahan' : 'Tambah Zona'}
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loadingZona ? (
              <p className="text-xs text-slate-500">Memuat zona...</p>
            ) : zonaList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada zona.</p>
            ) : (
              zonaList.map((z) => (
                <div
                  key={z.id}
                  className="flex items-start justify-between gap-3 p-3 border border-slate-200 rounded-xl"
                >
                  <div className="min-w-0 text-xs">
                    <p className="font-bold text-slate-800">{z.nama}</p>
                    <p className="text-slate-600">{z.hgb}</p>
                    <p className="text-slate-500">Luas {z.luas}</p>
                    <p className="text-slate-500 mt-1">{z.deskripsi}</p>
                  </div>
                  {canManageSpk && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditZona(z)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteZona(z)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPekerjaanModalOpen}
        onClose={() => setIsPekerjaanModalOpen(false)}
        title="Kelola Pekerjaan Infrastruktur"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              name="modalPekerjaanKategori"
              value={newPekerjaanKategori}
              onChange={(e) =>
                setNewPekerjaanKategori(e.target.value as PekerjaanInfraKategori)
              }
              className="mb-0 sm:w-44"
              options={[
                { value: 'LAINNYA', label: PEKERJAAN_INFRA_KATEGORI_LABEL.LAINNYA },
                { value: 'SALURAN', label: PEKERJAAN_INFRA_KATEGORI_LABEL.SALURAN },
                { value: 'JALAN', label: PEKERJAAN_INFRA_KATEGORI_LABEL.JALAN },
              ]}
            />
            <input
              type="text"
              value={newPekerjaanNama}
              onChange={(e) => setNewPekerjaanNama(e.target.value)}
              placeholder="Nama pekerjaan baru..."
              className="flex-1 px-3 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <button
              type="button"
              onClick={handleAddPekerjaan}
              disabled={!newPekerjaanNama.trim() || createPekerjaanMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg disabled:opacity-50 self-end"
            >
              Tambah
            </button>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {loadingPekerjaan ? (
              <p className="text-xs text-slate-500">Memuat pekerjaan...</p>
            ) : pekerjaanList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada pekerjaan.</p>
            ) : (
              groupPekerjaanByKategori(pekerjaanList).map((group) => (
                <div key={group.kategori} className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                    {group.label} ({group.items.length})
                  </p>
                  {group.items.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-xl"
                >
                  {editingPekerjaan?.id === p.id ? (
                    <input
                      type="text"
                      value={editingPekerjaan.nama}
                      onChange={(e) =>
                        setEditingPekerjaan({ ...editingPekerjaan, nama: e.target.value })
                      }
                      className="flex-1 px-2 py-1 text-xs text-slate-900 border border-slate-200 rounded-lg bg-white"
                    />
                  ) : (
                    <span className="text-xs text-slate-700 flex-1">{p.nama}</span>
                  )}
                  {canManageSpk && (
                    <div className="flex gap-1 shrink-0">
                      {editingPekerjaan?.id === p.id ? (
                        <button
                          type="button"
                          onClick={handleSavePekerjaanEdit}
                          className="px-2 py-1 text-[10px] font-bold text-white bg-blue-600 rounded"
                        >
                          Simpan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingPekerjaan(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePekerjaan(p)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SpkInfrastrukturPanel;
