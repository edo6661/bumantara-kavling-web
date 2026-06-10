import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useGetDashboardSummary, useGetDashboardDrilldown } from '../../hooks/queries/useDashboard';
import { useGetKeuanganReport } from '../../hooks/queries/useKeuanganReport';
import type { KeuanganReportParams } from '../../services/report.service';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import KeuanganArusKasChart from '../../components/laporan/KeuanganArusKasChart';
import DashboardDrilldownModal from '../../components/dashboard/DashboardDrilldownModal';
import {
  TagihanStatusChart,
  CollectionTrendChart,
  RevenueTrendChart,
} from '../../components/dashboard/DashboardCharts';
import { formatRupiah, formatDate } from '../../utils/formatters';

const KATEGORI_OPTIONS = [
  { value: 'ALL', label: 'Semua' },
  { value: 'MASUK', label: 'Kas Masuk (Tagihan)' },
  { value: 'SPK', label: 'Pengeluaran SPK' },
  { value: 'NOTARIS', label: 'Pengeluaran Notaris' },
  { value: 'KPR', label: 'Pengeluaran KPR' },
];

const BSI_OPTIONS = [
  { value: 'ALL', label: 'Semua BSI CMS' },
  { value: 'SUDAH', label: 'Sudah Dilaporkan' },
  { value: 'BELUM', label: 'Belum Dilaporkan' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'SUDAH_DIBAYAR', label: 'Sudah Dibayar' },
  { value: 'MENUNGGU_PEMBAYARAN', label: 'Menunggu Pembayaran' },
];

const LaporanKeuangan = () => {
  const navigate = useNavigate();
  const [drilldownFilter, setDrilldownFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<KeuanganReportParams>({
    kategori: 'ALL',
    bsiCms: 'ALL',
    status: 'ALL',
  });
  const [appliedFilters, setAppliedFilters] = useState<KeuanganReportParams>({
    kategori: 'ALL',
    bsiCms: 'ALL',
    status: 'ALL',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'keluar' | 'masuk'>('keluar');

  const { data: dashboard, isLoading: loadingDashboard } = useGetDashboardSummary();
  const { data: report, isLoading: loadingReport, isFetching } =
    useGetKeuanganReport(appliedFilters);

  const { data: drilldownItems = [], isLoading: drilldownLoading } =
    useGetDashboardDrilldown(
      drilldownFilter ? 'tagihan' : null,
      drilldownFilter ?? undefined,
      undefined,
      drilldownFilter !== null,
    );

  if ((loadingDashboard && !dashboard) || (loadingReport && !report)) {
    return <PageLoader />;
  }

  const stats = dashboard?.stats;
  const tagihanByStatus = dashboard?.tagihanByStatus ?? [];
  const collectionTrend = dashboard?.collectionTrend ?? [];
  const revenueTrend = dashboard?.revenueTrend ?? [];
  const trendMonths = dashboard?.filters.trendMonths ?? 6;
  const summary = report?.summary;

  const showKeluar =
    appliedFilters.kategori !== 'MASUK' && (report?.pengeluaran.length ?? 0) > 0;
  const showMasuk =
    appliedFilters.kategori === 'ALL' ||
    appliedFilters.kategori === 'MASUK';

  return (
    <ReportPageLayout
      title="Laporan Keuangan & Koleksi"
      subtitle="Arus kas masuk dari customer dan pengeluaran SPK, notaris, KPR beserta status BSI CMS"
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Kategori"
                value={filters.kategori ?? 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, kategori: e.target.value }))
                }
                options={KATEGORI_OPTIONS}
              />
              <Select
                label="Status Pembayaran"
                value={filters.status ?? 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                options={STATUS_OPTIONS}
              />
              <Select
                label="BSI CMS"
                value={filters.bsiCms ?? 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, bsiCms: e.target.value }))
                }
                options={BSI_OPTIONS}
              />
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filters.startDate ?? ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filters.endDate ?? ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setAppliedFilters({ ...filters })}
                disabled={isFetching}
                className="px-5 py-2.5 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors"
              >
                {isFetching ? 'Memuat...' : 'Terapkan Filter'}
              </button>
            </div>
          </div>
        )}
      </section>

      {summary && (
        <section>
          <ReportSectionLabel>Ringkasan Arus Kas</ReportSectionLabel>
          <p className="text-[11px] text-slate-400 mb-3 -mt-1">
            Berdasarkan tagihan customer lunas vs pengeluaran SPK, notaris, dan KPR (sesuai filter
            tanggal jika diisi)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <ReportMetricCard
              label="Kas Masuk"
              value={formatRupiah(summary.totalMasuk)}
              hint="Tagihan customer status Lunas (booking fee, DP, cicilan, dll.)"
              valueClassName="text-emerald-600"
            />
            <ReportMetricCard
              label="Kas Keluar"
              value={formatRupiah(summary.totalKeluar)}
              hint="SPK + Notaris + KPR yang sudah dibayar"
              valueClassName="text-amber-600"
            />
            <ReportMetricCard
              label="Menunggu Bayar"
              value={formatRupiah(summary.totalMenungguKeluar)}
              hint="Pengeluaran SPK/Notaris/KPR belum dibayar"
              valueClassName="text-blue-600"
            />
            <ReportMetricCard
              label="Arus Kas Bersih"
              value={formatRupiah(summary.arusKasBersih)}
              hint="Kas masuk dikurangi kas keluar"
              valueClassName={
                summary.arusKasBersih >= 0 ? 'text-emerald-600' : 'text-red-600'
              }
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Rincian Kas Keluar & BSI CMS
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <ReportMetricCard
                label="SPK"
                value={formatRupiah(summary.spkKeluar)}
                hint="Termin, kasbon, upah — sudah dibayar"
                valueClassName="text-slate-800 text-base sm:text-lg"
              />
              <ReportMetricCard
                label="Notaris"
                value={formatRupiah(summary.notarisKeluar)}
                hint="Biaya notaris & BPHTB — sudah dibayar"
                valueClassName="text-slate-800 text-base sm:text-lg"
              />
              <ReportMetricCard
                label="KPR"
                value={formatRupiah(summary.kprKeluar)}
                hint="Biaya KPR & appraisal — sudah dibayar"
                valueClassName="text-slate-800 text-base sm:text-lg"
              />
              <ReportMetricCard
                tone="success"
                label="BSI ✓"
                value={summary.bsiCmsSudahDilaporkan}
                hint="Sudah bayar & dilaporkan BSI CMS"
                valueClassName="text-emerald-600"
              />
              <ReportMetricCard
                tone="warning"
                label="BSI ✗"
                value={summary.bsiCmsBelumDilaporkan}
                hint="Sudah bayar, belum lapor BSI CMS"
                valueClassName="text-amber-600"
              />
            </div>
          </div>
        </section>
      )}

      {report && report.arusKasBulanan.length > 0 && (
        <section>
          <ReportSectionLabel>Arus Kas Bulanan</ReportSectionLabel>
          <p className="text-[11px] text-slate-400 mb-3 -mt-1">
            Masuk = bulan tagihan lunas · Keluar = bulan tanggal bayar pengeluaran
          </p>
          <KeuanganArusKasChart data={report.arusKasBulanan} />
        </section>
      )}

      {report && report.byKategori.length > 0 && (
        <section>
          <ReportSectionLabel>Pengeluaran per Kategori</ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Sudah Dibayar
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Menunggu
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    BSI Belum
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.byKategori.map((row) => (
                  <tr key={row.kategori} className="border-b border-slate-50">
                    <td className="py-3 px-5 font-semibold text-slate-800">{row.label}</td>
                    <td className="py-3 px-5 text-right font-bold text-emerald-600">
                      {formatRupiah(row.sudahDibayar)}
                    </td>
                    <td className="py-3 px-5 text-right text-blue-600">
                      {formatRupiah(row.menungguPembayaran)}
                    </td>
                    <td className="py-3 px-5 text-right text-amber-600">
                      {row.bsiBelumDilaporkan} item
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {stats && (
        <section>
          <ReportSectionLabel>Ringkasan Koleksi (Dashboard)</ReportSectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportMetricCard
              label="Total Pendapatan"
              value={formatRupiah(stats.totalPendapatan)}
              hint="Akumulasi semua tagihan lunas"
              valueClassName="text-emerald-600 text-xl"
            />
            <ReportMetricCard
              label="Pendapatan Bulan Ini"
              value={formatRupiah(stats.pendapatanBulanIni)}
              hint="Tagihan lunas dikonfirmasi bulan ini"
              valueClassName="text-slate-900 text-xl"
            />
            <ReportMetricCard
              label="Tagihan Jatuh Tempo"
              value={formatRupiah(stats.tagihanJatuhTempo)}
              hint="Nominal tagihan belum bayar lewat jatuh tempo"
              valueClassName="text-amber-600 text-xl"
            />
            <ReportMetricCard
              label="Menunggu Konfirmasi"
              value={formatRupiah(stats.tagihanMenungguKonfirmasiNominal)}
              hint="Nominal tagihan menunggu verifikasi finance"
              valueClassName="text-blue-600 text-xl"
            />
          </div>
        </section>
      )}

      <section>
        <ReportSectionLabel>Analisis Koleksi</ReportSectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TagihanStatusChart
            data={tagihanByStatus}
            onSegmentClick={(status) => setDrilldownFilter(status)}
          />
          <CollectionTrendChart data={collectionTrend} />
        </div>
      </section>

      <section>
        <ReportSectionLabel>Tren Pendapatan</ReportSectionLabel>
        <RevenueTrendChart data={revenueTrend} trendMonths={trendMonths} />
      </section>

      {report && (showKeluar || showMasuk) && (
        <section>
          <ReportSectionLabel>Detail Transaksi</ReportSectionLabel>
          <div className="flex gap-2 mb-4">
            {showKeluar && (
              <button
                type="button"
                onClick={() => setActiveTab('keluar')}
                className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-colors ${
                  activeTab === 'keluar'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Pengeluaran ({report.pengeluaran.length})
              </button>
            )}
            {showMasuk && (
              <button
                type="button"
                onClick={() => setActiveTab('masuk')}
                className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-colors ${
                  activeTab === 'masuk'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Pemasukan ({report.pemasukan.length})
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {activeTab === 'keluar' && showKeluar ? (
              report.pengeluaran.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Tidak ada pengeluaran.</p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Referensi
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Nominal
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        BSI CMS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.pengeluaran.map((row) => (
                      <tr key={`${row.kategori}-${row.id}`} className="border-b border-slate-50">
                        <td className="py-3 px-5">
                          <p className="font-semibold text-slate-800">{row.jenisLabel}</p>
                          <p className="text-[11px] text-slate-400">{row.kategori}</p>
                        </td>
                        <td className="py-3 px-5">
                          <p className="text-slate-700">{row.referensi}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {row.sublabel}
                          </p>
                          {row.tanggalPembayaran && (
                            <p className="text-[10px] text-slate-400">
                              {formatDate(row.tanggalPembayaran)}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-slate-800">
                          {formatRupiah(row.nominal)}
                        </td>
                        <td className="py-3 px-5 text-right">
                          {row.status === 'SUDAH_DIBAYAR' ? (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                row.bsiCmsDilaporkan
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {row.bsiCmsDilaporkan ? 'Sudah' : 'Belum'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {row.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : report.pemasukan.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Tidak ada pemasukan.</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                      Tagihan
                    </th>
                    <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                      Nominal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.pemasukan.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => navigate('/customer/tagihan')}
                    >
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-800">{row.customerNama}</p>
                        <p className="text-[11px] text-slate-400">{row.kavlingLabel}</p>
                      </td>
                      <td className="py-3 px-5 text-slate-600">
                        {row.noTagihan}
                        <span className="ml-2 text-[10px] text-slate-400">{row.tujuanLabel}</span>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(row.tanggalLunas)}
                        </p>
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-emerald-600">
                        {formatRupiah(row.nominal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      <DashboardDrilldownModal
        isOpen={drilldownFilter !== null}
        onClose={() => setDrilldownFilter(null)}
        title="Detail Tagihan"
        items={drilldownItems}
        isLoading={drilldownLoading}
        onItemClick={() => {
          navigate('/customer/tagihan');
          setDrilldownFilter(null);
        }}
      />
    </ReportPageLayout>
  );
};

export default LaporanKeuangan;
