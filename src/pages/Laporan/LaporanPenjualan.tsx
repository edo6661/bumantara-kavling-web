import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { useGetDashboardSummary, useGetDashboardDrilldown } from '../../hooks/queries/useDashboard';
import type { DashboardDrilldownCategory } from '../../services/dashboard.service';
import { useGetPenjualanReport } from '../../hooks/queries/usePenjualanReport';
import type { PenjualanReportParams } from '../../services/report.service';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import BlokHeatmapTable from '../../components/laporan/BlokHeatmapTable';
import DashboardDrilldownModal from '../../components/dashboard/DashboardDrilldownModal';
import {
  PenjualanStatusChart,
  SalesTrendChart,
  CollectionTrendChart,
} from '../../components/dashboard/DashboardCharts';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { useGetAgents } from '../../hooks/queries/useAgent';
import { useDefaultPerumahanId } from '../../hooks/useDefaultPerumahanId';
import { DEFAULT_PERUMAHAN_NAME } from '../../constants/perumahan';

type DrilldownState = {
  category: DashboardDrilldownCategory;
  filter?: string;
  title: string;
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua (non batal)' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'PROSES', label: 'Proses' },
  { value: 'LUNAS', label: 'Lunas' },
];

const CARA_BAYAR_OPTIONS = [
  { value: 'CASH_KERAS', label: 'Cash Keras' },
  { value: 'CASH_BERTAHAP', label: 'Cash Bertahap' },
  { value: 'KPR', label: 'KPR' },
];

const TAGIHAN_STATUS_STYLE: Record<string, string> = {
  LUNAS: 'bg-emerald-50 text-emerald-700',
  BELUM_BAYAR: 'bg-amber-50 text-amber-700',
  MENUNGGU_KONFIRMASI: 'bg-blue-50 text-blue-700',
};

const LaporanPenjualan = () => {
  const navigate = useNavigate();
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);
  const [filters, setFilters] = useState<PenjualanReportParams>({ status: 'ALL' });
  const [appliedFilters, setAppliedFilters] = useState<PenjualanReportParams>({
    status: 'ALL',
  });
  const [expandedPenjualan, setExpandedPenjualan] = useState<number | null>(null);
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

  const { data: dashboard, isLoading: loadingDashboard } = useGetDashboardSummary();
  const { data: report, isLoading: loadingReport, isFetching } = useGetPenjualanReport(
    effectiveFilters,
    !!defaultPerumahanId,
  );
  const { data: agents = [] } = useGetAgents();

  const { data: drilldownItems = [], isLoading: drilldownLoading } =
    useGetDashboardDrilldown(
      drilldown?.category ?? null,
      drilldown?.filter,
      undefined,
      drilldown !== null,
    );

  const agentOptions = useMemo(
    () => agents.map((a) => ({ value: String(a.id), label: a.nama })),
    [agents],
  );

  const openDrilldown = (
    category: DashboardDrilldownCategory,
    filter: string | undefined,
    title: string,
  ) => {
    setDrilldown({ category, filter, title });
  };

  if (
    loadingPerumahan ||
    (loadingDashboard && !dashboard) ||
    (loadingReport && !report)
  ) {
    return <PageLoader />;
  }

  const summary = report?.summary;
  const penjualanByStatus = dashboard?.penjualanByStatus ?? [];
  const blokHeatmap = dashboard?.blokHeatmap ?? [];
  const topAgents = dashboard?.topAgents ?? [];
  const collectionTrend = dashboard?.collectionTrend ?? [];
  const salesTrend = dashboard?.salesTrend ?? [];
  const documentAlerts = dashboard?.documentAlerts ?? [];
  const trendMonths = dashboard?.filters.trendMonths ?? 6;

  return (
    <ReportPageLayout
      title="Laporan Penjualan & Koleksi"
      subtitle="Status transaksi, riwayat pembayaran customer, piutang, dan aging tagihan"
      icon={ShoppingCart}
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
              Perumahan: <span className="font-bold text-slate-700">{DEFAULT_PERUMAHAN_NAME}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Select
                label="Agent"
                value={filters.agentId ? String(filters.agentId) : ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    agentId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                options={agentOptions}
              />
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
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
                  placeholder="Contoh: A"
                  className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Transaksi Dari
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
                  Transaksi Sampai
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
          <ReportSectionLabel>Ringkasan Koleksi</ReportSectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <ReportMetricCard
              label="Penjualan"
              value={summary.jumlahPenjualan}
              subValue={formatRupiah(summary.totalNilaiPenjualan)}
              hint="Jumlah transaksi · total harga jual"
              valueClassName="text-slate-900 text-xl"
            />
            <ReportMetricCard
              label="Terkumpul"
              value={formatRupiah(summary.totalTerbayar)}
              subValue={`${summary.persentaseKoleksi}% dari tagihan`}
              hint="Tagihan customer status Lunas"
              valueClassName="text-emerald-600 text-xl"
            />
            <ReportMetricCard
              label="Piutang"
              value={formatRupiah(summary.totalPiutang)}
              hint="Tagihan belum bayar + menunggu konfirmasi"
              valueClassName="text-amber-600 text-xl"
            />
            <ReportMetricCard
              label="Jatuh Tempo / Konfirmasi"
              value={`${summary.tagihanJatuhTempo} / ${summary.tagihanMenungguKonfirmasi}`}
              hint="Jumlah tagihan lewat tempo / menunggu finance"
              valueClassName="text-amber-600"
            />
          </div>
        </section>
      )}

      {report && report.aging.some((a) => a.jumlahTagihan > 0) && (
        <section>
          <ReportSectionLabel>Aging Piutang</ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Jumlah Tagihan
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Total Nominal
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.aging
                  .filter((row) => row.jumlahTagihan > 0)
                  .map((row) => (
                    <tr key={row.bucket} className="border-b border-slate-50">
                      <td className="py-3 px-5 font-semibold text-slate-800">{row.label}</td>
                      <td className="py-3 px-5 text-right text-slate-600">
                        {row.jumlahTagihan}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-amber-600">
                        {formatRupiah(row.totalNominal)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <ReportSectionLabel>Analisis Penjualan</ReportSectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PenjualanStatusChart
            data={penjualanByStatus}
            onSegmentClick={(status, label) =>
              openDrilldown('penjualan', status, `Penjualan — ${label}`)
            }
          />
          <SalesTrendChart data={salesTrend} trendMonths={trendMonths} />
        </div>
      </section>

      <section>
        <ReportSectionLabel>Koleksi Pembayaran Customer</ReportSectionLabel>
        <CollectionTrendChart data={collectionTrend} />
      </section>

      {blokHeatmap.length > 0 && (
        <section>
          <ReportSectionLabel>Penjualan per Blok</ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <BlokHeatmapTable data={blokHeatmap} />
          </div>
        </section>
      )}

      {topAgents.length > 0 && (
        <section>
          <ReportSectionLabel>Performa Agent</ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Closing
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Fee
                  </th>
                </tr>
              </thead>
              <tbody>
                {topAgents.map((agent) => (
                  <tr key={agent.name} className="border-b border-slate-50">
                    <td className="py-3 px-5 font-semibold text-slate-800">{agent.name}</td>
                    <td className="py-3 px-5 text-right font-bold text-blue-600">
                      {agent.closing}
                    </td>
                    <td className="py-3 px-5 text-right text-slate-500">{agent.feeStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <ReportSectionLabel>Detail Penjualan & Pembayaran Customer</ReportSectionLabel>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          {!report || report.items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Tidak ada data penjualan untuk filter yang dipilih.
            </p>
          ) : (
            <table className="w-full text-[12px] min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="w-8 py-2.5 px-3" />
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Kavling
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    No. Transaksi
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Harga Jual
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Terbayar
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Piutang
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.items.map((item) => {
                  const isExpanded = expandedPenjualan === item.penjualanId;

                  return (
                    <Fragment key={item.penjualanId}>
                      <tr
                        className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer"
                        onClick={() =>
                          setExpandedPenjualan(isExpanded ? null : item.penjualanId)
                        }
                      >
                        <td className="py-2 px-3 text-slate-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {item.customerNama}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{item.kavlingLabel}</td>
                        <td className="py-2 px-3 text-slate-500">{item.noTransaksi}</td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {formatDate(item.tanggal)}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{item.status}</td>
                        <td className="py-2 px-3 text-slate-500">{item.agentNama ?? '—'}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">
                          {formatRupiah(item.hargaJual)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600">
                          {item.persentaseTerbayar}%
                        </td>
                        <td className="py-2 px-3 text-right text-amber-600">
                          {item.totalPiutang > 0 ? formatRupiah(item.totalPiutang) : '—'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${item.penjualanId}-detail`} className="bg-slate-50/40">
                          <td colSpan={10} className="py-2 px-4">
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-2 text-[11px] text-slate-500">
                              <span>
                                Total tagihan: <strong>{formatRupiah(item.totalTagihan)}</strong>
                              </span>
                              <span>
                                Terbayar:{' '}
                                <strong className="text-emerald-600">
                                  {formatRupiah(item.totalTerbayar)}
                                </strong>
                              </span>
                              <span>
                                Cara bayar:{' '}
                                <strong>
                                  {item.caraPembayaran?.replace(/_/g, ' ') ?? '—'}
                                </strong>
                              </span>
                            </div>
                            {item.tagihan.length === 0 ? (
                              <p className="text-[11px] text-slate-400 py-1">Belum ada tagihan.</p>
                            ) : (
                              <table className="w-full text-[11px] border border-slate-100 rounded-lg overflow-hidden bg-white">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-400">
                                    <th className="text-left py-1.5 px-3 font-semibold">No. Tagihan</th>
                                    <th className="text-left py-1.5 px-3 font-semibold">Tujuan</th>
                                    <th className="text-left py-1.5 px-3 font-semibold">Jatuh Tempo</th>
                                    <th className="text-right py-1.5 px-3 font-semibold">Nominal</th>
                                    <th className="text-right py-1.5 px-3 font-semibold">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.tagihan.map((t) => (
                                    <tr key={t.id} className="border-t border-slate-50">
                                      <td className="py-1.5 px-3 text-slate-700">{t.noTagihan}</td>
                                      <td className="py-1.5 px-3 text-slate-500">{t.tujuanLabel}</td>
                                      <td className="py-1.5 px-3 text-slate-500">
                                        {formatDate(t.jatuhTempo)}
                                        {t.hariTerlambat > 0 && (
                                          <span className="ml-1 text-amber-600 font-semibold">
                                            (+{t.hariTerlambat}h)
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-semibold">
                                        {formatRupiah(t.nominal)}
                                      </td>
                                      <td className="py-1.5 px-3 text-right">
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            TAGIHAN_STATUS_STYLE[t.status] ??
                                            'bg-slate-100 text-slate-500'
                                          }`}
                                        >
                                          {t.status.replace(/_/g, ' ')}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {documentAlerts.length > 0 && (
        <section>
          <ReportSectionLabel>
            <span className="flex items-center gap-2">
              <AlertTriangle size={12} className="text-amber-500" />
              Dokumen Belum Lengkap
            </span>
          </ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-amber-50/30">
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Kavling
                  </th>
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Dokumen Kurang
                  </th>
                </tr>
              </thead>
              <tbody>
                {documentAlerts.map((alert) => (
                  <tr key={`${alert.customer}-${alert.kavling}`} className="border-b border-slate-50">
                    <td className="py-3 px-5 font-medium text-slate-800">{alert.customer}</td>
                    <td className="py-3 px-5 text-slate-600">{alert.kavling}</td>
                    <td className="py-3 px-5 text-amber-700 font-medium">
                      {alert.missing.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DashboardDrilldownModal
        isOpen={drilldown !== null}
        onClose={() => setDrilldown(null)}
        title={drilldown?.title ?? 'Detail'}
        items={drilldownItems}
        isLoading={drilldownLoading}
        onItemClick={() => {
          navigate('/management/penjualan');
          setDrilldown(null);
        }}
      />
    </ReportPageLayout>
  );
};

export default LaporanPenjualan;
