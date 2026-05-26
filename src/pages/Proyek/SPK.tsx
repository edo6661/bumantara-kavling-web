import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, X, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import CurrencyInput from "../../components/shared/CurrencyInput";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { handleApiError } from '../../utils/errorHandler';
import { useAuth } from "../../context/AuthContext";
import { useGetKavlings } from "../../hooks/queries/useKavling";
import { useGetMandors } from "../../hooks/queries/useProgressProyek";
import { useGetBankRekening } from "../../hooks/queries/useBankRekening";
import {
  useCreateSpk,
  useDeleteSpk,
  useGetSpk,
  useUpdateSpk,
} from "../../hooks/queries/useSpk";
import type { SpkData } from '../../services/spk.service';
import SpkPembayaranPanel from '../../components/proyek/SpkPembayaranPanel';
import SpkPembayaranMandorRingkasan from '../../components/proyek/SpkPembayaranMandorRingkasan';
import SpkPembayaranStatusChips from '../../components/proyek/SpkPembayaranStatusChips';
import { useGetSpkPembayaranList } from '../../hooks/queries/useSpkPembayaran';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';
import type { KavlingData } from '../../services/kavling.service';
import type { BankRekeningPt } from '../../services/bankRekening.service';

interface SpkFormState {
  noSpk: string;
  tanggalSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number | '';
  bankRekeningPtId: number | '';
  progressOverride: number | '';
  notesPekerjaan: string;
  jatuhTempo: string;
  mandorId: number | '';
  kavlingIds: number[];
  fileSpk: File | null;
  existingFileSpk: string | null;
}

interface KavlingSpkAssignment {
  spkId: number;
  noSpk: string;
  mandorUsername: string;
}

interface KavlingPickerRow {
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  customerNama: string;
  disabled: boolean;
  handledBy?: KavlingSpkAssignment;
}

interface KavlingBlokGroup {
  blok: string;
  units: KavlingPickerRow[];
}

type BlokSelectionState = 'none' | 'partial' | 'all';

const getSelectableUnitIds = (units: KavlingPickerRow[]) =>
  units.filter((u) => !u.disabled).map((u) => u.kavlingId);

const getBlokSelectionState = (
  units: KavlingPickerRow[],
  selectedIds: number[],
): BlokSelectionState => {
  const selectable = getSelectableUnitIds(units);
  if (selectable.length === 0) return 'none';
  const selectedCount = selectable.filter((id) => selectedIds.includes(id)).length;
  if (selectedCount === 0) return 'none';
  if (selectedCount === selectable.length) return 'all';
  return 'partial';
};

interface BlokCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  onChange: () => void;
}

const BlokCheckbox = ({ checked, indeterminate, disabled, onChange }: BlokCheckboxProps) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="w-4 h-4 rounded border-gray-300 text-indigo-600 shrink-0 disabled:cursor-not-allowed"
    />
  );
};

const todayIso = () => new Date().toISOString().split('T')[0]!;

const compareKavlingBlokUnit = (
  a: { blok: string; nomorUnit: string },
  b: { blok: string; nomorUnit: string },
) => {
  const blokCmp = a.blok.localeCompare(b.blok, undefined, { numeric: true, sensitivity: 'base' });
  if (blokCmp !== 0) return blokCmp;
  return a.nomorUnit.localeCompare(b.nomorUnit, undefined, { numeric: true, sensitivity: 'base' });
};

const SPK_KAVLING_PREVIEW_MAX = 8;

const SpkKavlingCell = ({ items }: { items: SpkData['kavlingItems'] }) => {
  const sorted = useMemo(
    () => [...items].sort(compareKavlingBlokUnit),
    [items],
  );
  if (sorted.length === 0) {
    return <span className="text-xs text-slate-400">-</span>;
  }
  const preview = sorted.slice(0, SPK_KAVLING_PREVIEW_MAX);
  const hiddenCount = sorted.length - preview.length;
  const fullLabel = sorted.map((k) => `${k.blok}-${k.nomorUnit}`).join(', ');
  return (
    <div className="max-w-[200px]" title={fullLabel}>
      <div className="flex flex-wrap gap-0.5">
        {preview.map((k) => (
          <span
            key={k.kavlingId}
            className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 text-[10px] font-semibold text-indigo-700 leading-tight whitespace-nowrap border border-indigo-100"
          >
            {k.blok}-{k.nomorUnit}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 leading-tight border border-slate-200">
            +{hiddenCount}
          </span>
        )}
      </div>
    </div>
  );
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));


const getCustomerNamaFromKavling = (kavling: KavlingData): string => {
  const activePenjualan = kavling.penjualan?.find((p) => p.customer?.nama);
  return activePenjualan?.customer?.nama ?? '-';
};

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

const initialFormState = (): SpkFormState => ({
  noSpk: '',
  tanggalSpk: todayIso(),
  judulPekerjaan: '',
  nilaiKontrak: '',
  bankRekeningPtId: '',
  progressOverride: '',
  notesPekerjaan: '',
  jatuhTempo: '',
  mandorId: '',
  kavlingIds: [],
  fileSpk: null,
  existingFileSpk: null,
});

// ── Section wrapper untuk form modal ──────────────────────────────────────────
const FormSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-50 border-b border-slate-200">
      {icon && <span className="text-slate-500">{icon}</span>}
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</h4>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const detailThClass =
  'px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase bg-slate-50 border border-slate-200 whitespace-nowrap';
const detailTdClass = 'px-2.5 py-1.5 border border-slate-200 text-xs text-slate-800 align-middle';

const DetailSectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-xs font-bold text-slate-800 mb-1.5">{children}</h4>
);

const SPK = () => {
  const { user, selectedPerumahan } = useAuth();
  const canManageSpk = user?.role !== 'MANDOR';
  const canEditSpkProgress = canManageSpk;

  const canAjukanPembayaranFor = (spk: SpkData) => {
    if (!user) return false;
    if (user.role === 'MANDOR') return spk.mandorId === user.id;
    if (user.role === 'FINANCE' || user.role === 'CUSTOMER') return false;
    return true;
  };

  const isMandorRole = user?.role === 'MANDOR';

  const { data: spkList = [], isLoading: loadingSpk } = useGetSpk();
  const { data: pembayaranPage } = useGetSpkPembayaranList({ page: 1, limit: 500, status: 'ALL' });

  const visibleSpkList = useMemo(() => {
    if (isMandorRole && user?.id) {
      return spkList.filter((spk) => spk.mandorId === user.id);
    }
    return spkList;
  }, [isMandorRole, user?.id, spkList]);

  const pembayaranBySpkId = useMemo(() => {
    const map = new Map<number, SpkPembayaranData[]>();
    (pembayaranPage?.items ?? []).forEach((p) => {
      const list = map.get(p.spkId) ?? [];
      list.push(p);
      map.set(p.spkId, list);
    });
    return map;
  }, [pembayaranPage?.items]);

  const { data: kavlingResponse, isLoading: loadingKavling } = useGetKavlings({ limit: 500 });
  const { data: mandorList = [] } = useGetMandors();
  const { data: bankList = [] } = useGetBankRekening();

  const createMutation = useCreateSpk();
  const updateMutation = useUpdateSpk();
  const deleteMutation = useDeleteSpk();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SpkData | null>(null);
  const [formData, setFormData] = useState<SpkFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [expandedBloks, setExpandedBloks] = useState<Set<string>>(new Set());
  const [spkProgressInput, setSpkProgressInput] = useState<string>('');

  useEffect(() => {
    if (!detailItem) return;
    setSpkProgressInput(String(clampPercent(Number(detailItem.progress ?? 0))));
  }, [detailItem]);

  useEffect(() => {
    if (!detailItem) return;
    const fresh = visibleSpkList.find((s) => s.id === detailItem.id);
    if (fresh) setDetailItem(fresh);
  }, [visibleSpkList, detailItem?.id]);

  const bankOptions = useMemo(() => {
    const filtered = selectedPerumahan
      ? bankList.filter((b) => b.perumahanId === Number(selectedPerumahan.id))
      : bankList;
    return filtered;
  }, [bankList, selectedPerumahan]);

  const bankLabelById = useMemo(() => {
    const map = new Map<number, string>();
    bankList.forEach((b) => {
      map.set(b.id, `${b.atasNama}`);
    });
    return map;
  }, [bankList]);

  const kavlingSpkAssignmentMap = useMemo(() => {
    const map = new Map<number, KavlingSpkAssignment>();
    spkList.forEach((spk) => {
      spk.kavlingItems.forEach((item) => {
        map.set(item.kavlingId, {
          spkId: spk.id,
          noSpk: spk.noSpk,
          mandorUsername: spk.mandor.username,
        });
      });
    });
    return map;
  }, [spkList]);

  const kavlingPickerRows = useMemo(() => {
    if (!kavlingResponse?.items) return [];
    const rows: KavlingPickerRow[] = kavlingResponse.items.map((k) => {
      const assignment = kavlingSpkAssignmentMap.get(k.id);
      const isCurrentSpk = editingId !== null && assignment?.spkId === editingId;
      return {
        kavlingId: k.id,
        blok: k.blok,
        nomorUnit: k.nomorUnit,
        customerNama: getCustomerNamaFromKavling(k),
        disabled: !!assignment && !isCurrentSpk,
        handledBy: assignment && !isCurrentSpk ? assignment : undefined,
      };
    });
    return rows.sort(compareKavlingBlokUnit);
  }, [kavlingResponse, kavlingSpkAssignmentMap, editingId]);

  const kavlingBlokGroups = useMemo((): KavlingBlokGroup[] => {
    const groupMap = new Map<string, KavlingPickerRow[]>();
    kavlingPickerRows.forEach((row) => {
      const existing = groupMap.get(row.blok) ?? [];
      existing.push(row);
      groupMap.set(row.blok, existing);
    });
    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(([blok, units]) => ({ blok, units }));
  }, [kavlingPickerRows]);

  useEffect(() => {
    if (!formData.fileSpk) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formData.fileSpk);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.fileSpk]);

  const columns = [
    {
      header: 'No. SPK',
      accessor: 'noSpk',
      render: (val: string) => (
        <span className="font-bold text-slate-900 font-mono text-xs">{val}</span>
      ),
    },
    {
      header: 'Mandor',
      accessor: 'mandor',
      render: (val: SpkData['mandor']) => (
        <div className="flex items-center gap-2">
          <span className="text-slate-700 font-semibold text-sm">{val?.username || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Kavling',
      accessor: 'kavlingItems',
      render: (items: SpkData['kavlingItems']) => <SpkKavlingCell items={items} />,
    },
    {
      header: 'Nilai Kontrak',
      accessor: 'nilaiKontrak',
      render: (val: number) => (
        <span className="font-semibold text-slate-800 text-sm">{formatRupiah(val)}</span>
      ),
    },
    {
      header: 'Progress SPK',
      accessor: 'progress',
      render: (_val: number, row: SpkData) => {
        const persentase = Number(row.progress ?? 0);
        const isComplete = persentase === 100;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${persentase}%` }}
              />
            </div>
            <span className={`text-xs font-black min-w-[36px] text-right ${isComplete ? 'text-emerald-700' : 'text-slate-700'}`}>
              {persentase}%{row.progressIsOverride ? ' *' : ''}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Rek PT',
      accessor: 'bankRekeningPtId',
      render: (val: number | null) => (
        <span className="text-xs text-slate-500 leading-tight" title={val ? bankLabelById.get(val) : undefined}>
          {val ? (bankLabelById.get(val) ?? `ID ${val}`) : <span className="text-slate-300">—</span>}
        </span>
      ),
    },
    {
      header: 'Sisa Nilai',
      accessor: 'sisaNilaiKontrak',
      render: (val: number | null) => (
        <span className="text-sm font-semibold text-emerald-700">{val == null ? <span className="text-slate-300 font-normal">—</span> : formatRupiah(val)}</span>
      ),
    },
    {
      header: 'Sudah Dibayar',
      accessor: 'nilaiSudahDibayarkan',
      render: (val: number | null) => (
        <span className="text-sm font-semibold text-blue-700">{val == null ? <span className="text-slate-300 font-normal">—</span> : formatRupiah(val)}</span>
      ),
    },
    {
      header: 'Pembayaran',
      accessor: 'id',
      render: (_id: number, row: SpkData) => (
        <SpkPembayaranStatusChips
          items={pembayaranBySpkId.get(row.id) ?? []}
          showBuktiLinks={isMandorRole && row.mandorId === user?.id}
        />
      ),
    },
    {
      header: 'Dokumen',
      accessor: 'fileSpk',
      render: (val: string | null) => val ? (
        <a
          href={val}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <FileText size={12} />
          
        </a>
      ) : (
        <span className="text-slate-300 text-xs"></span>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState());
    setErrors({});
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
      kavlingIds: item.kavlingItems.map((p) => p.kavlingId),
      fileSpk: null,
      existingFileSpk: item.fileSpk,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openDetail = (item: SpkData) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExpandedBloks(new Set());
    setFormData(initialFormState());
    setEditingId(null);
  };

  const updateKavlingIds = (updater: (ids: number[]) => number[]) => {
    setFormData((prev) => ({ ...prev, kavlingIds: updater(prev.kavlingIds) }));
    if (errors.kavlingIds) {
      setErrors((prev) => ({ ...prev, kavlingIds: undefined }));
    }
  };

  const toggleKavling = (kavlingId: number, disabled: boolean) => {
    if (disabled) return;
    updateKavlingIds((ids) =>
      ids.includes(kavlingId) ? ids.filter((id) => id !== kavlingId) : [...ids, kavlingId],
    );
  };

  const toggleBlok = (units: KavlingPickerRow[]) => {
    const selectableIds = getSelectableUnitIds(units);
    if (selectableIds.length === 0) return;
    updateKavlingIds((ids) => {
      const allSelected = selectableIds.every((id) => ids.includes(id));
      if (allSelected) {
        return ids.filter((id) => !selectableIds.includes(id));
      }
      return Array.from(new Set([...ids, ...selectableIds]));
    });
  };

  const toggleBlokExpanded = (blok: string) => {
    setExpandedBloks((prev) => {
      const next = new Set(prev);
      if (next.has(blok)) next.delete(blok);
      else next.add(blok);
      return next;
    });
  };

  const clearUploadedFile = () => {
    setFormData((prev) => ({ ...prev, fileSpk: null, existingFileSpk: null }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCurrencyChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
    if (formData.kavlingIds.length === 0) {
      newErrors.kavlingIds = 'Pilih minimal satu kavling';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = {
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
      kavlingIds: formData.kavlingIds,
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
    if (!window.confirm(`Hapus data SPK ${item.noSpk}? Mandor pada kavling terkait akan dilepas.`)) return;
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasUploadedFile = !!formData.fileSpk || !!formData.existingFileSpk;

  if (loadingSpk || loadingKavling) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {isMandorRole && <SpkPembayaranMandorRingkasan mandorSpks={visibleSpkList} />}

      <DataTable
        title={isMandorRole ? 'SPK Saya' : 'Surat Perintah Kerja (SPK)'}
        columns={columns}
        data={visibleSpkList}
        onAdd={canManageSpk ? openCreateModal : undefined}
        onEdit={canManageSpk ? openEditModal : undefined}
        onDetail={openDetail}
        onDelete={canManageSpk ? handleDelete : undefined}
      />

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailItem(null); }}
        title="Detail SPK"
        size="lg"
      >
        {detailItem && (
          <div className="space-y-4">
            <section>
              <DetailSectionTitle>Informasi SPK</DetailSectionTitle>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-2.5 py-1.5 text-left text-[10px] font-bold uppercase">No. SPK</th>
                    <th className="px-2.5 py-1.5 text-left text-[10px] font-bold uppercase">Judul Pekerjaan</th>
                    <th className="px-2.5 py-1.5 text-left text-[10px] font-bold uppercase">Tanggal</th>
                    <th className="px-2.5 py-1.5 text-right text-[10px] font-bold uppercase">Nilai Kontrak</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className={`${detailTdClass} font-mono font-bold`}>{detailItem.noSpk}</td>
                    <td className={detailTdClass}>{detailItem.judulPekerjaan}</td>
                    <td className={`${detailTdClass} whitespace-nowrap`}>{formatDate(detailItem.tanggalSpk)}</td>
                    <td className={`${detailTdClass} text-right font-bold text-emerald-700 whitespace-nowrap`}>
                      {formatRupiah(detailItem.nilaiKontrak)}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </section>

            <section>
              <DetailSectionTitle>Keuangan &amp; Kontrak</DetailSectionTitle>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs border-collapse min-w-[640px]">
                <thead>
                  <tr>
                    <th className={detailThClass}>Mandor</th>
                    <th className={detailThClass}>Sisa Nilai Kontrak</th>
                    <th className={detailThClass}>Sudah Dibayar</th>
                    <th className={detailThClass}>Nilai Kontrak</th>
                    <th className={detailThClass}>Jatuh Tempo</th>
                    <th className={detailThClass}>Rekening PT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className={`${detailTdClass} font-semibold`}>{detailItem.mandor.username}</td>
                    <td className={`${detailTdClass} font-bold text-emerald-700 whitespace-nowrap`}>
                      {detailItem.sisaNilaiKontrak == null ? '—' : formatRupiah(detailItem.sisaNilaiKontrak)}
                    </td>
                    <td className={`${detailTdClass} font-bold text-blue-700 whitespace-nowrap`}>
                      {detailItem.nilaiSudahDibayarkan == null ? '—' : formatRupiah(detailItem.nilaiSudahDibayarkan)}
                    </td>
                    <td className={`${detailTdClass} whitespace-nowrap`}>
                      {formatRupiah(detailItem.nilaiKontrak)}
                    </td>
                    <td className={detailTdClass}>
                      {detailItem.jatuhTempo ? formatDate(detailItem.jatuhTempo) : '—'}
                    </td>
                    <td className={detailTdClass}>
                      {detailItem.bankRekeningPtId
                        ? bankLabelById.get(detailItem.bankRekeningPtId) ?? `ID ${detailItem.bankRekeningPtId}`
                        : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </section>

            <section>
              <DetailSectionTitle>Progress &amp; Dokumen</DetailSectionTitle>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className={detailThClass}>Progress SPK</th>
                    <th className={detailThClass}>Mode</th>
                    {canEditSpkProgress && <th className={detailThClass}>Progress SPK</th>}
                    <th className={detailThClass}>Dokumen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className={detailTdClass}>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${detailItem.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            style={{ width: `${Number(detailItem.progress ?? 0)}%` }}
                          />
                        </div>
                        <span className="font-bold text-indigo-800 whitespace-nowrap">
                          {Number(detailItem.progress ?? 0)}%
                        </span>
                      </div>
                    </td>
                    <td className={detailTdClass}>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          detailItem.progressIsOverride
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {detailItem.progressIsOverride ? 'Manual' : 'Awal (0%)'}
                      </span>
                    </td>
                    {canEditSpkProgress && (
                      <td className={detailTdClass}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            value={spkProgressInput}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
                              if (digits === '') {
                                setSpkProgressInput('');
                                return;
                              }
                              setSpkProgressInput(String(clampPercent(parseInt(digits, 10))));
                            }}
                            onBlur={() => {
                              if (spkProgressInput === '') {
                                setSpkProgressInput(String(clampPercent(Number(detailItem.progress ?? 0))));
                                return;
                              }
                              setSpkProgressInput(String(clampPercent(parseInt(spkProgressInput, 10))));
                            }}
                            className="w-12 px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-center outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <span className="text-[10px] font-bold text-slate-500">%</span>
                          <button
                            type="button"
                            className="px-2 py-1 text-[10px] font-bold rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            onClick={async () => {
                              const parsed =
                                spkProgressInput === ''
                                  ? clampPercent(Number(detailItem.progress ?? 0))
                                  : clampPercent(parseInt(spkProgressInput, 10));
                              try {
                                await updateMutation.mutateAsync({
                                  id: detailItem.id,
                                  data: { progressOverride: parsed },
                                });
                              } catch (err: unknown) {
                                alert(handleApiError(err).message);
                              }
                            }}
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 text-[10px] font-bold rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={async () => {
                              try {
                                await updateMutation.mutateAsync({
                                  id: detailItem.id,
                                  data: { progressOverride: null },
                                });
                              } catch (err: unknown) {
                                alert(handleApiError(err).message);
                              }
                            }}
                          >
                            Reset ke 0%
                          </button>
                        </div>
                      </td>
                    )}
                    <td className={detailTdClass}>
                      {detailItem.fileSpk ? (
                        <a
                          href={detailItem.fileSpk}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          <FileText size={12} />
                          PDF
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </section>

            {detailItem.kavlingItems.length > 0 && (
              <section>
                <DetailSectionTitle>Kavling SPK</DetailSectionTitle>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs border-collapse min-w-[320px]">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className={detailThClass}>Blok</th>
                      <th className={detailThClass}>Unit</th>
                      <th className={detailThClass}>Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...detailItem.kavlingItems]
                      .sort(compareKavlingBlokUnit)
                      .map((k) => (
                        <tr key={k.kavlingId} className="bg-white hover:bg-slate-50/80">
                          <td className={detailTdClass}>{k.blok}</td>
                          <td className={detailTdClass}>{k.nomorUnit}</td>
                          <td className={detailTdClass}>{k.customerNama || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
              </section>
            )}

            {detailItem.notesPekerjaan && (
              <section>
                <DetailSectionTitle>Catatan Pekerjaan</DetailSectionTitle>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr>
                        <td className={`${detailTdClass} whitespace-pre-wrap leading-relaxed`}>
                          {detailItem.notesPekerjaan}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section>
              <DetailSectionTitle>Pengajuan Pembayaran</DetailSectionTitle>
              <SpkPembayaranPanel
                spk={detailItem}
                canAjukan={canAjukanPembayaranFor(detailItem)}
              />
            </section>
          </div>
        )}
      </Modal>

      {/* ── Create/Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit SPK' : 'Buat SPK Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Informasi SPK">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nomor SPK" name="noSpk" value={formData.noSpk} onChange={handleChange} error={errors.noSpk} />
              <Input label="Tanggal SPK" type="date" name="tanggalSpk" value={formData.tanggalSpk} onChange={handleChange} />
              <div className="md:col-span-2">
                <Input label="Judul Pekerjaan" name="judulPekerjaan" value={formData.judulPekerjaan} onChange={handleChange} error={errors.judulPekerjaan} />
              </div>
              <CurrencyInput
                label="Nilai Kontrak"
                name="nilaiKontrak"
                value={formData.nilaiKontrak}
                onValueChange={handleCurrencyChange}
                error={errors.nilaiKontrak}
                placeholder="0"
              />
              <Select
                label="Rekening PT (opsional)"
                name="bankRekeningPtId"
                value={formData.bankRekeningPtId !== '' ? String(formData.bankRekeningPtId) : ''}
                onChange={handleChange}
                options={[
                  { value: '', label: '— Pilih Rekening PT —' },
                  ...bankOptions.map((b: BankRekeningPt) => ({
                    value: String(b.id),
                    label: `${b.namaBank} · ${b.noRekening} · a/n ${b.atasNama}`,
                  })),
                ]}
              />
              <Input label="Jatuh Tempo (opsional)" type="date" name="jatuhTempo" value={formData.jatuhTempo} onChange={handleChange} />
              <Select
                label="Mandor"
                name="mandorId"
                value={formData.mandorId !== '' ? String(formData.mandorId) : ''}
                onChange={handleChange}
                error={errors.mandorId}
                options={[
                  { value: '', label: '— Pilih Mandor —' },
                  ...mandorList.map((m) => ({
                    value: String(m.id),
                    label: m.username,
                  })),
                ]}
              />
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">
                  Catatan Pekerjaan (opsional)
                </label>
                <textarea
                  name="notesPekerjaan"
                  value={formData.notesPekerjaan}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm min-h-[80px] text-black focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all resize-none"
                  placeholder="Catatan tambahan pekerjaan..."
                />
              </div>
              {editingId && (
                <div className="md:col-span-2 flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                  <span className="mt-0.5 shrink-0 w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-black">i</span>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Sisa nilai kontrak dihitung otomatis dari setiap pembayaran (termin, retensi, kasbon) yang sudah diproses finance.
                  </p>
                </div>
              )}
            </div>
          </FormSection>

          <FormSection title="Kavling Proyek">
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Centang blok untuk memilih semua unit, atau buka blok dan pilih unit tertentu saja.
            </p>
            {errors.kavlingIds && (
              <p className="text-xs font-semibold text-red-600 mb-3 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                {errors.kavlingIds}
              </p>
            )}
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
              {kavlingBlokGroups.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 italic text-center">Belum ada data kavling.</p>
              ) : (
                kavlingBlokGroups.map((group) => {
                  const blokState = getBlokSelectionState(group.units, formData.kavlingIds);
                  const selectableIds = getSelectableUnitIds(group.units);
                  const selectedInBlok = selectableIds.filter((id) =>
                    formData.kavlingIds.includes(id),
                  ).length;
                  const isExpanded = expandedBloks.has(group.blok);
                  const blokCheckboxDisabled = selectableIds.length === 0;
                  return (
                    <div key={group.blok}>
                      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50/90">
                        <BlokCheckbox
                          checked={blokState === 'all'}
                          indeterminate={blokState === 'partial'}
                          disabled={blokCheckboxDisabled}
                          onChange={() => toggleBlok(group.units)}
                        />
                        <button
                          type="button"
                          onClick={() => toggleBlokExpanded(group.blok)}
                          className="p-0.5 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 shrink-0 transition-colors"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBlokExpanded(group.blok)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <span className="text-sm font-bold text-slate-800">Blok {group.blok}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {selectedInBlok}/{selectableIds.length} dipilih
                            {group.units.length > selectableIds.length && (
                              <span className="text-amber-600 ml-1">
                                · {group.units.length - selectableIds.length} tidak tersedia
                              </span>
                            )}
                          </span>
                        </button>
                      </div>
                      {isExpanded &&
                        group.units.map((k) => (
                          <label
                            key={k.kavlingId}
                            className={`flex items-start gap-3 pl-9 pr-4 py-2 transition-colors ${
                              k.disabled
                                ? 'bg-slate-50/60 cursor-not-allowed opacity-70'
                                : 'hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.kavlingIds.includes(k.kavlingId)}
                              disabled={k.disabled}
                              onChange={() => toggleKavling(k.kavlingId, k.disabled)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 shrink-0 mt-0.5 disabled:cursor-not-allowed"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-bold min-w-[72px] ${k.disabled ? 'text-slate-400' : 'text-slate-800'}`}>
                                  Unit {k.nomorUnit}
                                </span>
                                <span className="text-xs text-slate-500 truncate max-w-[140px]" title={k.customerNama}>
                                  {k.customerNama}
                                </span>
                              </div>
                              {k.handledBy && (
                                <p className="text-[11px] text-amber-700 font-medium mt-0.5 leading-snug">
                                  Ditangani mandor {k.handledBy.mandorUsername} (SPK {k.handledBy.noSpk})
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                    </div>
                  );
                })
              )}
            </div>
          </FormSection>

          <FormSection title="Dokumen">
            <FileInput
              label="Upload SPK (PDF, opsional)"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setFormData((prev) => ({
                  ...prev,
                  fileSpk: file,
                  existingFileSpk: file ? null : prev.existingFileSpk,
                }));
                e.target.value = '';
              }}
            />
            {hasUploadedFile && (
              <div className="mt-3 flex items-start gap-3 p-3.5 bg-white border border-red-100 rounded-xl shadow-sm">
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
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold mt-1 hover:underline"
                    >
                      <ExternalLink size={11} />
                      Pratinjau dokumen tersimpan
                    </a>
                  )}
                  {filePreviewUrl && formData.fileSpk && (
                    <p className="text-xs text-slate-500 mt-0.5">Siap diunggah saat simpan</p>
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
          </FormSection>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat SPK'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SPK;