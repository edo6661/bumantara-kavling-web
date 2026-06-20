import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ArrowUpDown,
  Plus,
  Search,
  PieChart,
  HardHat,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import CurrencyInput from "../../components/shared/CurrencyInput";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate, formatTanpaDesimal } from "../../utils/formatters";
import { handleApiError } from '../../utils/errorHandler';
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../hooks/usePermission";
import { useGetKavlings } from "../../hooks/queries/useKavling";
import { useGetMandors } from "../../hooks/queries/useProgressProyek";
import { useGetBankRekening } from "../../hooks/queries/useBankRekening";
import {
  useCreateSpk,
  useDeleteSpk,
  useGetSpk,
  useGetSpkPaginated,
  useUpdateSpk,
} from "../../hooks/queries/useSpk";
import type { GetSpkParams, SpkData } from '../../services/spk.service';
import SpkPembayaranPanel from '../../components/proyek/SpkPembayaranPanel';
import CollapsibleDetailSection from '../../components/shared/CollapsibleDetailSection';
import type { SpkKavlingItem } from '../../services/spk.service';
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
  luasTanah: number;
  luasBangunan: number;
  customerNama: string;
  disabled: boolean;
  handledBy?: KavlingSpkAssignment;
}

interface KavlingBlokGroup {
  blok: string;
  units: KavlingPickerRow[];
}

interface GroupedSpkByMandor {
  id: number;
  mandorId: number;
  mandorUsername: string;
  jumlahSpk: number;
  totalKavling: number;
  totalNilaiKontrak: number;
  totalSudahDibayar: number;
  totalSisaNilai: number;
  spkSelesai: number;
  records: SpkData[];
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
      className="w-4 h-4 rounded border-gray-300 text-blue-600 shrink-0 disabled:cursor-not-allowed"
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

const SPK_KAVLING_COLLAPSED_COUNT = 1;

/** Tampilan 3 digit nomor urut SPK (mis. 016), bukan digit terakhir gabungan dengan tahun. */
/** Label singkat KSO di tabel (SGMP / BMS). */
const formatKsoShortLabel = (atasNama: string): string => {
  const n = atasNama.trim().toLowerCase();
  if (n.includes('mahligai')) return 'BMS';
  if (n.includes('gajah')) return 'SGMP';
  return atasNama;
};

const formatShortNoSpk = (noSpk: string): string => {
  const trimmed = noSpk.trim();
  if (!trimmed) return '';

  const pad3 = (digits: string) => {
    const d = digits.replace(/\D/g, '');
    if (!d) return '';
    return d.length <= 3 ? d.padStart(3, '0') : d.slice(-3);
  };

  // Contoh: 016/2026, 16/2026 → ambil segmen sebelum /
  if (trimmed.includes('/')) {
    const head = pad3(trimmed.split('/')[0] ?? '');
    if (head) return head;
  }

  // Contoh: SPK-016, SPK 016 → grup digit nomor urut (bukan tahun 20xx)
  const digitGroups = trimmed.match(/\d+/g);
  if (digitGroups?.length) {
    const seq =
      digitGroups.find((g) => g.length >= 2 && g.length <= 3)
      ?? digitGroups.find((g) => g.length === 1)
      ?? digitGroups.find((g) => !(g.length === 4 && /^20\d{2}$/.test(g)))
      ?? digitGroups[0];
    const short = pad3(seq);
    if (short) return short;
  }

  return trimmed.slice(0, 3);
};

const formatKavlingItemLabel = (k: SpkKavlingItem) =>
  `Blok ${k.blok} · Unit ${k.nomorUnit} · LT ${k.luasTanah ?? 0} · LB ${k.luasBangunan ?? 0}`;

const KavlingListItem = ({ k }: { k: SpkKavlingItem }) => (
  <li className="leading-tight">
    <p className="whitespace-nowrap text-xs font-bold text-slate-800">
      {k.blok}-{k.nomorUnit}
    </p>
    <p className="whitespace-nowrap text-[11px] text-slate-500 tabular-nums">
      LT {k.luasTanah ?? 0} · LB {k.luasBangunan ?? 0}
    </p>
  </li>
);

const SpkKavlingCell = ({ items }: { items: SpkData['kavlingItems'] }) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(
    () => [...items].sort(compareKavlingBlokUnit),
    [items],
  );
  const kavlingIdsKey = useMemo(
    () => sorted.map((k) => k.kavlingId).join(','),
    [sorted],
  );

  useEffect(() => {
    setExpanded(false);
  }, [kavlingIdsKey]);

  if (sorted.length === 0) {
    return <span className="text-xs text-slate-400">-</span>;
  }

  const hasMore = sorted.length > SPK_KAVLING_COLLAPSED_COUNT;
  const hiddenCount = sorted.length - SPK_KAVLING_COLLAPSED_COUNT;
  const visibleItems =
    expanded || !hasMore ? sorted : sorted.slice(0, SPK_KAVLING_COLLAPSED_COUNT);
  const fullLabel = sorted.map(formatKavlingItemLabel).join('\n');

  return (
    <div className="max-w-[130px]" title={expanded ? undefined : fullLabel}>
      <ul className="space-y-1.5">
        {visibleItems.map((k) => (
          <KavlingListItem key={k.kavlingId} k={k} />
        ))}
        {hasMore && (
          <li>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              className="text-[10px] font-bold text-blue-600 whitespace-nowrap hover:text-blue-800 hover:underline cursor-pointer"
              aria-expanded={expanded}
            >
              {expanded
                ? 'Lihat lebih sedikit'
                : `+${hiddenCount} kavling lainnya`}
            </button>
          </li>
        )}
      </ul>
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

const FormSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
      {icon && <span className="text-blue-500">{icon}</span>}
      <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="p-5 space-y-1">{children}</div>
  </div>
);

const detailThClass =
  'px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase bg-slate-50 border border-slate-200 whitespace-nowrap';
const detailTdClass = 'px-2.5 py-1.5 border border-slate-200 text-xs text-slate-800 align-middle';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const SPK = () => {
  const { user, selectedPerumahan } = useAuth();
  const { canRead: canReadSpk } = usePermission('SPK');
  const canManageSpk = user?.role !== 'MANDOR';
  const canEditSpkProgress = canManageSpk;

  const canAjukanPembayaranFor = (spk: SpkData) => {
    if (!user) return false;
    if (user.role === 'MANDOR') return spk.mandorId === user.id;
    if (user.role === 'CUSTOMER') return false;
    return canReadSpk;
  };

  const isMandorRole = user?.role === 'MANDOR';
  const isAdminRole = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const orderBy = (searchParams.get('orderBy') || 'mandor:asc') as GetSpkParams['orderBy'];
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;

  const { data: spkResponse, isLoading: loadingSpk, isFetching: fetchingSpk } = useGetSpkPaginated(
    {
      page,
      limit,
      search: search || undefined,
      orderBy,
    },
    { enabled: !isAdminRole },
  );

  const {
    data: adminSpkResponse,
    isLoading: loadingAdminSpk,
    isFetching: fetchingAdminSpk,
  } = useGetSpkPaginated(
    {
      page: 1,
      limit: 500,
      search: search || undefined,
      orderBy,
    },
    { enabled: isAdminRole },
  );

  const spkData = spkResponse?.items ?? [];
  const adminSpkList = adminSpkResponse?.items ?? [];
  const meta = isAdminRole ? adminSpkResponse?.meta : spkResponse?.meta;

  const { data: spkAllList = [] } = useGetSpk({ limit: 500 });

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [kavlingPickerSearch, setKavlingPickerSearch] = useState('');

  const spkSummary = meta?.summary ?? {
    totalSpk: 0,
    totalKavling: 0,
    totalNilaiKontrak: 0,
    totalSudahDibayar: 0,
    totalSisaNilai: 0,
    progressSelesai: 0,
  };

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

  const handlePageSizeChange = (newLimit: number) => {
    setSearchParams((prev) => {
      if (newLimit === DEFAULT_PAGE_SIZE) prev.delete('limit');
      else prev.set('limit', String(newLimit));
      prev.set('page', '1');
      return prev;
    });
  };

  const handleOrderByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      prev.set('orderBy', e.target.value);
      prev.set('page', '1');
      return prev;
    });
  };

  const { data: kavlingResponse, isLoading: loadingKavling } = useGetKavlings({ limit: 500 });
  const { data: mandorList = [] } = useGetMandors();
  const { data: bankList = [] } = useGetBankRekening();

  const createMutation = useCreateSpk();
  const updateMutation = useUpdateSpk();
  const deleteMutation = useDeleteSpk();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SpkData | null>(null);
  const [kasbonQuickSpk, setKasbonQuickSpk] = useState<SpkData | null>(null);
  const [historiKasbonSpk, setHistoriKasbonSpk] = useState<SpkData | null>(null);
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
    const source = isAdminRole ? adminSpkList : spkData;
    const fresh = source.find((s) => s.id === detailItem.id);
    if (fresh) setDetailItem(fresh);
  }, [spkData, adminSpkList, detailItem?.id, isAdminRole]);

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

  const bankShortLabelById = useMemo(() => {
    const map = new Map<number, string>();
    bankList.forEach((b) => {
      map.set(b.id, formatKsoShortLabel(b.atasNama));
    });
    return map;
  }, [bankList]);

  const kavlingSpkAssignmentMap = useMemo(() => {
    const map = new Map<number, KavlingSpkAssignment>();
    spkAllList.forEach((spk) => {
      spk.kavlingItems.forEach((item) => {
        map.set(item.kavlingId, {
          spkId: spk.id,
          noSpk: spk.noSpk,
          mandorUsername: spk.mandor.username,
        });
      });
    });
    return map;
  }, [spkAllList]);

  const kavlingPickerRows = useMemo(() => {
    if (!kavlingResponse?.items) return [];
    const rows: KavlingPickerRow[] = kavlingResponse.items.map((k) => {
      const assignment = kavlingSpkAssignmentMap.get(k.id);
      const isCurrentSpk = editingId !== null && assignment?.spkId === editingId;
      return {
        kavlingId: k.id,
        blok: k.blok,
        nomorUnit: k.nomorUnit,
        luasTanah: k.luasTanah,
        luasBangunan: k.luasBangunan,
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

  const filteredKavlingBlokGroups = useMemo((): KavlingBlokGroup[] => {
    const q = kavlingPickerSearch.trim().toLowerCase();
    if (!q) return kavlingBlokGroups;
    return kavlingBlokGroups
      .map((group) => {
        const units = group.units.filter((u) => {
          const haystack = [
            group.blok,
            u.nomorUnit,
            u.customerNama,
            String(u.luasTanah),
            String(u.luasBangunan),
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        });
        return { blok: group.blok, units };
      })
      .filter((g) => g.units.length > 0);
  }, [kavlingBlokGroups, kavlingPickerSearch]);

  useEffect(() => {
    const q = kavlingPickerSearch.trim();
    if (!q) return;
    setExpandedBloks(new Set(filteredKavlingBlokGroups.map((g) => g.blok)));
  }, [kavlingPickerSearch, filteredKavlingBlokGroups]);

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
      header: 'No',
      accessor: 'noSpk',
      render: (val: string) => (
        <span
          className="font-bold text-slate-900 font-mono text-xs"
          title={val}
        >
          {formatShortNoSpk(val)}
        </span>
      ),
    },
    {
      header: 'Mandor',
      accessor: 'mandor',
      minWidth: 'min-w-[4.5rem]',
      render: (val: SpkData['mandor']) => (
        <span className="text-slate-700 font-semibold text-xs" title={val?.username}>
          {val?.username || '-'}
        </span>
      ),
    },
    {
      header: 'Kavling',
      accessor: 'kavlingItems',
      nowrap: false,
      minWidth: 'min-w-[7.5rem]',
      render: (items: SpkData['kavlingItems']) => <SpkKavlingCell items={items} />,
    },
    {
      header: 'Total',
      accessor: 'id',
      className: 'text-center',
      render: (_id: number, row: SpkData) => (
        <span className="text-xs font-bold text-slate-800 tabular-nums">{row.kavlingItems.length}</span>
      ),
    },
    {
      header: 'Nilai Kontrak',
      accessor: 'nilaiKontrak',
      headerNowrap: false,
      minWidth: 'min-w-[8.25rem]',
      render: (val: number, row: SpkData) => {
        const canAjukanKasbon = canAjukanPembayaranFor(row);
        return (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-800 text-xs tabular-nums whitespace-nowrap">
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
      minWidth: 'min-w-[5.5rem]',
      render: (_val: number, row: SpkData) => {
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
    {
      header: 'Sisa Nilai',
      accessor: 'sisaNilaiKontrak',
      headerNowrap: false,
      minWidth: 'min-w-[6.75rem]',
      render: (val: number | null) => {
        if (val == null) return <span className="text-slate-300 text-xs">—</span>;
        const unpaid = val > 0;
        return (
          <span className={`text-xs font-semibold tabular-nums whitespace-nowrap ${unpaid ? 'text-red-600' : 'text-slate-400'}`}>
            {formatTanpaDesimal(val)}
          </span>
        );
      },
    },
    {
      header: 'Sudah Dibayar',
      accessor: 'nilaiSudahDibayarkan',
      headerNowrap: false,
      minWidth: 'min-w-[6.75rem]',
      render: (val: number | null) => {
        if (val == null) return <span className="text-slate-300 text-xs">—</span>;
        const paid = val > 0;
        return (
          <span className={`text-xs font-semibold tabular-nums whitespace-nowrap ${paid ? 'text-emerald-700' : 'text-slate-400'}`}>
            {formatTanpaDesimal(val)}
          </span>
        );
      },
    },
    {
      header: 'Dokumen',
      accessor: 'fileSpk',
      minWidth: 'min-w-[4.5rem]',
      render: (val: string | null) => val ? (
        <a
          href={val}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <FileText size={11} />
          PDF
        </a>
      ) : (
        <span className="text-slate-300 text-xs">—</span>
      ),
    },
    {
      header: 'KSO',
      accessor: 'bankRekeningPtId',
      minWidth: 'min-w-[2.75rem]',
      render: (val: number | null) => (
        <span
          className="text-xs font-bold text-slate-700"
          title={val ? bankLabelById.get(val) : undefined}
        >
          {val ? (bankShortLabelById.get(val) ?? `ID ${val}`) : <span className="text-slate-300 font-normal">—</span>}
        </span>
      ),
    },
  ];

  const spkDetailColumns = columns.filter((col) => col.accessor !== 'mandor');

  const groupedSpkByMandor = useMemo((): GroupedSpkByMandor[] => {
    const groups = new Map<number, GroupedSpkByMandor>();

    adminSpkList.forEach((spk) => {
      const existing = groups.get(spk.mandorId);
      if (!existing) {
        groups.set(spk.mandorId, {
          id: spk.mandorId,
          mandorId: spk.mandorId,
          mandorUsername: spk.mandor?.username ?? `Mandor #${spk.mandorId}`,
          jumlahSpk: 0,
          totalKavling: 0,
          totalNilaiKontrak: 0,
          totalSudahDibayar: 0,
          totalSisaNilai: 0,
          spkSelesai: 0,
          records: [],
        });
      }

      const group = groups.get(spk.mandorId)!;
      group.records.push(spk);
      group.jumlahSpk += 1;
      group.totalKavling += spk.kavlingItems.length;
      group.totalNilaiKontrak += Number(spk.nilaiKontrak ?? 0);
      group.totalSudahDibayar += Number(spk.nilaiSudahDibayarkan ?? 0);
      group.totalSisaNilai += Number(spk.sisaNilaiKontrak ?? 0);
      if (Number(spk.progress ?? 0) === 100) group.spkSelesai += 1;
    });

    const sortedRecords = (records: SpkData[]) => {
      if (orderBy === 'id:desc') {
        return [...records].sort((a, b) => b.id - a.id);
      }
      return [...records].sort((a, b) =>
        (a.mandor?.username ?? '').localeCompare(b.mandor?.username ?? '', 'id', {
          numeric: true,
          sensitivity: 'base',
        }),
      );
    };

    let result = Array.from(groups.values()).map((group) => ({
      ...group,
      records: sortedRecords(group.records),
    }));

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
      minWidth: 'min-w-[6rem]',
      render: (val: string) => (
        <span className="font-bold text-slate-900 text-sm" title={val}>
          {val}
        </span>
      ),
    },
    {
      header: 'SPK',
      accessor: 'jumlahSpk',
      className: 'text-center',
      render: (val: number, row: GroupedSpkByMandor) => (
        <div className="text-center">
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold tabular-nums">
            {val}x
          </span>
          <p className="text-[10px] text-slate-500 mt-1">{row.spkSelesai} selesai</p>
        </div>
      ),
    },
    {
      header: 'Kavling',
      accessor: 'totalKavling',
      className: 'text-center',
      render: (val: number) => (
        <span className="text-xs font-bold text-slate-800 tabular-nums">{val}</span>
      ),
    },
    {
      header: 'Nilai Kontrak',
      accessor: 'totalNilaiKontrak',
      minWidth: 'min-w-[8.25rem]',
      render: (val: number) => (
        <span className="font-semibold text-slate-800 text-xs tabular-nums whitespace-nowrap">
          {formatTanpaDesimal(val)}
        </span>
      ),
    },
    {
      header: 'Sudah Dibayar',
      accessor: 'totalSudahDibayar',
      minWidth: 'min-w-[6.75rem]',
      render: (val: number) => (
        <span className="text-xs font-semibold tabular-nums whitespace-nowrap text-emerald-700">
          {formatTanpaDesimal(val)}
        </span>
      ),
    },
    {
      header: 'Sisa Nilai',
      accessor: 'totalSisaNilai',
      minWidth: 'min-w-[6.75rem]',
      render: (val: number) => (
        <span
          className={`text-xs font-semibold tabular-nums whitespace-nowrap ${val > 0 ? 'text-red-600' : 'text-slate-400'}`}
        >
          {formatTanpaDesimal(val)}
        </span>
      ),
    },
  ];

  const expandedMandorRowRender = (row: GroupedSpkByMandor) => (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
        Daftar SPK: <span className="text-blue-600">{row.mandorUsername}</span>
      </h4>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              {spkDetailColumns.map((col) => (
                <th
                  key={col.accessor}
                  className={`px-3 py-2.5 align-bottom ${col.minWidth ?? ''} ${col.className ?? ''} ${col.headerNowrap === false ? 'whitespace-normal leading-snug' : 'whitespace-nowrap'}`}
                >
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
                  <td
                    key={col.accessor}
                    className={`px-3 py-2.5 text-slate-700 font-medium align-top ${col.minWidth ?? ''} ${col.className ?? ''} ${col.nowrap === false ? 'whitespace-normal' : 'whitespace-nowrap'}`}
                  >
                    {col.render
                      ? col.render(spk[col.accessor as keyof SpkData], spk)
                      : String(spk[col.accessor as keyof SpkData] ?? '')}
                  </td>
                ))}
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDetail(spk)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
                      title="Detail"
                    >
                      <Eye size={16} />
                    </button>
                    {canManageSpk && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(spk)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(spk)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                          title="Hapus"
                        >
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

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState());
    setErrors({});
    setKavlingPickerSearch('');
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
    setKavlingPickerSearch('');
    setIsModalOpen(true);
  };

  const openDetail = (item: SpkData) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExpandedBloks(new Set());
    setKavlingPickerSearch('');
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

  if (
    ((isAdminRole ? loadingAdminSpk : loadingSpk) && !(isAdminRole ? adminSpkResponse : spkResponse))
    || loadingKavling
  ) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-2 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
      <div
        className="px-5 py-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-white hover:bg-slate-50/60 transition-colors"
        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl ring-1 ring-blue-100">
            <PieChart size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight text-sm">
              {isMandorRole ? 'Ringkasan SPK Saya' : 'Ringkasan SPK'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Klik untuk {isSummaryExpanded ? 'menyembunyikan' : 'menampilkan'}</p>
          </div>
        </div>
        <div className={`p-1.5 rounded-lg border transition-all ${isSummaryExpanded ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
          {isSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

        {isSummaryExpanded && (
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-br from-slate-50 to-white">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-100 rounded-full -translate-y-8 translate-x-8 group-hover:bg-slate-200 transition-colors" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <HardHat size={16} className="text-slate-600" />
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total SPK</p>
              </div>
              <p className="text-3xl font-black text-slate-900 tabular-nums">{spkSummary.totalSpk}</p>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                {spkSummary.progressSelesai} selesai (100%)
              </p>
            </div>


            <div className="bg-white border border-blue-100 p-4 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -translate-y-8 translate-x-8 group-hover:bg-blue-100 transition-colors" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-blue-600" />
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Kavling</p>
              </div>
              <p className="text-3xl font-black text-blue-700 tabular-nums">{spkSummary.totalKavling}</p>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium truncate" title={formatRupiah(spkSummary.totalNilaiKontrak)}>
                Kontrak {formatRupiah(spkSummary.totalNilaiKontrak)}
              </p>
            </div>


            <div className="bg-white border border-emerald-100 p-4 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full -translate-y-8 translate-x-8 group-hover:bg-emerald-100 transition-colors" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sudah Dibayar</p>
              </div>
              <p className="text-xl font-black text-emerald-700 tabular-nums leading-tight">
                {formatRupiah(spkSummary.totalSudahDibayar)}
              </p>
            </div>


            <div className="bg-white border border-red-100 p-4 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-full -translate-y-8 translate-x-8 group-hover:bg-red-100 transition-colors" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} className="text-red-600" />
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sisa Nilai</p>
              </div>
              <p className="text-xl font-black text-red-700 tabular-nums leading-tight">
                {formatRupiah(spkSummary.totalSisaNilai)}
              </p>
            </div>

          </div>
        )}
      </div>

      {isAdminRole ? (
        <DataTable
          title="Surat Perintah Kerja (SPK)"
          columns={mandorGroupColumns}
          dense
          data={groupedSpkByMandor}
          expandedRowRender={expandedMandorRowRender}
          toolbarPrefix={tableToolbar}
          serverSide
          searchTerm={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Cari mandor, blok, no. SPK..."
          onAdd={canManageSpk ? openCreateModal : undefined}
        />
      ) : (
        <DataTable
          title={isMandorRole ? 'SPK Saya' : 'Surat Perintah Kerja (SPK)'}
          columns={columns}
          dense
          data={spkData}
          toolbarPrefix={tableToolbar}
          serverSide
          searchTerm={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Cari mandor, blok, no. SPK..."
          page={page}
          totalPages={meta?.totalPages || 1}
          onPageChange={handlePageChange}
          pageSize={limit}
          pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
          onPageSizeChange={handlePageSizeChange}
          onAdd={canManageSpk ? openCreateModal : undefined}
          onEdit={canManageSpk ? openEditModal : undefined}
          onDetail={openDetail}
          onDelete={canManageSpk ? handleDelete : undefined}
          alwaysShowActions
          onRowClick={setHistoriKasbonSpk}
        />
      )}
      {(isAdminRole ? fetchingAdminSpk : fetchingSpk) && (isAdminRole ? adminSpkResponse : spkResponse) && (
        <p className="text-center text-xs text-slate-400 -mt-1 pb-2">Memuat ulang data...</p>
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

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailItem(null); }}
        title="Detail SPK"
        size="lg"
      >
        {detailItem && (
          <div className="space-y-4 max-h-[min(74vh,660px)] overflow-y-auto pr-1 -mr-1">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. SPK</p>
                <p className="font-mono font-black text-slate-900 text-sm tracking-tight" title={detailItem.noSpk}>
                  {formatShortNoSpk(detailItem.noSpk)}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mandor</p>
                <p className="font-bold text-slate-800">{detailItem.mandor.username}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${Number(detailItem.progress ?? 0) === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${Number(detailItem.progress ?? 0)}%` }}
                    />
                  </div>
                  <p className="font-black text-blue-700 shrink-0">{Number(detailItem.progress ?? 0)}%</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Kontrak</p>
                <p className="font-black text-emerald-700 text-sm">{formatRupiah(detailItem.nilaiKontrak)}</p>
              </div>
            </div>

            <CollapsibleDetailSection
              title="Informasi & Keuangan"
              subtitle={detailItem.judulPekerjaan}
            >
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Judul pekerjaan</dt>
                  <dd className="text-slate-800 font-semibold leading-relaxed">{detailItem.judulPekerjaan}</dd>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal SPK</dt>
                  <dd className="text-slate-800 font-medium">{formatDate(detailItem.tanggalSpk)}</dd>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jatuh tempo</dt>
                  <dd className="text-slate-800 font-medium">
                    {detailItem.jatuhTempo ? formatDate(detailItem.jatuhTempo) : <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <dt className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Sudah dibayar</dt>
                  <dd className="font-black text-emerald-700">
                    {detailItem.nilaiSudahDibayarkan == null
                      ? <span className="text-slate-300 font-medium">—</span>
                      : formatRupiah(detailItem.nilaiSudahDibayarkan)}
                  </dd>
                </div>
                <div className={`p-3 rounded-xl border ${detailItem.sisaNilaiKontrak != null && detailItem.sisaNilaiKontrak > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                  <dt className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${detailItem.sisaNilaiKontrak != null && detailItem.sisaNilaiKontrak > 0 ? 'text-red-500' : 'text-slate-400'}`}>Sisa nilai</dt>
                  <dd className={`font-black ${detailItem.sisaNilaiKontrak != null && detailItem.sisaNilaiKontrak > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {detailItem.sisaNilaiKontrak == null
                      ? <span className="text-slate-300 font-medium">—</span>
                      : formatRupiah(detailItem.sisaNilaiKontrak)}
                  </dd>
                </div>
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">KSO (Rek PT)</dt>
                  <dd className="text-slate-800 font-medium">
                    {detailItem.bankRekeningPtId
                      ? bankLabelById.get(detailItem.bankRekeningPtId) ??
                        `ID ${detailItem.bankRekeningPtId}`
                      : <span className="text-slate-300">—</span>}
                  </dd>
                </div>
              </dl>
            </CollapsibleDetailSection>

            <CollapsibleDetailSection
              title="Progress & Dokumen"
              subtitle={`Progress ${Number(detailItem.progress ?? 0)}%`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-[200px] bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${detailItem.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                      style={{ width: `${Number(detailItem.progress ?? 0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-blue-800">
                    {Number(detailItem.progress ?? 0)}%
                  </span>
                </div>
                {canEditSpkProgress && (
                  <div className="flex items-center gap-2 flex-wrap p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Override %</span>
                    <div className="flex items-center gap-1.5">
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
                        className="w-14 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-black focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400"
                      />
                      <span className="text-[10px] font-bold text-slate-400">%</span>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-[10px] font-bold rounded bg-blue-600 text-white hover:bg-blue-700"
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
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Dokumen SPK</p>
                  {detailItem.fileSpk ? (
                    <a
                      href={detailItem.fileSpk}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <FileText size={14} />
                      Buka PDF
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada dokumen</span>
                  )}
                </div>
              </div>
            </CollapsibleDetailSection>

            {detailItem.kavlingItems.length > 0 && (
              <CollapsibleDetailSection
                title="Kavling SPK"
                subtitle={`${detailItem.kavlingItems.length} unit`}
                badge={
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {detailItem.kavlingItems.length}
                  </span>
                }
              >
                <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                  <table className="w-full text-xs border-collapse min-w-[280px]">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr>
                        <th className={detailThClass}>Blok</th>
                        <th className={detailThClass}>Unit</th>
                        <th className={detailThClass}>LT</th>
                        <th className={detailThClass}>LB</th>
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
                            <td className={detailTdClass}>{k.luasTanah ?? 0}</td>
                            <td className={detailTdClass}>{k.luasBangunan ?? 0}</td>
                            <td className={detailTdClass}>{k.customerNama || '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleDetailSection>
            )}

            {detailItem.notesPekerjaan && (
              <CollapsibleDetailSection title="Catatan Pekerjaan">
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {detailItem.notesPekerjaan}
                </p>
              </CollapsibleDetailSection>
            )}

            <CollapsibleDetailSection
              title="Pengajuan Pembayaran"
              subtitle="Termin, kasbon, upah"
              defaultOpen
            >
              <SpkPembayaranPanel
                spk={detailItem}
                canAjukan={canAjukanPembayaranFor(detailItem)}
              />
            </CollapsibleDetailSection>
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm min-h-[80px] text-black focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all resize-none"
                  placeholder="Catatan tambahan pekerjaan..."
                />
              </div>
              {editingId && (
                <div className="md:col-span-2 flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                  <span className="mt-0.5 shrink-0 w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-black leading-none">i</span>
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
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={kavlingPickerSearch}
                onChange={(e) => setKavlingPickerSearch(e.target.value)}
                placeholder="Cari blok, unit, LT/LB, atau customer..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400"
              />
            </div>
            {errors.kavlingIds && (
              <p className="text-xs font-semibold text-red-600 mb-3 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                {errors.kavlingIds}
              </p>
            )}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 shadow-inner">

              {filteredKavlingBlokGroups.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 italic text-center">
                  {kavlingBlokGroups.length === 0
                    ? 'Belum ada data kavling.'
                    : 'Tidak ada kavling yang cocok dengan pencarian.'}
                </p>
              ) : (
                filteredKavlingBlokGroups.map((group) => {
                  const blokState = getBlokSelectionState(group.units, formData.kavlingIds);
                  const selectableIds = getSelectableUnitIds(group.units);
                  const selectedInBlok = selectableIds.filter((id) =>
                    formData.kavlingIds.includes(id),
                  ).length;
                  const isExpanded = expandedBloks.has(group.blok);
                  const blokCheckboxDisabled = selectableIds.length === 0;
                  return (
                    <div key={group.blok}>
                      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 sticky top-0 z-10 border-b border-slate-100">

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
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 shrink-0 mt-0.5 disabled:cursor-not-allowed"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-bold min-w-[72px] ${k.disabled ? 'text-slate-400' : 'text-slate-800'}`}>
                                  Unit {k.nomorUnit}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  LT {k.luasTanah} · LB {k.luasBangunan}
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
                      className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1 hover:underline"
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
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-blue-200 hover:shadow-md active:scale-95"
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