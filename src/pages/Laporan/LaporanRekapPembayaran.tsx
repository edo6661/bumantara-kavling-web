import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  Receipt,
  Search,
} from 'lucide-react';
import { useGetRekapPembayaranReport } from '../../hooks/queries/useRekapPembayaranReport';
import type { RekapPembayaranReportParams } from '../../services/report.service';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import RekapPembayaranCell, {
  RekapTerbayarRingkasCell,
} from '../../components/laporan/RekapPembayaranCell';
import { formatRupiah } from '../../utils/formatters';
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const LaporanRekapPembayaran = () => {
  const [filters, setFilters] = useState<RekapPembayaranReportParams>({ status: 'ALL' });
  const [appliedFilters, setAppliedFilters] = useState<RekapPembayaranReportParams>({
    status: 'ALL',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const { perumahanId: defaultPerumahanId, isLoading: loadingPerumahan } =
    useDefaultPerumahanId();
  const effectiveFilters = useMemo(
    () => ({
      ...(defaultPerumahanId
        ? { ...appliedFilters, perumahanId: defaultPerumahanId }
        : appliedFilters),
      ...(appliedSearch ? { search: appliedSearch } : {}),
      page,
      limit,
    }),
    [appliedFilters, defaultPerumahanId, appliedSearch, page, limit],
  );

  const { data: report, isLoading, isFetching } = useGetRekapPembayaranReport(
    effectiveFilters,
    !!defaultPerumahanId,
  );

  const items = report?.items ?? [];
  const meta = report?.meta;
  const totalItems = meta?.totalItems ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const hasActiveSearch = appliedSearch.length > 0;
  const hasReportData = totalItems > 0 || hasActiveSearch;

  const pageNumbers = useMemo(() => {
    const delta = 1;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift('...');
    if (page + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  }, [page, totalPages]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextSearch = searchInput.trim();
      setAppliedSearch((prev) => (prev === nextSearch ? prev : nextSearch));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
    setSearchInput('');
    setAppliedSearch('');
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };

  const handleSearchSubmit = () => {
    const nextSearch = searchInput.trim();
    setAppliedSearch(nextSearch);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  if (loadingPerumahan || (isLoading && !report)) {
    return <PageLoader />;
  }

  const summary = report?.summary;

  return (
    <ReportPageLayout
      title="Rekap Pembayaran Penjualan"
      subtitle="Ringkasan DP, sisa pembayaran (harga jual − DP), dan riwayat cicilan yang sudah lunas per customer"
      icon={Receipt}
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
            <p className="text-[11px] text-slate-500 mb-3">
              Perumahan:{' '}
              <span className="font-bold text-slate-700">{DEFAULT_PERUMAHAN_NAME}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Status Penjualan"
                value={filters.status ?? 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                options={STATUS_OPTIONS}
              />
              <Select
                label="Cara Pembayaran"
                value={filters.caraPembayaran ?? ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    caraPembayaran: e.target.value || undefined,
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
                  value={filters.blok ?? ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      blok: e.target.value || undefined,
                    }))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportMetricCard
              label="Jumlah Penjualan"
              value={String(summary.jumlahPenjualan)}
              hint="Unit transaksi aktif"
            />
            <ReportMetricCard
              label="Total Harga Jual"
              value={formatRupiah(summary.totalHargaJual)}
              valueClassName="text-slate-800"
            />
            <ReportMetricCard
              label="Total DP"
              value={formatRupiah(summary.totalDp)}
              valueClassName="text-blue-600"
            />
            <ReportMetricCard
              label="Total Sisa Pembayaran"
              value={formatRupiah(summary.totalSisaPembayaran)}
              hint="Harga jual − DP"
              valueClassName="text-amber-600"
            />
            <ReportMetricCard
              label="DP Terbayar"
              value={formatRupiah(summary.totalDpTerbayar)}
              valueClassName="text-emerald-600"
            />
            <ReportMetricCard
              label="Cicilan Harga Jual Terbayar"
              value={formatRupiah(summary.totalCicilanTerbayar)}
              valueClassName="text-emerald-600"
            />
          </div>
        </section>
      )}

      <section>
        <ReportSectionLabel>Detail per Customer</ReportSectionLabel>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {!report || !hasReportData ? (
            <p className="text-sm text-slate-400 text-center py-8">
              {hasActiveSearch
                ? 'Tidak ada data yang cocok dengan pencarian.'
                : 'Tidak ada data penjualan untuk filter yang dipilih.'}
            </p>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100">
                <div className="relative max-w-sm group">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Cari nama customer atau blok..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
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
                    <tr className="border-b border-slate-100 bg-slate-50/95">
                      <th className="text-left py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider bg-slate-50/95">
                        Nama
                      </th>
                      <th className="text-left py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider bg-slate-50/95">
                        Kavling
                      </th>
                      <th className="text-right py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider bg-slate-50/95">
                        Harga Jual
                      </th>
                      <th className="text-right py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider min-w-[160px] bg-slate-50/95">
                        DP
                      </th>
                      <th className="text-right py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider min-w-[160px] bg-slate-50/95">
                        Sisa Pembayaran
                      </th>
                      <th className="text-right py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider min-w-[140px] bg-slate-50/95">
                        Terbayar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.penjualanId}
                        className="border-b border-slate-50 hover:bg-slate-50/60 align-top"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {item.customerNama}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <p className="font-medium">{item.kavlingLabel}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Blok {item.blok} · No. {item.nomorUnit}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">
                          {formatRupiah(item.hargaJual)}
                        </td>
                        <td className="py-3 px-4">
                          <RekapPembayaranCell utama={item.dp} terbayar={item.dpTerbayar} />
                        </td>
                        <td className="py-3 px-4">
                          <RekapPembayaranCell
                            utama={item.sisaPembayaran}
                            terbayar={item.cicilanTerbayar}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <RekapTerbayarRingkasCell
                            dpTerbayar={item.totalDpTerbayar}
                            cicilanTerbayar={item.totalCicilanTerbayar}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 border-t border-slate-100 bg-white">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Halaman {page} dari {totalPages}
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
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Halaman sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {pageNumbers.map((num, idx) =>
                      num === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold">
                          ...
                        </span>
                      ) : (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handlePageChange(num as number)}
                          className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            page === num
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
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
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
    </ReportPageLayout>
  );
};

export default LaporanRekapPembayaran;
