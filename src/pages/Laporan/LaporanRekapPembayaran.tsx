import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Receipt } from 'lucide-react';
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

const LaporanRekapPembayaran = () => {
  const [filters, setFilters] = useState<RekapPembayaranReportParams>({ status: 'ALL' });
  const [appliedFilters, setAppliedFilters] = useState<RekapPembayaranReportParams>({
    status: 'ALL',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const { perumahanId: defaultPerumahanId, isLoading: loadingPerumahan } =
    useDefaultPerumahanId();
  const effectiveFilters = useMemo(
    () =>
      defaultPerumahanId
        ? { ...appliedFilters, perumahanId: defaultPerumahanId }
        : appliedFilters,
    [appliedFilters, defaultPerumahanId],
  );

  const { data: report, isLoading, isFetching } = useGetRekapPembayaranReport(
    effectiveFilters,
    !!defaultPerumahanId,
  );

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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
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
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setAppliedFilters({ ...filters })}
                  disabled={isFetching}
                  className="w-full rounded-xl bg-blue-600 text-white text-[13px] font-bold py-2.5 hover:bg-blue-700 disabled:opacity-60"
                >
                  {isFetching ? 'Memuat...' : 'Terapkan Filter'}
                </button>
              </div>
            </div>
          </div>
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          {!report || report.items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Tidak ada data penjualan untuk filter yang dipilih.
            </p>
          ) : (
            <table className="w-full text-[12px] min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Kavling
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Harga Jual
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider min-w-[160px]">
                    DP
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider min-w-[160px]">
                    Sisa Pembayaran
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider min-w-[140px]">
                    Terbayar
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.items.map((item) => (
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
          )}
        </div>
      </section>
    </ReportPageLayout>
  );
};

export default LaporanRekapPembayaran;
