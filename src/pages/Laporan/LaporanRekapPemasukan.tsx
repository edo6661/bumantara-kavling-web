import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  Landmark,
  Search,
  Wallet,
} from 'lucide-react';
import { useGetRekapPemasukanReport } from '../../hooks/queries/useRekapPemasukanReport';
import type {
  PemasukanTerbayarDetail,
  RekapPemasukanDetailItem,
  RekapPemasukanKategori,
  RekapPemasukanKategoriKey,
  RekapPemasukanTerbayarDetail,
} from '../../services/report.service';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import PembayaranTerbayarModal from '../../components/laporan/PembayaranTerbayarModal';
import { formatRupiah, formatTanpaDesimal } from '../../utils/formatters';
import { useDefaultPerumahanId } from '../../hooks/useDefaultPerumahanId';
import CustomerNameActionTd from '../../components/laporan/CustomerNameActionTd';

const CARA_BAYAR_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'CASH_KERAS', label: 'Cash Keras' },
  { value: 'CASH_BERTAHAP', label: 'Cash Bertahap' },
  { value: 'KPR', label: 'KPR' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

const TABLE_COLUMN_KEYS = [
  'bookingFee',
  'dp',
  'cicilanCashBertahap',
  'cicilanDp',
  'cicilanRumah',
  'dpKpr',
  'cicilanKpr',
] as const;

type TableColumnKey = (typeof TABLE_COLUMN_KEYS)[number];

const TABLE_COLUMN_LABELS: Record<TableColumnKey, string> = {
  bookingFee: 'Booking',
  dp: 'DP',
  cicilanCashBertahap: 'Cic. Cash',
  cicilanDp: 'Cic. DP',
  cicilanRumah: 'Cic. Rumah',
  dpKpr: 'DP KPR',
  cicilanKpr: 'Penc. KPR',
};

function getRowTerbayarByColumn(
  row: RekapPemasukanDetailItem,
  column: TableColumnKey,
): PemasukanTerbayarDetail[] {
  return row.terbayar?.[column] ?? [];
}

function getAllRowTerbayar(row: RekapPemasukanDetailItem): PemasukanTerbayarDetail[] {
  if (!row.terbayar) return [];
  const all = TABLE_COLUMN_KEYS.flatMap((key) => row.terbayar[key]);
  const seen = new Set<number>();
  return all.filter((item) => {
    if (seen.has(item.tagihanId)) return false;
    seen.add(item.tagihanId);
    return true;
  });
}

function resolveKategoriKey(itemKey: string): RekapPemasukanKategoriKey | null {
  const valid: RekapPemasukanKategoriKey[] = [
    'bookingFee',
    'dp',
    'cicilanDp',
    'pencairanKpr',
    'cicilanCashBertahap',
    'dpKpr',
    'cicilanRumah',
    'dpCashBertahap',
  ];
  return valid.includes(itemKey as RekapPemasukanKategoriKey)
    ? (itemKey as RekapPemasukanKategoriKey)
    : null;
}
function normalizeRingkasan(
  ringkasan: RekapPemasukanKategori[],
  kprCicilan: RekapPemasukanKategori,
): RekapPemasukanKategori[] {
  return ringkasan.map((item) =>
    item.key === 'pencairanKpr'
      ? {
          ...kprCicilan,
          key: 'pencairanKpr',
          label: 'Pencairan KPR',
          calculable: true,
          note: undefined,
        }
      : item,
  );
}

function getRowSchemeClass(caraPembayaran: string | null | undefined): string {
  if (caraPembayaran === 'KPR') return 'bg-pink-100/90 hover:bg-pink-100';
  if (caraPembayaran === 'CASH_BERTAHAP') return 'bg-purple-100/90 hover:bg-purple-100';
  return 'hover:bg-slate-50/60';
}

function KategoriValue({ item }: { item: RekapPemasukanKategori }) {
  if (!item.calculable) {
    return (
      <div className="flex items-start gap-1.5">
        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-slate-400 italic">Belum dihitung</p>
          {item.note && (
            <p className="text-[10px] text-amber-600/90 mt-0.5 leading-snug">{item.note}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <p className="text-[15px] font-black text-emerald-700 tabular-nums text-right">
      {formatRupiah(item.terbayar ?? 0)}
    </p>
  );
}

function SkemaTable({
  title,
  accentClass,
  items,
  onItemClick,
  defaultOpen = false,
}: {
  title: string;
  accentClass: string;
  items: RekapPemasukanKategori[];
  onItemClick?: (item: RekapPemasukanKategori) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const calculableTotal = items.reduce(
    (sum, item) => sum + (item.calculable ? (item.terbayar ?? 0) : 0),
    0,
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`h-1 ${accentClass}`} />
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 text-left hover:bg-slate-50/60 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="min-w-0">
          <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wide">
            {title}
          </h3>
          {!isOpen && calculableTotal > 0 && (
            <p className="text-[11px] font-semibold text-emerald-700 tabular-nums mt-0.5">
              {formatRupiah(calculableTotal)}
            </p>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="py-2 px-5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                Kategori
              </th>
              <th className="py-2 px-5 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                Terbayar
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const clickable =
                !!onItemClick && item.calculable && (item.terbayar ?? 0) > 0;
              return (
                <tr
                  key={item.key}
                  onClick={clickable ? () => onItemClick(item) : undefined}
                  className={`border-b border-slate-50 last:border-b-0 ${
                    clickable ? 'cursor-pointer hover:bg-slate-50/80' : ''
                  }`}
                  title={clickable ? 'Klik untuk lihat detail pembayaran' : undefined}
                >
                  <td className="py-2.5 px-5">
                    <p className="font-bold text-slate-700">{item.label}</p>
                    {!item.calculable && item.note && (
                      <p className="text-[10px] text-amber-600/90 mt-0.5">{item.note}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-5">
                    <KategoriValue item={item} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ClickableAmountTd({
  amount,
  details,
  onOpen,
  className = '',
}: {
  amount: number;
  details: PemasukanTerbayarDetail[];
  onOpen: () => void;
  className?: string;
}) {
  const clickable = amount > 0 && details.length > 0;

  return (
    <td
      className={`py-2.5 px-3 text-right tabular-nums text-slate-700 ${className} ${
        clickable ? 'cursor-pointer hover:bg-slate-100/80 active:bg-slate-100' : ''
      }`}
      onClick={clickable ? onOpen : undefined}
      title={clickable ? 'Klik untuk lihat detail pembayaran' : undefined}
    >
      {amount > 0 ? (
        <span className={clickable ? 'font-semibold text-emerald-700 hover:underline' : ''}>
          {formatTanpaDesimal(amount)}
        </span>
      ) : (
        <span className="text-slate-400 text-[11px]">-</span>
      )}
    </td>
  );
}

function ClickableBookingTd({
  amount,
  details,
  onOpen,
}: {
  amount: number;
  details: PemasukanTerbayarDetail[];
  onOpen: () => void;
}) {
  const clickable = amount > 0 && details.length > 0;

  return (
    <td
      className={`py-2.5 px-3 text-center ${
        clickable ? 'cursor-pointer hover:bg-slate-100/80 active:bg-slate-100' : ''
      }`}
      onClick={clickable ? onOpen : undefined}
      title={clickable ? 'Klik untuk lihat detail pembayaran booking fee' : undefined}
    >
      {amount > 0 ? (
        <CheckCircle2
          size={18}
          className={`inline text-emerald-600 ${clickable ? 'hover:opacity-80' : ''}`}
          aria-label="Booking fee lunas"
        />
      ) : (
        <span className="text-slate-400 text-[11px]">-</span>
      )}
    </td>
  );
}

const LaporanRekapPemasukan = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;
  const caraPembayaran = searchParams.get('caraPembayaran') || '';
  const blok = searchParams.get('blok') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [filterDraft, setFilterDraft] = useState({
    caraPembayaran,
    blok,
    startDate,
    endDate,
  });
  const [searchInput, setSearchInput] = useState(search);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRingkasanOpen, setIsRingkasanOpen] = useState(false);
  const [isKategoriOpen, setIsKategoriOpen] = useState(false);
  const [isSkemaOpen, setIsSkemaOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState<
    (PemasukanTerbayarDetail | RekapPemasukanTerbayarDetail)[]
  >([]);
  const [modalContext, setModalContext] = useState<{
    customerNama?: string;
    kavlingLabel?: string;
    jenisPembayaran: string;
    showCustomerPerItem: boolean;
  } | null>(null);

  const handleCloseModal = () => {
    setModalDetails([]);
    setModalContext(null);
  };

  const handleOpenKategoriModal = (
    item: RekapPemasukanKategori,
    kategoriTerbayar: Partial<
      Record<RekapPemasukanKategoriKey, RekapPemasukanTerbayarDetail[]>
    >,
  ) => {
    if (!item.calculable || (item.terbayar ?? 0) <= 0) return;
    const key = resolveKategoriKey(item.key);
    if (!key) return;
    const details = kategoriTerbayar[key] ?? [];
    if (details.length === 0) return;
    setModalDetails(details);
    setModalContext({
      jenisPembayaran: item.label,
      showCustomerPerItem: true,
    });
  };

  const handleOpenRowModal = (
    row: RekapPemasukanDetailItem,
    column: TableColumnKey | 'total',
  ) => {
    const jenisPembayaran =
      column === 'total' ? 'Semua Pembayaran' : TABLE_COLUMN_LABELS[column];
    const details =
      column === 'total' ? getAllRowTerbayar(row) : getRowTerbayarByColumn(row, column);
    if (details.length === 0) return;
    setModalDetails(details);
    setModalContext({
      customerNama: row.customerNama,
      kavlingLabel: row.kavlingLabel,
      jenisPembayaran,
      showCustomerPerItem: false,
    });
  };

  useEffect(() => {
    setFilterDraft({ caraPembayaran, blok, startDate, endDate });
  }, [caraPembayaran, blok, startDate, endDate]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const next = searchInput.trim();
      if (next === search) return;
      setSearchParams((prev) => {
        if (next) prev.set('search', next);
        else prev.delete('search');
        prev.set('page', '1');
        return prev;
      });
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchInput, search, setSearchParams]);

  const { perumahanId: defaultPerumahanId, isLoading: loadingPerumahan } =
    useDefaultPerumahanId();

  const queryParams = useMemo(
    () => ({
      ...(defaultPerumahanId ? { perumahanId: defaultPerumahanId } : {}),
      ...(caraPembayaran ? { caraPembayaran } : {}),
      ...(blok ? { blok } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(search ? { search } : {}),
      page,
      limit,
    }),
    [defaultPerumahanId, caraPembayaran, blok, startDate, endDate, search, page, limit],
  );

  const { data: report, isLoading, isFetching } = useGetRekapPemasukanReport(
    queryParams,
    !!defaultPerumahanId,
  );

  const meta = report?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;
  const totalItems = meta?.totalItems ?? 0;

  const pageNumbers = useMemo(() => {
    const delta = 1;
    const range: (number | string)[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      if (newPage <= 1) prev.delete('page');
      else prev.set('page', String(newPage));
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

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (filterDraft.caraPembayaran) {
        prev.set('caraPembayaran', filterDraft.caraPembayaran);
      } else {
        prev.delete('caraPembayaran');
      }
      if (filterDraft.blok.trim()) {
        prev.set('blok', filterDraft.blok.trim());
      } else {
        prev.delete('blok');
      }
      if (filterDraft.startDate) {
        prev.set('startDate', filterDraft.startDate);
      } else {
        prev.delete('startDate');
      }
      if (filterDraft.endDate) {
        prev.set('endDate', filterDraft.endDate);
      } else {
        prev.delete('endDate');
      }
      prev.set('page', '1');
      return prev;
    });
  };

  if (loadingPerumahan || (isLoading && !report)) {
    return <PageLoader />;
  }

  const cashBertahapItems = report
    ? [
        report.cashBertahap.dp,
        ...(report.cashBertahap.cicilanRumah ? [report.cashBertahap.cicilanRumah] : []),
      ]
    : [];

  const ringkasanItems = report
    ? normalizeRingkasan(report.ringkasan, {
        ...report.kpr.cicilan,
        key: 'pencairanKpr',
        label: 'Pencairan KPR',
        calculable: true,
      }).filter((item) => item.key !== 'cicilanDp')
    : [];

  return (
    <ReportPageLayout
      title="Rekap Pemasukan"
      subtitle="Catat uang riil yang diterima dari penjualan kavling, dikelompokkan per kategori dan skema pembayaran"
      icon={Wallet}
    >
      {/* ── Filter ── */}
      <section>
        <button
          type="button"
          onClick={() => setIsFilterOpen((v) => !v)}
          className="flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-700 mb-3"
        >
          <Filter size={14} />
          Filter Laporan
          {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {isFilterOpen && (
          <form
            onSubmit={handleFilterSubmit}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Select
                label="Cara Pembayaran"
                value={filterDraft.caraPembayaran}
                onChange={(e) =>
                  setFilterDraft((p) => ({ ...p, caraPembayaran: e.target.value }))
                }
                options={CARA_BAYAR_OPTIONS}
              />
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Blok</label>
                <input
                  type="text"
                  value={filterDraft.blok}
                  onChange={(e) => setFilterDraft((p) => ({ ...p, blok: e.target.value }))}
                  placeholder="Contoh: AA18"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={filterDraft.startDate}
                  onChange={(e) =>
                    setFilterDraft((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={filterDraft.endDate}
                  onChange={(e) =>
                    setFilterDraft((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isFetching}
                  className="w-full rounded-xl bg-blue-600 text-white text-[13px] font-bold py-2.5 hover:bg-blue-700 disabled:opacity-60"
                >
                  {isFetching ? 'Memuat...' : 'Terapkan Filter'}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {report && (
        <>
          {/* ── Ringkasan Utama ── */}
          <section>
            <button
              type="button"
              onClick={() => setIsRingkasanOpen((v) => !v)}
              className="flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-700 mb-3"
            >
              <BarChart3 size={14} />
              Ringkasan Utama
              {!isRingkasanOpen && (
                <span className="text-[11px] font-semibold text-emerald-700 tabular-nums">
                  · {formatRupiah(report.totalTerima)}
                </span>
              )}
              {isRingkasanOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isRingkasanOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <ReportMetricCard
                  label="Total Uang Diterima"
                  value={formatRupiah(report.totalTerima)}
                  hint="Dari kategori yang sudah bisa dihitung"
                  valueClassName="text-emerald-600"
                  tone="success"
                />
                <ReportMetricCard
                  label="Jumlah Transaksi"
                  value={String(report.jumlahPenjualan)}
                  hint="Penjualan aktif (non batal)"
                />
                <ReportMetricCard
                  label="Booking Fee"
                  value={formatRupiah(
                    report.ringkasan.find((r) => r.key === 'bookingFee')?.terbayar ?? 0,
                  )}
                  valueClassName="text-blue-600"
                />
                <ReportMetricCard
                  label="DP"
                  value={formatRupiah(report.ringkasan.find((r) => r.key === 'dp')?.terbayar ?? 0)}
                  valueClassName="text-indigo-600"
                />
              </div>
            )}
          </section>

          {/* ── Semua Kategori Pemasukan ── */}
          <section>
            <button
              type="button"
              onClick={() => setIsKategoriOpen((v) => !v)}
              className="flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-700 mb-3"
            >
              <Wallet size={14} />
              Semua Kategori Pemasukan
              {!isKategoriOpen && (
                <span className="text-[11px] font-semibold text-emerald-700 tabular-nums">
                  · {formatRupiah(report.totalTerima)}
                </span>
              )}
              {isKategoriOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isKategoriOpen && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/40">
                      <th className="py-2 px-5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="py-2 px-5 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                        Terbayar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ringkasanItems.map((item) => {
                      const clickable =
                        item.calculable &&
                        (item.terbayar ?? 0) > 0 &&
                        !!resolveKategoriKey(item.key) &&
                        (report.kategoriTerbayar?.[resolveKategoriKey(item.key)!]?.length ?? 0) > 0;
                      return (
                        <tr
                          key={item.key}
                          onClick={
                            clickable
                              ? () => handleOpenKategoriModal(item, report.kategoriTerbayar ?? {})
                              : undefined
                          }
                          className={`border-b border-slate-50 last:border-b-0 ${
                            clickable ? 'cursor-pointer hover:bg-slate-50/80' : ''
                          }`}
                          title={clickable ? 'Klik untuk lihat detail pembayaran' : undefined}
                        >
                          <td className="py-2.5 px-5">
                            <p className="font-bold text-slate-700">{item.label}</p>
                            {!item.calculable && item.note && (
                              <p className="text-[10px] text-amber-600/90 mt-0.5">{item.note}</p>
                            )}
                          </td>
                          <td className="py-2.5 px-5">
                            <KategoriValue item={item} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Rekap per Skema ── */}
          <section>
            <button
              type="button"
              onClick={() => setIsSkemaOpen((v) => !v)}
              className="flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-700 mb-3"
            >
              <Landmark size={14} />
              Rekap per Skema Pembayaran
              {isSkemaOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isSkemaOpen && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
                <SkemaTable
                  title="KPR"
                  accentClass="bg-gradient-to-r from-pink-400 to-rose-500"
                  items={[
                    report.kpr.dp,
                    {
                      ...report.kpr.cicilan,
                      key: 'pencairanKpr',
                      label: 'Pencairan KPR',
                      calculable: true,
                      note: undefined,
                    },
                  ]}
                  onItemClick={(item) =>
                    handleOpenKategoriModal(item, report.kategoriTerbayar ?? {})
                  }
                />
                <SkemaTable
                  title="Cash Bertahap"
                  accentClass="bg-gradient-to-r from-violet-400 to-purple-500"
                  items={cashBertahapItems}
                  onItemClick={(item) =>
                    handleOpenKategoriModal(item, report.kategoriTerbayar ?? {})
                  }
                />
              </div>
            )}
          </section>

          {/* ── Detail per Transaksi ── */}
          <section>
            <ReportSectionLabel>Detail per Transaksi</ReportSectionLabel>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

              {/* Toolbar: search + legend */}
              <div className="p-4 border-b border-slate-100">
                <div className="relative max-w-md group">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari customer, blok, atau no transaksi..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2">
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <Landmark size={12} />
                    Nilai di bawah = total tagihan lunas per kategori (uang riil diterima). Klik
                    nominal atau total untuk detail pembayaran. Klik nama customer untuk navigasi
                    ke penjualan atau tagihan.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className="w-3 h-3 rounded-sm bg-pink-200 border border-pink-400 shrink-0" />
                      Pink = KPR
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className="w-3 h-3 rounded-sm bg-purple-200 border border-purple-400 shrink-0" />
                      Ungu = Bertahap
                    </span>
                  </div>
                </div>
              </div>

              {report.items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">
                  Tidak ada data untuk filter yang dipilih.
                </p>
              ) : (
                <div className="overflow-auto custom-scrollbar max-h-[65vh]">
                  <table className="w-full text-[12px] min-w-[1100px] border-collapse">
                    <thead className="sticky top-0 z-10 shadow-sm ring-1 ring-slate-100">
                      <tr className="border-b border-slate-200 bg-slate-50/95">
                        {[
                          { label: 'Customer', align: 'left' },
                          { label: 'Blok', align: 'left' },
                          { label: 'Pembiayaan', align: 'left' },
                          { label: 'Booking', align: 'center' },
                          { label: 'DP', align: 'right' },
                          { label: 'Cic. Cash', align: 'right' },
                          { label: 'Cic. DP', align: 'right' },
                          { label: 'Cic. Rumah', align: 'right' },
                          { label: 'DP KPR', align: 'right' },
                          { label: 'Penc. KPR', align: 'right' },
                          { label: 'Total', align: 'right' },
                        ].map((h) => (
                          <th
                            key={h.label}
                            className={`py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider ${
                              h.align === 'right'
                                ? 'text-right'
                                : h.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                            }`}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.items.map((row) => (
                        <tr
                          key={row.penjualanId}
                          className={`border-b border-slate-50 align-top transition-colors ${getRowSchemeClass(row.caraPembayaran)}`}
                        >
                          {/* ← CustomerNameActionTd menggantikan td biasa */}
                          <CustomerNameActionTd customerNama={row.customerNama} />

                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                            <p className="font-medium">{row.kavlingLabel}</p>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{row.pembiayaan ?? '-'}</td>

                          <ClickableBookingTd
                            amount={row.bookingFee}
                            details={getRowTerbayarByColumn(row, 'bookingFee')}
                            onOpen={() => handleOpenRowModal(row, 'bookingFee')}
                          />

                          {TABLE_COLUMN_KEYS.filter((key) => key !== 'bookingFee').map((columnKey) => (
                            <ClickableAmountTd
                              key={columnKey}
                              amount={row[columnKey]}
                              details={getRowTerbayarByColumn(row, columnKey)}
                              onOpen={() => handleOpenRowModal(row, columnKey)}
                            />
                          ))}

                          <ClickableAmountTd
                            amount={row.totalTerima}
                            details={getAllRowTerbayar(row)}
                            onOpen={() => handleOpenRowModal(row, 'total')}
                            className="font-bold text-emerald-700"
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Pagination ── */}
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 border-t border-slate-100 bg-white">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs font-semibold text-slate-500">
                      Halaman {currentPage} dari {totalPages}
                      {totalItems > 0 && (
                        <span className="text-slate-400 font-normal">
                          {' '}
                          · {totalItems} transaksi
                        </span>
                      )}
                    </span>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="whitespace-nowrap">Per halaman</span>
                      <select
                        value={limit}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm"
                        aria-label="Jumlah data per halaman"
                      >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Halaman sebelumnya"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {pageNumbers.map((num, idx) =>
                        num === '...' ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 text-slate-400 font-bold"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePageChange(num as number)}
                            className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentPage === num
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {num}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Halaman berikutnya"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <PembayaranTerbayarModal
        isOpen={modalDetails.length > 0}
        onClose={handleCloseModal}
        details={modalDetails}
        customerNama={modalContext?.customerNama}
        kavlingLabel={modalContext?.kavlingLabel}
        jenisPembayaran={modalContext?.jenisPembayaran}
        showCustomerPerItem={modalContext?.showCustomerPerItem}
      />
    </ReportPageLayout>
  );
};

export default LaporanRekapPemasukan;