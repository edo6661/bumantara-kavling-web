import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLoader from '../PageLoader';
import Modal from '../../components/shared/Modal';
import PasteUploadBanner from '../../components/shared/PasteUploadBanner';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../../components/shared/BuktiFileThumbnail';
import SpkPembayaranDokumenCell from '../../components/proyek/SpkPembayaranDokumenCell';
import {
  getFilesFromClipboard,
  isUploadableFile,
  PASTE_UPLOAD_ROW_CLASS,
} from '../../utils/clipboardFilePaste';
import { formatDate, formatTanpaDesimal } from '../../utils/formatters';
import {
  Clock,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  UploadCloud,
  FileText,
  FileDown,
  Landmark,
  Undo2,
  X,
} from 'lucide-react';
import BsiBatchPaymentPreviewModal from '../../components/finance/BsiBatchPaymentPreviewModal';
import {
  BSI_DEFAULT_SOURCE_ACCOUNT,
  buildBsiBatchRows,
  createDefaultBsiBatchHeader,
  type BsiBatchHeader,
  type BsiBatchPaymentRow,
} from '../../utils/bsiBatchPayment';
import {
  useAddBuktiSpkPembayaran,
  useBayarSpkPembayaran,
  useGetSpkPembayaranList,
  useRemoveBuktiSpkPembayaran,
  useSetBsiCmsDilaporkan,
} from '../../hooks/queries/useSpkPembayaran';
import { handleApiError } from '../../utils/errorHandler';
import {
  SPK_KASBON_TARGET_LABEL,
  SPK_PEMBAYARAN_JENIS_LABEL,
  JENIS_UI_COLOR,
  type SpkPembayaranJenis,
} from '../../utils/spkPembayaran';
import {
  formatMandorRekeningLabel,
  resolveSpkPembayaranTransferRekening,
} from '../../utils/mandorRekening';
import { formatShortNoSpk } from '../../utils/spk';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';

interface SpkGroup {
  spkId: number;
  noSpk: string;
  mandorUsername: string;
  mandorNamaBank: string | null;
  mandorNoRekening: string | null;
  mandorAtasNamaRekening: string | null;
  ksoFull: string | null;
  nilaiKontrak: number;
  items: SpkPembayaranData[];
  menungguCount: number;
}

type UploadMode = 'bayar' | 'add-bukti';

type PasteSelection = {
  row: SpkPembayaranData;
  mode: UploadMode;
};

const thParentClass =
  'px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 whitespace-nowrap';
const tdParentClass = 'px-4 py-3 text-sm text-slate-800 align-middle border-b border-slate-100';

const getItemLabel = (row: SpkPembayaranData) => {
  if (row.jenis === 'KASBON') {
    const target = row.mengurangiTermin
      ? ` → ${SPK_KASBON_TARGET_LABEL[row.mengurangiTermin]}`
      : '';
    const itemCount = row.kasbonBaris?.length ?? 0;
    if (itemCount > 0) {
      return `Kasbon ${itemCount} item${target}`;
    }
    return `${row.keterangan ?? 'Kasbon'}${target}`;
  }
  if (row.jenis === 'UPAH') {
    const target = row.mengurangiTermin
      ? ` → ${SPK_KASBON_TARGET_LABEL[row.mengurangiTermin]}`
      : '';
    const periode =
      row.tanggalDari && row.tanggalSampai
        ? ` · ${formatDate(row.tanggalDari)}–${formatDate(row.tanggalSampai)}`
        : '';
    const tukangCount = row.upahBaris?.length ?? 0;
    return `Upah ${tukangCount} tukang${periode}${target}`;
  }
  return SPK_PEMBAYARAN_JENIS_LABEL[row.jenis];
};

const formatKsoShortLabel = (atasNama: string) =>
  atasNama.trim().split(/\s+/).pop() ?? atasNama;

const getPengajuanTimestamp = (row: SpkPembayaranData) =>
  new Date(row.createdAt).getTime();

const rekeningSignature = (row: SpkPembayaranData) => {
  const rek = resolveSpkPembayaranTransferRekening(row);
  if (!rek) return '';
  return `${rek.namaBank}|${rek.noRekening}|${rek.atasNamaRekening}`;
};

const tdRekeningClass = 'px-4 text-xs text-slate-600 align-top min-w-0 max-w-0';

const RekeningCell = ({
  namaBank,
  noRekening,
  atasNamaRekening,
  title,
}: {
  namaBank: string | null;
  noRekening: string | null;
  atasNamaRekening?: string | null;
  title?: string;
}) => {
  if (!namaBank && !noRekening) {
    return <span className="text-slate-400">—</span>;
  }

  const fullTitle =
    title ??
    [namaBank, noRekening, atasNamaRekening ? `a/n ${atasNamaRekening}` : null]
      .filter(Boolean)
      .join(' · ');

  return (
    <div className="min-w-0 space-y-0.5" title={fullTitle}>
      {namaBank && <p className="font-medium text-slate-700 leading-snug break-words">{namaBank}</p>}
      {noRekening && (
        <p className="font-mono text-[11px] text-slate-600 leading-snug break-all">{noRekening}</p>
      )}
      {atasNamaRekening && (
        <p className="text-[10px] text-slate-500 leading-snug break-words">a/n {atasNamaRekening}</p>
      )}
    </div>
  );
};

const renderTransferRekeningCell = (row: SpkPembayaranData) => {
  const rek = resolveSpkPembayaranTransferRekening(row);
  if (!rek?.noRekening && !rek?.namaBank) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <RekeningCell
      namaBank={rek.namaBank ?? null}
      noRekening={rek.noRekening ?? null}
      atasNamaRekening={rek.atasNamaRekening}
      title={formatMandorRekeningLabel(rek)}
    />
  );
};

const BayarSpkPembayaran = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<SpkPembayaranData | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('bayar');
  const [pasteSelection, setPasteSelection] = useState<PasteSelection | null>(null);
  const [filePreview, setFilePreview] = useState<{ url: string; title: string } | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [expandedSpkIds, setExpandedSpkIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bsiPreviewOpen, setBsiPreviewOpen] = useState(false);
  const [bsiPreviewRows, setBsiPreviewRows] = useState<BsiBatchPaymentRow[]>([]);
  const [bsiPreviewHeader, setBsiPreviewHeader] = useState<BsiBatchHeader>(
    createDefaultBsiBatchHeader(),
  );

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const limit = 200;

  const { data: response, isLoading } = useGetSpkPembayaranList({
    page,
    limit,
    search: search || undefined,
    status: statusFilter === 'ALL' ? 'ALL' : (statusFilter as 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR'),
  });

  const items = useMemo(
    () =>
      (response?.items ?? []).filter(
        (row) => row.status !== 'DRAFT' && row.status !== 'MENUNGGU_PERSETUJUAN',
      ),
    [response?.items],
  );
  const meta = response?.meta;
  const bayarMutation = useBayarSpkPembayaran();
  const addBuktiMutation = useAddBuktiSpkPembayaran();
  const removeBuktiMutation = useRemoveBuktiSpkPembayaran();
  const bsiCmsMutation = useSetBsiCmsDilaporkan();

  const spkGroups = useMemo((): SpkGroup[] => {
    const map = new Map<number, SpkGroup>();
    for (const row of items) {
      const existing = map.get(row.spkId);
      if (existing) {
        existing.items.push(row);
        if (row.status === 'MENUNGGU_PEMBAYARAN') existing.menungguCount += 1;
      } else {
        const firstRek = resolveSpkPembayaranTransferRekening(row);
        map.set(row.spkId, {
          spkId: row.spkId,
          noSpk: row.spk?.noSpk ?? `#${row.spkId}`,
          mandorUsername: row.spk?.mandor?.username ?? '-',
          mandorNamaBank: firstRek?.namaBank ?? row.spk?.mandor?.namaBank ?? null,
          mandorNoRekening: firstRek?.noRekening ?? row.spk?.mandor?.noRekening ?? null,
          mandorAtasNamaRekening:
            firstRek?.atasNamaRekening ?? row.spk?.mandor?.atasNamaRekening ?? null,
          ksoFull: row.spk?.bankRekeningPt?.atasNama ?? null,
          nilaiKontrak: row.spk?.nilaiKontrak ?? 0,
          items: [row],
          menungguCount: row.status === 'MENUNGGU_PEMBAYARAN' ? 1 : 0,
        });
      }
    }
    for (const group of map.values()) {
      const signatures = new Set(group.items.map(rekeningSignature).filter(Boolean));
      if (signatures.size > 1) {
        group.mandorNamaBank = null;
        group.mandorNoRekening = null;
        group.mandorAtasNamaRekening = null;
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const aLatest = Math.max(...a.items.map(getPengajuanTimestamp));
      const bLatest = Math.max(...b.items.map(getPengajuanTimestamp));
      return bLatest - aLatest || a.noSpk.localeCompare(b.noSpk);
    });
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((row) => selectedIds.has(row.id)),
    [items, selectedIds],
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (groupItems: SpkPembayaranData[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const row of groupItems) {
        if (row.status === 'DRAFT') continue;
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedBsiReportedCount = useMemo(
    () => selectedItems.filter((row) => row.bsiCmsDilaporkan).length,
    [selectedItems],
  );

  const handleMarkBsiCmsDilaporkan = async (ids: number[]) => {
    if (ids.length === 0) return;
    try {
      await bsiCmsMutation.mutateAsync({ ids, dilaporkan: true });
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  const handleUnmarkBsiCmsDilaporkan = async () => {
    const ids = selectedItems.filter((row) => row.bsiCmsDilaporkan).map((row) => row.id);
    if (ids.length === 0) return;
    try {
      await bsiCmsMutation.mutateAsync({ ids, dilaporkan: false });
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  const openBsiBatchPreview = () => {
    if (selectedItems.length === 0) return;
    const rows = buildBsiBatchRows(selectedItems, {
      sourceAcct: BSI_DEFAULT_SOURCE_ACCOUNT,
    });
    setBsiPreviewRows(rows);
    setBsiPreviewHeader(createDefaultBsiBatchHeader());
    setBsiPreviewOpen(true);
  };

  const toggleExpand = (spkId: number) => {
    setExpandedSpkIds((prev) => {
      const next = new Set(prev);
      if (next.has(spkId)) next.delete(spkId);
      else next.add(spkId);
      return next;
    });
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

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      prev.set('status', e.target.value);
      prev.set('page', '1');
      return prev;
    });
  };

  const selectItemForPaste = (row: SpkPembayaranData, mode: UploadMode) => {
    if (row.status === 'DRAFT') return;
    if (mode === 'bayar' && row.status !== 'MENUNGGU_PEMBAYARAN') return;
    if (mode === 'add-bukti' && row.status !== 'SUDAH_DIBAYAR') return;
    setPasteSelection((prev) =>
      prev?.row.id === row.id && prev.mode === mode ? null : { row, mode },
    );
  };

  const processUploadFiles = useCallback(
    async (
      row: SpkPembayaranData,
      mode: UploadMode,
      files: File[],
    ): Promise<boolean> => {
      const validFiles = files.filter(isUploadableFile);
      if (!validFiles.length) {
        alert('Semua file harus berupa gambar atau PDF.');
        return false;
      }

      try {
        if (mode === 'add-bukti') {
          await addBuktiMutation.mutateAsync({ id: row.id, files: validFiles });
          alert('Bukti pembayaran berhasil ditambahkan.');
        } else {
          await bayarMutation.mutateAsync({ id: row.id, files: validFiles });
          alert('Pembayaran SPK berhasil diproses.');
        }
        return true;
      } catch (error) {
        alert(handleApiError(error).message);
        return false;
      }
    },
    [addBuktiMutation, bayarMutation],
  );

  const handlePasteEvent = useCallback(
    (e: ClipboardEvent | React.ClipboardEvent) => {
      if (!pasteSelection) return;

      const files = getFilesFromClipboard(e).filter(isUploadableFile);
      if (!files.length) return;

      e.preventDefault();
      e.stopPropagation();

      void (async () => {
        const ok = await processUploadFiles(
          pasteSelection.row,
          pasteSelection.mode,
          files,
        );
        if (ok) setPasteSelection(null);
      })();
    },
    [pasteSelection, processUploadFiles],
  );

  useEffect(() => {
    if (!pasteSelection) return;
    document.addEventListener('paste', handlePasteEvent, true);
    return () => document.removeEventListener('paste', handlePasteEvent, true);
  }, [pasteSelection, handlePasteEvent]);

  const openUpload = (row: SpkPembayaranData, mode: UploadMode) => {
    if (row.status === 'DRAFT') {
      alert('Pengajuan masih draft dan belum diajukan oleh mandor.');
      return;
    }
    if (mode === 'bayar' && row.status !== 'MENUNGGU_PEMBAYARAN') {
      alert('Hanya pengajuan yang menunggu pembayaran yang dapat diproses.');
      return;
    }
    selectItemForPaste(row, mode);
    setUploadMode(mode);
    setUploadTarget(row);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length || !uploadTarget) return;

    const ok = await processUploadFiles(uploadTarget, uploadMode, files);
    if (ok) setPasteSelection(null);
    setUploadTarget(null);
    setUploadMode('bayar');
  };

  const handleRemoveBukti = async (row: SpkPembayaranData, buktiUrl: string) => {
    const buktiList =
      row.buktiPembayaranList && row.buktiPembayaranList.length > 0
        ? row.buktiPembayaranList
        : row.buktiPembayaran
          ? [row.buktiPembayaran]
          : [];
    if (buktiList.length <= 1) {
      alert('Minimal harus tersisa 1 bukti pembayaran.');
      return;
    }

    const confirmed = window.confirm('Hapus bukti pembayaran ini?');
    if (!confirmed) return;
    try {
      await removeBuktiMutation.mutateAsync({ id: row.id, buktiUrl });
      alert('Bukti pembayaran berhasil dihapus.');
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  const renderItemRow = (row: SpkPembayaranData) => {
    const colors = JENIS_UI_COLOR[row.jenis];
    const isDraft = row.status === 'DRAFT';
    const paid = row.status === 'SUDAH_DIBAYAR';
    const canPay = row.status === 'MENUNGGU_PEMBAYARAN';
    const checked = selectedIds.has(row.id);
    const buktiList =
      row.buktiPembayaranList && row.buktiPembayaranList.length > 0
        ? row.buktiPembayaranList
        : row.buktiPembayaran
          ? [row.buktiPembayaran]
          : [];
    const isPasteSelected = pasteSelection?.row.id === row.id;
    const pasteMode = canPay ? 'bayar' : paid ? 'add-bukti' : null;

    return (
      <tr
        key={row.id}
        onClick={() => {
          if (pasteMode) selectItemForPaste(row, pasteMode);
        }}
        className={`border-t border-slate-100 ${colors.row} ${row.bsiCmsDilaporkan ? 'ring-1 ring-inset ring-sky-200' : ''} ${pasteMode ? 'cursor-pointer' : ''} ${isPasteSelected ? PASTE_UPLOAD_ROW_CLASS : ''}`}
      >
        <td className="px-4 py-2.5 w-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={checked}
            disabled={isDraft}
            onChange={() => toggleSelect(row.id)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
            aria-label={`Pilih pembayaran ${getItemLabel(row)}`}
          />
        </td>
        <td className="px-4 py-2.5">
          <div className="flex flex-col gap-0.5" title={getItemLabel(row)}>
            <span
              className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded border w-fit ${colors.badge}`}
            >
              {SPK_PEMBAYARAN_JENIS_LABEL[row.jenis]}
            </span>
            {(row.jenis === 'KASBON' || row.jenis === 'UPAH') && (
              <span className="text-[10px] text-slate-500 leading-tight max-w-[180px]">
                {getItemLabel(row)}
              </span>
            )}
          </div>
        </td>
        <td className={`px-4 py-2.5 text-sm font-bold ${colors.text} whitespace-nowrap`}>
          {formatTanpaDesimal(row.nominal)}
        </td>
        <td className={`${tdRekeningClass} py-2.5`}>{renderTransferRekeningCell(row)}</td>
        <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(row.createdAt)}</td>
        <td className="px-4 py-2.5">
          <div className="flex flex-col gap-1">
            {isDraft ? (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-100 text-slate-700 rounded w-fit">
                Draft
              </span>
            ) : paid ? (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-green-100 text-green-700 rounded w-fit">
                <CheckCircle2 size={10} /> Terbayar
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-yellow-100 text-yellow-700 rounded w-fit">
                <Clock size={10} /> Menunggu
              </span>
            )}
            {row.bsiCmsDilaporkan && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-sky-100 text-sky-800 rounded w-fit"
                title={
                  row.bsiCmsDilaporkanAt
                    ? `Dilaporkan BSI CMS: ${formatDate(row.bsiCmsDilaporkanAt)}`
                    : 'Sudah dilaporkan di BSI CMS'
                }
              >
                <Landmark size={10} /> BSI CMS
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
          <SpkPembayaranDokumenCell
            row={row}
            onPreview={(item) =>
              setFilePreview({ url: item.url, title: `Dokumen Pengajuan — ${item.label}` })
            }
          />
        </td>
        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
          {buktiList.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {buktiList.slice(0, 3).map((url, index) => {
                return (
                  <div key={`${row.id}-${url}-${index}`} className="relative">
                    <BuktiFileThumbnail
                      url={url}
                      onClick={() =>
                        setFilePreview({ url, title: 'Bukti Pembayaran SPK' })
                      }
                      className="w-12 h-8"
                    />
                    {paid && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleRemoveBukti(row, url);
                        }}
                        disabled={removeBuktiMutation.isPending || buktiList.length <= 1}
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        title="Hapus bukti"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
              {buktiList.length > 3 && (
                <span className="text-[10px] font-bold text-slate-500">+{buktiList.length - 3}</span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          )}
        </td>
        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
          {canPay && (
            <button
              type="button"
              title="Bayar"
              onClick={() => openUpload(row, 'bayar')}
              disabled={bayarMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase bg-slate-900 text-white rounded-lg hover:bg-black disabled:opacity-50 whitespace-nowrap"
            >
              <UploadCloud size={11} />
            </button>
          )}
          {paid && (
            <button
              type="button"
              title="Tambah Bukti"
              onClick={() => openUpload(row, 'add-bukti')}
              disabled={addBuktiMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              <UploadCloud size={11} />
              
            </button>
          )}
        </td>
      </tr>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase">
        {(Object.keys(JENIS_UI_COLOR) as SpkPembayaranJenis[]).map((jenis) => (
          <span
            key={jenis}
            className={`inline-flex px-2 py-1 rounded border ${JENIS_UI_COLOR[jenis].badge}`}
          >
            {jenis === 'KASBON' ? 'Kasbon' : jenis.replace('_', ' ')}
          </span>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter size={16} /> Filter
          </span>
          {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isFilterExpanded && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="ALL">Semua</option>
                <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
                <option value="SUDAH_DIBAYAR">Sudah Dibayar</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Cari SPK / Mandor</label>
              <input
                type="text"
                defaultValue={search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchChange((e.target as HTMLInputElement).value);
                }}
                placeholder="Tekan Enter untuk cari..."
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-blue-900 text-white rounded-xl shadow-lg">
          <span className="text-sm font-semibold">
            {selectedIds.size} pembayaran dipilih
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 text-[10px] font-bold uppercase border border-white/30 rounded-lg hover:bg-white/10"
            >
              Hapus pilihan
            </button>
            {selectedBsiReportedCount > 0 && (
              <button
                type="button"
                onClick={handleUnmarkBsiCmsDilaporkan}
                disabled={bsiCmsMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase border border-white/30 rounded-lg hover:bg-white/10 disabled:opacity-50"
              >
                <Undo2 size={14} />
                Batalkan lapor BSI CMS
                {selectedBsiReportedCount < selectedIds.size
                  ? ` (${selectedBsiReportedCount})`
                  : ''}
              </button>
            )}
            <button
              type="button"
              onClick={openBsiBatchPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-white text-blue-900 rounded-lg hover:bg-blue-50"
            >
              <FileDown size={14} />
              Convert to BSI Batch Payment
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Pembayaran SPK</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik baris SPK untuk detail termin. Klik baris pembayaran (menunggu/terbayar) lalu
            Ctrl+V untuk paste bukti. Centang baris untuk generate file batch BSI.
          </p>
        </div>

        {pasteSelection && (
          <div className="px-5 pb-4">
            <PasteUploadBanner
              label={`${formatShortNoSpk(pasteSelection.row.spk?.noSpk ?? `#${pasteSelection.row.spkId}`)} · ${getItemLabel(pasteSelection.row)} · ${formatTanpaDesimal(pasteSelection.row.nominal)}${pasteSelection.mode === 'add-bukti' ? ' (tambah bukti)' : ''}`}
              onClear={() => setPasteSelection(null)}
            />
          </div>
        )}

        {spkGroups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Tidak ada data pembayaran.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={`${thParentClass} w-10`} aria-label="Buka detail" />
                  <th className={thParentClass}>No. SPK</th>
                  <th className={thParentClass}>Rekening Mandor</th>
                  <th className={thParentClass}>Mandor</th>
                  <th className={thParentClass}>KSO</th>
                  <th className={thParentClass}>Nilai Kontrak</th>
                  <th className={`${thParentClass} text-center`}>Menunggu Bayar</th>
                  <th className={`${thParentClass} text-center`}>Total Item</th>
                </tr>
              </thead>
              <tbody>
                {spkGroups.map((group) => {
                  const expanded = expandedSpkIds.has(group.spkId);
                  const groupAllSelected =
                    group.items.length > 0 &&
                    group.items.every((item) => selectedIds.has(item.id));
                  const groupSomeSelected =
                    !groupAllSelected &&
                    group.items.some((item) => selectedIds.has(item.id));
                  return (
                    <Fragment key={group.spkId}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          expanded ? 'bg-blue-50/80' : 'bg-white hover:bg-slate-50'
                        }`}
                        onClick={() => toggleExpand(group.spkId)}
                      >
                        <td className={tdParentClass}>
                          <ChevronRight
                            size={18}
                            className={`text-slate-400 transition-transform ${expanded ? 'rotate-90 text-blue-600' : ''}`}
                          />
                        </td>
                        <td
                          className={`${tdParentClass} font-mono font-bold text-slate-900 align-top`}
                          title={group.noSpk}
                        >
                          {formatShortNoSpk(group.noSpk)}
                        </td>
                        <td className={`${tdRekeningClass} py-3`}>
                          {group.mandorNamaBank || group.mandorNoRekening ? (
                            <RekeningCell
                              namaBank={group.mandorNamaBank}
                              noRekening={group.mandorNoRekening}
                              atasNamaRekening={group.mandorAtasNamaRekening}
                            />
                          ) : group.items.some((item) => rekeningSignature(item)) ? (
                            <span className="text-[10px] font-semibold text-amber-700 leading-snug">
                              Beragam per pengajuan
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className={`${tdParentClass} font-medium text-slate-700 whitespace-nowrap`}>
                          {group.mandorUsername}
                        </td>
                        <td
                          className={`${tdParentClass} text-xs font-medium text-slate-700 whitespace-nowrap`}
                          title={group.ksoFull ?? undefined}
                        >
                          {group.ksoFull ? (
                            formatKsoShortLabel(group.ksoFull)
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className={`${tdParentClass} font-bold text-slate-900 whitespace-nowrap`}>
                          {formatTanpaDesimal(group.nilaiKontrak)}
                        </td>
                        <td className={`${tdParentClass} text-center`}>
                          {group.menungguCount > 0 ? (
                            <span className="inline-flex px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded-md">
                              {group.menungguCount}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className={`${tdParentClass} text-center text-xs font-semibold text-slate-600`}>
                          {group.items.length}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={8} className="px-4 py-3 border-b border-slate-200">
                            <p
                              className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide"
                              title={group.noSpk}
                            >
                              Detail pembayaran — {formatShortNoSpk(group.noSpk)}
                            </p>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="w-full min-w-[720px] table-fixed">
                                <colgroup>
                                  <col className="w-10" />
                                  <col className="w-[16%]" />
                                  <col className="w-[11%]" />
                                  <col className="w-[18%]" />
                                  <col className="w-[11%]" />
                                  <col className="w-[11%]" />
                                  <col className="w-[14%]" />
                                  <col className="w-[10%]" />
                                  <col className="w-[9%]" />
                                </colgroup>
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                                    <th className="px-4 py-2 w-10" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={groupAllSelected}
                                        ref={(el) => {
                                          if (el) el.indeterminate = groupSomeSelected;
                                        }}
                                        onChange={(e) =>
                                          toggleSelectGroup(group.items, e.target.checked)
                                        }
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        aria-label={`Pilih semua pembayaran ${formatShortNoSpk(group.noSpk)}`}
                                      />
                                    </th>
                                    <th className="px-4 py-2 text-left">Jenis</th>
                                    <th className="px-4 py-2 text-left">Nominal</th>
                                    <th className="px-4 py-2 text-left">Rekening Tujuan</th>
                                    <th className="px-4 py-2 text-left">Tanggal Diajukan</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Dok. Pengajuan</th>
                                    <th className="px-4 py-2 text-left">Bukti Bayar</th>
                                    <th className="px-4 py-2 text-left">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.items
                                    .sort(
                                      (a, b) =>
                                        getPengajuanTimestamp(b) - getPengajuanTimestamp(a) ||
                                        b.id - a.id,
                                    )
                                    .map(renderItemRow)}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <button
              type="button"
              disabled={!meta.hasPrevPage}
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="text-xs text-slate-500">
              Halaman {meta.page} / {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={!meta.hasNextPage}
              onClick={() => handlePageChange(page + 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>

      <BsiBatchPaymentPreviewModal
        isOpen={bsiPreviewOpen}
        initialRows={bsiPreviewRows}
        initialHeader={bsiPreviewHeader}
        onClose={() => setBsiPreviewOpen(false)}
        onGenerated={handleMarkBsiCmsDilaporkan}
      />

      <Modal
        isOpen={!!filePreview}
        onClose={() => setFilePreview(null)}
        title={filePreview?.title ?? 'Preview Dokumen'}
        size="lg"
      >
        {filePreview && (
          <div className="flex justify-center">
            {isBuktiPdfUrl(filePreview.url) ? (
              <a
                href={filePreview.url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 text-red-600 font-bold"
              >
                <FileText size={48} />
                Buka PDF
              </a>
            ) : (
              <img src={filePreview.url} alt={filePreview.title} className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BayarSpkPembayaran;
