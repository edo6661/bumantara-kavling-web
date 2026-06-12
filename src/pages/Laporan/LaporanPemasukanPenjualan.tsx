import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Filter,
  Search,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useGetPemasukanPenjualanReport } from '../../hooks/queries/usePemasukanPenjualanReport';
import type {
  PemasukanPenjualanReportItem,
  PemasukanTerbayarDetail,
} from '../../services/report.service';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import {
  PemasukanNominalCell,
  PemasukanTerbayarTd,
} from '../../components/laporan/PemasukanPenjualanCell';
import PembayaranTerbayarModal from '../../components/laporan/PembayaranTerbayarModal';
import CustomerNameActionTd from '../../components/laporan/CustomerNameActionTd';
import { formatRupiah, formatTanpaDesimal } from '../../utils/formatters';
import { useDefaultPerumahanId } from '../../hooks/useDefaultPerumahanId';
import { DEFAULT_PERUMAHAN_NAME } from '../../constants/perumahan';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua (non batal)' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'PROSES', label: 'Proses' },
  { value: 'LUNAS', label: 'Lunas' },
];

const CARA_BAYAR_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'CASH_KERAS', label: 'Cash Keras' },
  { value: 'CASH_BERTAHAP', label: 'Cash Bertahap' },
  { value: 'KPR', label: 'KPR' },
];

const SKEMA_PEMBAYARAN_OPTIONS = [
  { value: '', label: 'Semua Skema' },
  { value: 'Bertahap', label: 'Cash Bertahap' },
  { value: 'KPR', label: 'KPR' },
] as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const DP_SUB_COLUMNS = ['Nominal', 'Terbayar'] as const;
const CICILAN_SUB_COLUMNS = ['Cicilan', 'Terbayar'] as const;

/** (nominal DP + nominal cicilan) − total bayar DP − total bayar cicilan */
function calcSisaPembayaran(item: PemasukanPenjualanReportItem): number {
  const totalWajib = item.dp.nominal + item.cicilan.nominal;
  const totalDibayar = item.dp.totalTerbayar + item.cicilan.totalTerbayar;
  return Math.max(0, totalWajib - totalDibayar);
}

function getRowSchemeClass(skema: string | null): string {
  if (skema === 'KPR') return 'bg-pink-100/90 hover:bg-pink-100';
  if (skema === 'Bertahap') return 'bg-purple-100/90 hover:bg-purple-100';
  return 'hover:bg-slate-50/60';
}

const LaporanPemasukanPenjualan = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;
  const status = searchParams.get('status') || 'ALL';
  const caraPembayaran = searchParams.get('caraPembayaran') || '';
  const skemaPembayaranParam = searchParams.get('skemaPembayaran') || '';
  const skemaPembayaran: '' | 'Bertahap' | 'KPR' =
    skemaPembayaranParam === 'Bertahap' || skemaPembayaranParam === 'KPR'
      ? skemaPembayaranParam
      : '';
  const blok = searchParams.get('blok') || '';

  const [filterDraft, setFilterDraft] = useState({
    status,
    caraPembayaran,
    blok,
  });

  useEffect(() => {
    setFilterDraft({ status, caraPembayaran, blok });
  }, [status, caraPembayaran, blok]);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [modalTagihanList, setModalTagihanList] = useState<PemasukanTerbayarDetail[]>([]);
  const [modalContext, setModalContext] = useState<{
    customerNama: string;
    kavlingLabel: string;
    jenisPembayaran: string;
  } | null>(null);

  const { perumahanId: defaultPerumahanId, isLoading: loadingPerumahan } =
    useDefaultPerumahanId();

  const queryParams = useMemo(
    () => ({
      ...(defaultPerumahanId ? { perumahanId: defaultPerumahanId } : {}),
      status,
      ...(caraPembayaran ? { caraPembayaran } : {}),
      ...(skemaPembayaran ? { skemaPembayaran } : {}),
      ...(blok ? { blok } : {}),
      ...(search ? { search } : {}),
      page,
      limit,
    }),
    [defaultPerumahanId, status, caraPembayaran, skemaPembayaran, blok, search, page, limit],
  );

  const { data: report, isLoading, isFetching } = useGetPemasukanPenjualanReport(
    queryParams,
    !!defaultPerumahanId,
  );

  const items = report?.items ?? [];
  const meta = report?.meta;
  const totalItems = meta?.totalItems ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;
  const hasActiveSearch = search.length > 0;
  const hasActiveSkemaFilter = skemaPembayaran.length > 0;
  const hasTableFilters = hasActiveSearch || hasActiveSkemaFilter;
  const hasReportData = totalItems > 0 || hasTableFilters;

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

  const handleSkemaPembayaranChange = (value: string) => {
    setSearchParams((prev) => {
      if (value === 'Bertahap' || value === 'KPR') prev.set('skemaPembayaran', value);
      else prev.delete('skemaPembayaran');
      prev.set('page', '1');
      return prev;
    });
  };

  const handleTerbayarTdOpen = (
    terbayar: PemasukanTerbayarDetail[],
    customerNama: string,
    kavlingLabel: string,
    jenisPembayaran: string,
  ) => {
    if (terbayar.length === 0) return;
    setModalTagihanList(terbayar);
    setModalContext({ customerNama, kavlingLabel, jenisPembayaran });
  };

  const handleCloseModal = () => {
    setModalTagihanList([]);
    setModalContext(null);
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (filterDraft.status && filterDraft.status !== 'ALL') {
        prev.set('status', filterDraft.status);
      } else {
        prev.delete('status');
      }
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
      prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  };

  if (loadingPerumahan || (isLoading && !report)) {
    return <PageLoader />;
  }

  const summary = report?.summary;

  return (
    <ReportPageLayout
      title="Pemasukan Penjualan Kavling"
      subtitle="Rekap pemasukan booking fee, DP, dan cicilan per customer"
      icon={TrendingUp}
    >
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-[12px] text-slate-500">
          Kalkulasi detail tagihan dan termin dapat dilihat di halaman{' '}
          <Link
            to="/customer/tagihan"
            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Customer / Pembayaran
            <ExternalLink size={12} />
          </Link>
        </p>
      </div>

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
            <p className="text-[11px] text-slate-500 mb-3">
              Perumahan:{' '}
              <span className="font-bold text-slate-700">{DEFAULT_PERUMAHAN_NAME}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Status Penjualan"
                value={filterDraft.status}
                onChange={(e) =>
                  setFilterDraft((prev) => ({ ...prev, status: e.target.value }))
                }
                options={STATUS_OPTIONS}
              />
              <Select
                label="Cara Pembayaran"
                value={filterDraft.caraPembayaran}
                onChange={(e) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    caraPembayaran: e.target.value,
                  }))
                }
                options={CARA_BAYAR_OPTIONS}
              />
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Blok
                </label>
                <input
                  type="text"
                  value={filterDraft.blok}
                  onChange={(e) =>
                    setFilterDraft((prev) => ({ ...prev, blok: e.target.value }))
                  }
                  placeholder="Contoh: AA18"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex items-center">
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

      {summary && (
        <section>
          <ReportSectionLabel>Ringkasan</ReportSectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportMetricCard
              label="Jumlah Penjualan"
              value={String(summary.jumlahPenjualan)}
              hint="Unit transaksi aktif"
            />
            <ReportMetricCard
              label="Booking Fee Terbayar"
              value={formatRupiah(summary.totalBookingTerbayar)}
              hint={`dari ${formatRupiah(summary.totalBookingNominal)}`}
              valueClassName="text-emerald-600"
            />
            <ReportMetricCard
              label="DP Terbayar"
              value={formatRupiah(summary.totalDpTerbayar)}
              hint={`dari ${formatRupiah(summary.totalDpNominal)}`}
              valueClassName="text-blue-600"
            />
            <ReportMetricCard
              label="Cicilan Terbayar"
              value={formatRupiah(summary.totalCicilanTerbayar)}
              hint={`dari ${formatRupiah(summary.totalCicilanNominal)}`}
              valueClassName="text-violet-600"
            />
          </div>
        </section>
      )}

      <section>
        <ReportSectionLabel>Detail per Customer</ReportSectionLabel>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {!report || !hasReportData ? (
            <p className="text-sm text-slate-400 text-center py-8">
              {hasTableFilters
                ? 'Tidak ada data yang cocok dengan pencarian atau filter skema.'
                : 'Tidak ada data penjualan untuk filter yang dipilih.'}
            </p>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1 sm:max-w-md group">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Cari nama customer atau blok..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="relative sm:w-52 shrink-0">
                    <label htmlFor="skema-pembayaran-filter" className="sr-only">
                      Skema Pembayaran
                    </label>
                    <select
                      id="skema-pembayaran-filter"
                      value={skemaPembayaran}
                      onChange={(e) => handleSkemaPembayaranChange(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-900 shadow-sm cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      aria-label="Filter skema pembayaran"
                    >
                      {SKEMA_PEMBAYARAN_OPTIONS.map((opt) => (
                        <option key={opt.value || 'all'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2">
                  <p className="text-[10px] text-slate-400">
                    Klik nama customer untuk buka penjualan atau tagihan. Klik kolom terbayar
                    untuk melihat detail dan bukti pembayaran.
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

              {items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Tidak ada data yang cocok dengan pencarian.
                </p>
              ) : (
                <div className="overflow-auto custom-scrollbar max-h-[65vh]">
                  <table className="w-full text-[12px] min-w-[900px] border-collapse">
                    <thead className="sticky top-0 z-10 shadow-sm ring-1 ring-slate-100">
                      <tr className="border-b border-slate-200">
                        <th
                          rowSpan={2}
                          className="text-left py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider bg-slate-50/95 border-r border-slate-100"
                        >
                          Nama
                        </th>
                        <th
                          rowSpan={2}
                          className="text-left py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider bg-slate-50/95 border-r border-slate-100"
                        >
                          Blok
                        </th>
                        <th
                          rowSpan={2}
                          className="text-center py-3 px-3 font-bold text-[10px] uppercase tracking-wider bg-emerald-50/90 text-emerald-800 border-r border-slate-100 min-w-[72px]"
                        >
                          Booking
                        </th>
                        <th
                          rowSpan={2}
                          className="text-right py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider bg-slate-50/95 border-r border-slate-200 min-w-[100px]"
                        >
                          Harga Jual
                        </th>
                        <th
                          colSpan={DP_SUB_COLUMNS.length}
                          className="text-center py-2 px-3 font-bold text-[10px] uppercase tracking-wider bg-blue-50/90 text-blue-900 border-r border-slate-200"
                        >
                          DP
                        </th>
                        <th
                          colSpan={CICILAN_SUB_COLUMNS.length}
                          className="text-center py-2 px-3 font-bold text-[10px] uppercase tracking-wider bg-violet-50/90 text-violet-900 border-r border-slate-200"
                        >
                          Nominal
                        </th>
                        <th
                          rowSpan={2}
                          className="text-right py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider bg-red-50/90 text-red-800 border-r border-slate-200 min-w-[100px]"
                        >
                          Sisa
                        </th>
                      </tr>
                      <tr className="border-b border-slate-100 bg-slate-50/95">
                        {DP_SUB_COLUMNS.map((label, colIdx) => (
                          <th
                            key={`dp-${label}`}
                            className={`text-right py-2 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider min-w-[110px] bg-blue-50/90 ${
                              colIdx === DP_SUB_COLUMNS.length - 1
                                ? 'border-r border-slate-200'
                                : ''
                            }`}
                          >
                            {label}
                          </th>
                        ))}
                        {CICILAN_SUB_COLUMNS.map((label, colIdx) => (
                          <th
                            key={`cicilan-${label}`}
                            className={`text-right py-2 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider min-w-[110px] bg-violet-50/90 ${
                              colIdx === CICILAN_SUB_COLUMNS.length - 1
                                ? 'border-r border-slate-200'
                                : ''
                            }`}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const sisaPembayaran = calcSisaPembayaran(item);
                        return (
                        <tr
                          key={item.penjualanId}
                          className={`border-b border-slate-50 align-top transition-colors ${getRowSchemeClass(item.cicilan.skemaPembayaran)}`}
                        >
                          <CustomerNameActionTd customerNama={item.customerNama} />
                          <td className="py-3 px-4 text-slate-600 border-r border-slate-100">
                            <p className="font-medium">{item.kavlingLabel}</p>
                          
                          </td>

                          <td className="py-3 px-3 text-center border-r border-slate-100">
                            {item.bookingLunas === null ? (
                              <span className="text-slate-400 text-[11px]">-</span>
                            ) : item.bookingLunas ? (
                              <CheckCircle2
                                size={18}
                                className="inline text-emerald-600"
                                aria-label="Booking fee lunas"
                              />
                            ) : (
                              <XCircle
                                size={18}
                                className="inline text-red-500"
                                aria-label="Booking fee belum lunas"
                              />
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-semibold text-slate-800 border-r border-slate-200 tabular-nums">
                            {formatTanpaDesimal(item.hargaJual)}
                          </td>

                          <td className="py-3 px-3 text-right border-r border-slate-50">
                            <PemasukanNominalCell nominal={item.dp.nominal} />
                          </td>
                          <PemasukanTerbayarTd
                            bucket={item.dp}
                            variant="dp"
                            className="border-r border-slate-100"
                            onOpen={() =>
                              handleTerbayarTdOpen(
                                item.dp.terbayar,
                                item.customerNama,
                                item.kavlingLabel,
                                'DP',
                              )
                            }
                          />

                          <td className="py-3 px-3 text-right border-r border-slate-50">
                            {item.cicilan.skemaPembayaran ? (
                              <PemasukanNominalCell nominal={item.cicilan.nominal} />
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          {item.cicilan.skemaPembayaran ? (
                            <PemasukanTerbayarTd
                              bucket={item.cicilan}
                              variant={
                                item.cicilan.skemaPembayaran === 'KPR' ? 'kpr' : 'bertahap'
                              }
                              className="border-r border-slate-100"
                              onOpen={() =>
                                handleTerbayarTdOpen(
                                  item.cicilan.terbayar,
                                  item.customerNama,
                                  item.kavlingLabel,
                                  `Cicilan ${item.cicilan.skemaPembayaran}`,
                                )
                              }
                            />
                          ) : (
                            <td className="py-3 px-3 border-r border-slate-100">
                              <span className="text-right block text-slate-400 text-[11px]">-</span>
                            </td>
                          )}
                          <td
                            className="py-3 px-3 text-right border-r border-slate-100"
                            title="(Nominal DP + Nominal Cicilan) − Total Bayar DP − Total Bayar Cicilan"
                          >
                            <p
                              className={`font-bold tabular-nums ${
                                sisaPembayaran > 0 ? 'text-red-600' : 'text-slate-400'
                              }`}
                            >
                              {formatTanpaDesimal(sisaPembayaran)}
                            </p>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 border-t border-slate-100 bg-white">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs font-semibold text-slate-500">
                      Halaman {currentPage} dari {totalPages}
                      {totalItems > 0 && (
                        <span className="text-slate-400 font-normal">
                          {' '}
                          · {totalItems} customer
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
                        onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(currentPage + 1)}
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
            </>
          )}
        </div>
      </section>

      <PembayaranTerbayarModal
        isOpen={modalTagihanList.length > 0}
        onClose={handleCloseModal}
        details={modalTagihanList}
        customerNama={modalContext?.customerNama}
        kavlingLabel={modalContext?.kavlingLabel}
        jenisPembayaran={modalContext?.jenisPembayaran}
      />
    </ReportPageLayout>
  );
};

export default LaporanPemasukanPenjualan;
