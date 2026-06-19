import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
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
import type { RekapPemasukanKategori } from '../../services/report.service';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import { formatRupiah, formatTanpaDesimal } from '../../utils/formatters';
import { useDefaultPerumahanId } from '../../hooks/useDefaultPerumahanId';

const CARA_BAYAR_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'CASH_KERAS', label: 'Cash Keras' },
  { value: 'CASH_BERTAHAP', label: 'Cash Bertahap' },
  { value: 'KPR', label: 'KPR' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

/** Pencairan KPR = cicilan KPR (satu kategori); normalisasi respons API lama. */
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
    <p className="text-[15px] font-black text-emerald-700 tabular-nums">
      {formatRupiah(item.terbayar ?? 0)}
    </p>
  );
}

function SkemaCard({
  title,
  accentClass,
  items,
}: {
  title: string;
  accentClass: string;
  items: RekapPemasukanKategori[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`h-1 ${accentClass}`} />
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wide">{title}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">Uang riil diterima (tagihan lunas)</p>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-slate-700">{item.label}</p>
              {item.calculable && item.note && (
                <p className="text-[10px] text-slate-400 mt-0.5">{item.note}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <KategoriValue item={item} />
            </div>
          </div>
        ))}
      </div>
    </div>
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
  const [isFilterOpen, setIsFilterOpen] = useState(true);

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
        ...(report.cashBertahap.cicilanDp ? [report.cashBertahap.cicilanDp] : []),
        ...(report.cashBertahap.cicilanRumah ? [report.cashBertahap.cicilanRumah] : []),
      ]
    : [];

  const ringkasanItems = report
    ? normalizeRingkasan(report.ringkasan, {
        ...report.kpr.cicilan,
        key: 'pencairanKpr',
        label: 'Pencairan KPR',
        calculable: true,
      })
    : [];

  return (
    <ReportPageLayout
      title="Rekap Pemasukan"
      subtitle="Catat uang riil yang diterima dari penjualan kavling, dikelompokkan per kategori dan skema pembayaran"
      icon={Wallet}
    >
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
          <section>
            <ReportSectionLabel>Ringkasan Utama</ReportSectionLabel>
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

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Semua Kategori Pemasukan
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {ringkasanItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-4 px-5 py-3.5"
                  >
                    <div>
                      <p className="text-[12px] font-bold text-slate-700">{item.label}</p>
                      {!item.calculable && item.note && (
                        <p className="text-[10px] text-amber-600/90 mt-0.5">{item.note}</p>
                      )}
                      {item.calculable && item.note && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.note}</p>
                      )}
                    </div>
                    <KategoriValue item={item} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <ReportSectionLabel>Rekap per Skema Pembayaran</ReportSectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SkemaCard
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
              />
              <SkemaCard
                title="Cash Bertahap"
                accentClass="bg-gradient-to-r from-violet-400 to-purple-500"
                items={cashBertahapItems}
              />
            </div>
          </section>

          <section>
            <ReportSectionLabel>Detail per Transaksi</ReportSectionLabel>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="relative max-w-md group">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari customer, blok, atau no transaksi..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5">
                  <Landmark size={12} />
                  Nilai di bawah = total tagihan lunas per kategori (uang riil diterima)
                </p>
              </div>

              {report.items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">
                  Tidak ada data untuk filter yang dipilih.
                </p>
              ) : (
                <div className="overflow-auto custom-scrollbar max-h-[60vh]">
                  <table className="w-full text-[11px] min-w-[1100px] border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 shadow-sm">
                      <tr className="border-b border-slate-200">
                        {[
                          'Customer',
                          'Blok',
                          'Skema',
                          'Pembiayaan',
                          'Booking',
                          'DP',
                          'Cic. Cash',
                          'Cic. DP',
                          'Cic. Rumah',
                          'DP KPR',
                          'Penc. KPR',
                          'Total',
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider first:text-left"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.items.map((row) => (
                        <tr
                          key={row.penjualanId}
                          className={`border-b border-slate-50 hover:bg-slate-50/60 ${
                            row.caraPembayaran === 'KPR'
                              ? 'bg-pink-50/30'
                              : row.caraPembayaran === 'CASH_BERTAHAP'
                                ? 'bg-purple-50/30'
                                : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {row.customerNama}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{row.kavlingLabel}</td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {row.caraPembayaran?.replace('_', ' ') ?? '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{row.pembiayaan ?? '-'}</td>
                          {[
                            row.bookingFee,
                            row.dp,
                            row.cicilanCashBertahap,
                            row.cicilanDp,
                            row.cicilanRumah,
                            row.dpKpr,
                            row.cicilanKpr,
                          ].map((val, idx) => (
                            <td
                              key={idx}
                              className="py-2.5 px-3 text-right tabular-nums text-slate-700"
                            >
                              {val > 0 ? formatTanpaDesimal(val) : '-'}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-bold tabular-nums text-emerald-700">
                            {formatTanpaDesimal(row.totalTerima)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs font-semibold text-slate-500">
                      Halaman {currentPage} dari {totalPages} · {totalItems} transaksi
                    </span>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      Per halaman
                      <select
                        value={limit}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
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
                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {pageNumbers.map((num, idx) =>
                        num === '...' ? (
                          <span key={`e-${idx}`} className="px-2 text-slate-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePageChange(num as number)}
                            className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold ${
                              currentPage === num
                                ? 'bg-slate-900 text-white'
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
                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
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
    </ReportPageLayout>
  );
};

export default LaporanRekapPemasukan;
