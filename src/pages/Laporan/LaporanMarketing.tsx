import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { useGetMarketingReport } from '../../hooks/queries/useMarketingReport';
import type { MarketingReportParams } from '../../services/report.service';
import { reportService } from '../../services/report.service';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import { PenjualanStatusChart, SalesTrendChart } from '../../components/dashboard/DashboardCharts';
import { useGetAgents } from '../../hooks/queries/useAgent';
import { useDefaultPerumahanId } from '../../hooks/useDefaultPerumahanId';
import { DEFAULT_PERUMAHAN_NAME } from '../../constants/perumahan';
import { handleApiError } from '../../utils/errorHandler';
import { formatRupiah, formatDate } from '../../utils/formatters';

const LaporanMarketing = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<MarketingReportParams>({});
  const [appliedFilters, setAppliedFilters] = useState<MarketingReportParams>({});
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'agent' | 'perusahaan' | 'fee'>('agent');

  const { perumahanId: defaultPerumahanId, isLoading: loadingPerumahan } =
    useDefaultPerumahanId();
  const effectiveFilters = useMemo(
    () =>
      defaultPerumahanId
        ? { ...appliedFilters, perumahanId: defaultPerumahanId }
        : appliedFilters,
    [appliedFilters, defaultPerumahanId],
  );

  const { data: report, isLoading, isFetching } = useGetMarketingReport(
    effectiveFilters,
    !!defaultPerumahanId,
  );
  const { data: agents = [] } = useGetAgents();

  const agentOptions = useMemo(
    () => agents.map((a) => ({ value: String(a.id), label: a.nama })),
    [agents],
  );

  const salesTrend = useMemo(
    () =>
      (report?.penjualanBulanan ?? []).map((m) => ({
        label: m.bulanLabel,
        value: m.count,
      })),
    [report?.penjualanBulanan],
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await reportService.exportMarketingExcel(effectiveFilters);
    } catch (error: unknown) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      setIsExporting(false);
    }
  };

  if (loadingPerumahan || (isLoading && !report)) return <PageLoader />;

  const summary = report?.summary;

  return (
    <ReportPageLayout
      title="Laporan Marketing"
      subtitle="Performa agent, fee marketing, konversi penjualan, dan performa per perusahaan"
      icon={Megaphone}
      actions={
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors"
        >
          {isExporting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {isExporting ? 'Mengekspor...' : 'Export Excel'}
        </button>
      }
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
                label="Agent"
                value={filters.agentId ? String(filters.agentId) : ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    agentId: e.target.value ? Number(e.target.value) : undefined,
                    perusahaanAgentId: undefined,
                  }))
                }
                options={[{ value: '', label: 'Semua Agent' }, ...agentOptions]}
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
                onClick={() => {
                  const { perusahaanAgentId: _, ...next } = filters;
                  setAppliedFilters(next);
                }}
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
          <ReportSectionLabel>Ringkasan Penjualan & Fee</ReportSectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <ReportMetricCard
              label="Kavling Terjual"
              value={`${summary.kavlingTerjual} / ${summary.totalKavling}`}
              hint="Status kavling terjual vs total"
            />
            <ReportMetricCard
              label="Penjualan Bulan Ini"
              value={`${summary.penjualanPeriode} unit`}
              hint="Transaksi baru bulan berjalan"
              valueClassName="text-blue-600"
            />
            <ReportMetricCard
              label="Agent Aktif"
              value={summary.totalAgentAktif}
              hint="Agent berstatus aktif"
            />
            <ReportMetricCard
              label="Penjualan (Filter)"
              value={summary.jumlahPenjualan}
              hint="Transaksi sesuai filter periode"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <ReportMetricCard
              compact
              label="Fee Booking"
              value={formatRupiah(summary.totalFeeBooking)}
              hint="Total fee booking agent"
            />
            <ReportMetricCard
              compact
              label="Fee Closing"
              value={formatRupiah(summary.totalFeeClosing)}
              hint="Total fee closing agent"
            />
            <ReportMetricCard
              compact
              label="Fee Marketing"
              value={formatRupiah(summary.totalFeeMarketing)}
              hint="Total fee marketing agent"
            />
            <ReportMetricCard
              compact
              className="bg-amber-50 border-amber-100"
              label="Belum Dibayar"
              value={formatRupiah(summary.feeBelumDibayar)}
              hint="Fee ada nominal, belum ada bukti bayar"
              valueClassName="text-amber-700"
            />
          </div>
        </section>
      )}

      {report && report.byStatus.length > 0 && (
        <section>
          <ReportSectionLabel>Pipeline Penjualan</ReportSectionLabel>
          <PenjualanStatusChart data={report.byStatus} />
        </section>
      )}

      {salesTrend.length > 0 && (
        <section>
          <ReportSectionLabel>Tren Penjualan</ReportSectionLabel>
          <SalesTrendChart data={salesTrend} trendMonths={salesTrend.length} />
        </section>
      )}

      {report && (
        <section>
          <ReportSectionLabel>Detail Performa</ReportSectionLabel>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('agent')}
              className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-colors ${
                activeTab === 'agent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Per Agent ({report.byAgent.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('perusahaan')}
              className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-colors ${
                activeTab === 'perusahaan'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Per Perusahaan ({report.byPerusahaan.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fee')}
              className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-colors ${
                activeTab === 'fee'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Detail Fee ({report.feeItems.length})
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {activeTab === 'agent' && (
              report.byAgent.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Belum ada data agent.</p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Booked
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Proses
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Lunas
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Konversi
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Total Fee
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Belum Bayar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byAgent.map((agent, idx) => (
                      <tr
                        key={agent.agentId}
                        className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer"
                        onClick={() => navigate('/marketing/fee-agent')}
                      >
                        <td className="py-3 px-5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-5">
                          <p className="font-semibold text-slate-800">{agent.nama}</p>
                          {agent.perusahaanNama && (
                            <p className="text-[11px] text-slate-400">{agent.perusahaanNama}</p>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right text-slate-600">{agent.booked}</td>
                        <td className="py-3 px-5 text-right text-blue-600">{agent.proses}</td>
                        <td className="py-3 px-5 text-right font-bold text-emerald-600">
                          {agent.lunas}
                        </td>
                        <td className="py-3 px-5 text-right text-slate-600">
                          {agent.konversiRate}%
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-slate-800">
                          {formatRupiah(
                            agent.totalFeeBooking +
                              agent.totalFeeClosing +
                              agent.totalFeeMarketing,
                          )}
                        </td>
                        <td className="py-3 px-5 text-right text-amber-600">
                          {formatRupiah(agent.feeBelumDibayar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'perusahaan' && (
              report.byPerusahaan.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Belum ada data perusahaan agent.
                </p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Perusahaan
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Closing
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Total Fee
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Sudah Dibayar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byPerusahaan.map((row) => (
                      <tr key={row.perusahaanAgentId} className="border-b border-slate-50">
                        <td className="py-3 px-5 font-semibold text-slate-800">{row.nama}</td>
                        <td className="py-3 px-5 text-right text-slate-600">{row.jumlahAgent}</td>
                        <td className="py-3 px-5 text-right font-bold text-blue-600">
                          {row.totalClosing}
                        </td>
                        <td className="py-3 px-5 text-right text-slate-800">
                          {formatRupiah(row.totalFee)}
                        </td>
                        <td className="py-3 px-5 text-right text-emerald-600">
                          {formatRupiah(row.feeSudahDibayar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'fee' && (
              report.feeItems.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Belum ada data fee.</p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Transaksi
                      </th>
                      <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Booking
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Closing
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Marketing
                      </th>
                      <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.feeItems.map((row) => (
                      <tr
                        key={row.feeId}
                        className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer"
                        onClick={() => navigate('/marketing/fee-agent')}
                      >
                        <td className="py-3 px-5">
                          <p className="font-semibold text-slate-800">{row.noTransaksi}</p>
                          <p className="text-[11px] text-slate-400">{row.customerNama}</p>
                          <p className="text-[10px] text-slate-400">
                            {row.kavlingLabel} · {formatDate(row.tanggal)}
                          </p>
                        </td>
                        <td className="py-3 px-5 text-slate-600">{row.agentNama}</td>
                        <td className="py-3 px-5 text-right">
                          <span className={row.bookingSudahDibayar ? 'text-emerald-600' : 'text-amber-600'}>
                            {formatRupiah(row.bookingNominal)}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className={row.closingSudahDibayar ? 'text-emerald-600' : 'text-amber-600'}>
                            {formatRupiah(row.closingNominal)}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className={row.marketingSudahDibayar ? 'text-emerald-600' : 'text-amber-600'}>
                            {formatRupiah(row.marketingNominal)}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-slate-800">
                          {formatRupiah(row.totalFee)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </section>
      )}
    </ReportPageLayout>
  );
};

export default LaporanMarketing;
