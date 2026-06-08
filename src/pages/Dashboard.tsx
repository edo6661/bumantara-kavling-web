import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Building2,
  AlertCircle,
  HardHat,
  ArrowUpRight,
  Clock,
  Award,
  FileText,
  ChevronRight,
  TrendingUp,
  Users,
  ClipboardCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { useGetDashboardSummary, useGetDashboardDrilldown } from '../hooks/queries/useDashboard';
import type { DashboardDrilldownCategory, DashboardKpiPeriod } from '../services/dashboard.service';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';
import KpiCard from '../components/dashboard/KpiCard';
import {
  RevenueTrendChart,
  SalesTrendChart,
  CollectionTrendChart,
  KavlingStatusChart,
  PenjualanStatusChart,
  TagihanStatusChart,
  ProgressBreakdownChart,
} from '../components/dashboard/DashboardCharts';
import DashboardPeriodFilter from '../components/dashboard/DashboardPeriodFilter';
import KpiAlertBanner from '../components/dashboard/KpiAlertBanner';
import BlokHeatmap from '../components/dashboard/BlokHeatmap';
import DashboardDrilldownModal from '../components/dashboard/DashboardDrilldownModal';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
      {children}
    </span>
    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpiPeriod, setKpiPeriod] = useState<DashboardKpiPeriod>('month');
  const [trendMonths, setTrendMonths] = useState(6);
  const [drilldown, setDrilldown] = useState<{
    category: DashboardDrilldownCategory;
    filter?: string;
    blok?: string;
    title: string;
  } | null>(null);

  const { data: dashboardData, isLoading } = useGetDashboardSummary({
    period: kpiPeriod,
    months: trendMonths,
  });

  const { data: drilldownItems = [], isLoading: drilldownLoading } =
    useGetDashboardDrilldown(
      drilldown?.category ?? null,
      drilldown?.filter,
      drilldown?.blok,
      drilldown !== null,
    );

  const openDrilldown = (
    category: DashboardDrilldownCategory,
    filter: string | undefined,
    title: string,
    blok?: string,
  ) => {
    setDrilldown({ category, filter, blok, title });
  };

  const closeDrilldown = () => setDrilldown(null);

  if (isLoading || !dashboardData) return <PageLoader />;

  const {
    stats,
    recentTransactions,
    topAgents,
    documentAlerts,
    progressData,
    revenueTrend,
    salesTrend,
    collectionTrend,
    kavlingByStatus,
    penjualanByStatus,
    tagihanByStatus,
    progressBreakdown,
    blokHeatmap,
    kpiAlerts,
    filters,
  } = dashboardData;

  const soldPercent =
    stats.totalKavling > 0
      ? Math.round((stats.kavlingTerjual / stats.totalKavling) * 100)
      : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 17) return 'Selamat siang';
    return 'Selamat malam';
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {/* Top ambient gradient */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-50/60 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-5 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div className="flex items-center gap-4">
            {/* Accent line */}
            <div className="w-1 h-14 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                {getGreeting()}
              </p>
              <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">
                {user?.username ?? 'Pengguna'} 👋
              </h1>
              <p className="text-[12px] text-slate-400 mt-1.5 font-medium">
                Ringkasan keputusan — lihat kondisi, pahami perubahan, tentukan tindakan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date chip */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl text-sm text-slate-500 shadow-sm shadow-slate-200/80 border border-slate-100">
              <Clock size={13} className="text-blue-400" />
              <span className="font-semibold text-[12px]">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <DashboardPeriodFilter
              kpiPeriod={kpiPeriod}
              trendMonths={trendMonths}
              onKpiPeriodChange={setKpiPeriod}
              onTrendMonthsChange={setTrendMonths}
            />
          </div>
        </div>

        {/* ── Alert Banner ───────────────────────────────────── */}
        <KpiAlertBanner alerts={kpiAlerts} />

        {/* ── KPI Cards ──────────────────────────────────────── */}
        <section>
          <SectionLabel>KPI Utama</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title={`Pendapatan ${filters.kpiPeriodLabel}`}
              value={formatRupiah(stats.pendapatanBulanIni)}
              subtitle={`Total kumulatif: ${formatRupiah(stats.totalPendapatan)}`}
              comparison={stats.kpiComparison.pendapatan}
              comparisonLabel={filters.comparisonLabel}
              actionHint="Cek tagihan belum lunas jika pendapatan turun"
              severity="normal"
              icon={Wallet}
              onClick={() => navigate('/customer/tagihan')}
            />
            <KpiCard
              title={`Penjualan ${filters.kpiPeriodLabel}`}
              value={`${stats.penjualanBulanIni} Unit`}
              subtitle={`${soldPercent}% dari ${stats.totalKavling} kavling terjual`}
              comparison={stats.kpiComparison.penjualan}
              comparisonLabel={filters.comparisonLabel}
              actionHint="Follow-up prospek jika closing menurun"
              severity="normal"
              icon={Building2}
              onClick={() => navigate('/management/penjualan')}
            />
            <KpiCard
              title="Tagihan Jatuh Tempo"
              value={formatRupiah(stats.tagihanJatuhTempo)}
              subtitle={`${stats.customerJatuhTempo} customer terdampak`}
              actionHint="Hubungi customer & kirim reminder segera"
              severity={stats.customerJatuhTempo > 0 ? 'critical' : 'normal'}
              icon={AlertCircle}
              onClick={() => navigate('/customer/tagihan')}
            />
            <KpiCard
              title="Menunggu Konfirmasi"
              value={`${stats.tagihanMenungguKonfirmasi} Tagihan`}
              subtitle={formatRupiah(stats.tagihanMenungguKonfirmasiNominal)}
              actionHint="Verifikasi bukti transfer hari ini"
              severity={stats.tagihanMenungguKonfirmasi > 0 ? 'warning' : 'normal'}
              icon={ClipboardCheck}
              onClick={() => navigate('/customer/tagihan')}
            />
          </div>
        </section>

        {/* ── Trend Charts ───────────────────────────────────── */}
        <section>
          <SectionLabel>Tren & Perubahan</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <RevenueTrendChart data={revenueTrend} trendMonths={trendMonths} />
            <SalesTrendChart data={salesTrend} trendMonths={trendMonths} />
            <CollectionTrendChart data={collectionTrend} />
          </div>
        </section>

        {/* ── Heatmap ────────────────────────────────────────── */}
        <section>
          <SectionLabel>Kepadatan per Blok</SectionLabel>
          <BlokHeatmap
            data={blokHeatmap}
            onBlokClick={(blok) =>
              openDrilldown('kavling', undefined, `Kavling Blok ${blok}`, blok)
            }
          />
        </section>

        {/* ── Breakdown Charts ───────────────────────────────── */}
        <section>
          <SectionLabel>Breakdown & Komposisi</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <KavlingStatusChart
              data={kavlingByStatus}
              onSegmentClick={(status, label) =>
                openDrilldown('kavling', status, `Kavling — ${label}`)
              }
            />
            <PenjualanStatusChart
              data={penjualanByStatus}
              onSegmentClick={(status, label) =>
                openDrilldown('penjualan', status, `Penjualan — ${label}`)
              }
            />
            <TagihanStatusChart
              data={tagihanByStatus}
              onSegmentClick={(status, label) =>
                openDrilldown('tagihan', status, `Tagihan — ${label}`)
              }
            />
            {progressBreakdown.length > 0 ? (
              <ProgressBreakdownChart
                data={progressBreakdown}
                onSegmentClick={(range) =>
                  openDrilldown('progress', range, `Proyek — Progress ${range}`)
                }
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center justify-center min-h-[280px] shadow-sm shadow-slate-100/80">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                  <HardHat size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-400 text-[13px] text-center font-medium">
                  Belum ada data progress proyek
                </p>
                <button
                  onClick={() => navigate('/proyek/spk')}
                  className="mt-3 text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Kelola SPK <ArrowUpRight size={12} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Proyek Snapshot ────────────────────────────────── */}
        <section>
          <SectionLabel>Proyek Aktif</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Proyek Aktif (SPK)"
              value={`${stats.proyekAktif} Unit`}
              subtitle={`Rata-rata progress: ${Math.round(stats.rataRataProgress)}%`}
              actionHint="Review unit progress di bawah 50%"
              severity="warning"
              icon={HardHat}
              onClick={() => navigate('/proyek/spk')}
            />

            <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
              {/* Card header with subtle gradient */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
                    Progress Proyek Terkini
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Unit lambat? Eskalasi ke mandor terkait
                  </p>
                </div>
                <button
                  onClick={() => navigate('/proyek/spk')}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Detail <ArrowUpRight size={12} />
                </button>
              </div>

              <div className="p-4">
                {progressData.length > 0 ? (
                  <div className="space-y-1.5">
                    {progressData.map((prog, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Rank number */}
                        <span className="text-[11px] font-black text-slate-300 w-5 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-[13px] truncate">
                            {prog.kavling}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {prog.customer} · {prog.tahap}
                          </p>
                        </div>
                        {/* Progress bar area */}
                        <div className="w-32 shrink-0">
                          <div className="flex justify-between items-center text-[10px] mb-1.5">
                            <span
                              className={`font-black ${prog.isLate ? 'text-red-500' : 'text-slate-600'}`}
                            >
                              {prog.progress}%
                            </span>
                            {prog.isLate && (
                              <span className="text-[9px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                                LAMBAT
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                prog.isLate
                                  ? 'bg-gradient-to-r from-red-400 to-rose-500'
                                  : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                              }`}
                              style={{ width: `${Math.min(prog.progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <Zap size={24} className="text-slate-200 mb-2" />
                    <p className="text-slate-400 text-[13px] font-medium">
                      Belum ada laporan progress
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Detail & Actions ───────────────────────────────── */}
        <section>
          <SectionLabel>Detail & Tindakan</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Recent transactions */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
                    Penjualan Terbaru
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Transaksi baru? Pastikan dokumen &amp; tagihan ter-generate
                  </p>
                </div>
                <button
                  onClick={() => navigate('/management/penjualan')}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Lihat Semua <ArrowUpRight size={12} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                        Customer
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                        Blok
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                        Nilai
                      </th>
                      <th className="text-center px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((trx, idx) => (
                        <tr
                          key={trx.id}
                          className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                          onClick={() => navigate('/management/penjualan')}
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          <td className="px-6 py-3.5">
                            <p className="font-bold text-slate-900 text-[13px]">{trx.customer}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{trx.date}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block text-[11px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg tracking-wider">
                              {trx.kavling}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-[13px] font-black text-slate-900">
                              {formatRupiah(trx.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] rounded-full ${
                                trx.status === 'LUNAS'
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                  : trx.status === 'PROSES'
                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                              }`}
                            >
                              {trx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-14 text-center">
                          <TrendingUp size={28} className="text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-400 text-[13px] font-medium">
                            Belum ada transaksi terbaru.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Agent */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden flex flex-col">
              <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center">
                  <Award size={18} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
                    Top Agent
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {filters.kpiPeriodLabel} · Reward top performer
                  </p>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-1.5">
                {topAgents.length > 0 ? (
                  topAgents.map((agent, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[12px] shrink-0 ${
                          idx === 0
                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-400/30'
                            : idx === 1
                              ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-[13px] truncate">
                          {agent.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {agent.closing} closing
                        </p>
                      </div>
                 
                    </div>
                  ))
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <Users size={26} className="text-slate-200 mb-2" />
                    <p className="text-slate-400 text-[13px] font-medium">
                      Belum ada closing bulan ini.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={() => navigate('/marketing/fee-agent')}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors ring-1 ring-slate-200"
                >
                  Lihat Data Fee <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Document Alerts */}
          <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${documentAlerts.length > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <FileText
                    size={16}
                    className={documentAlerts.length > 0 ? 'text-red-500' : 'text-emerald-500'}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[14px] tracking-tight">
                    Alert Dokumen
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Customer aktif (Booked/Proses) belum lengkap berkas
                  </p>
                </div>
              </div>
              {documentAlerts.length > 0 ? (
                <span className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 text-[11px] font-black rounded-full ring-1 ring-red-200 shrink-0">
                  {documentAlerts.length} perlu tindakan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-full ring-1 ring-emerald-200 shrink-0">
                  <CheckCircle2 size={12} /> Semua lengkap
                </span>
              )}
            </div>

            {documentAlerts.length > 0 ? (
              <div className="p-5">
                <p className="text-[11px] text-blue-600 font-bold mb-4 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-blue-500 inline-block" />
                  Hubungi customer &amp; minta upload dokumen sebelum proses akad
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {documentAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-red-100 bg-red-50/40 rounded-xl cursor-pointer hover:bg-red-50/70 hover:border-red-200 hover:shadow-sm transition-all group"
                      onClick={() => navigate('/customer/administrasi')}
                    >
                      <div className="flex justify-between items-start mb-2.5">
                        <p className="font-bold text-slate-900 text-[13px]">{alert.customer}</p>
                        <span className="text-[10px] font-black text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shrink-0 ml-2 tracking-wider">
                          {alert.kavling}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {alert.missing.map((doc, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md ring-1 ring-red-200"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/customer/administrasi')}
                  className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-[12px] font-black text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors ring-1 ring-red-200"
                >
                  Kelola Dokumen Customer <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <FileText size={22} className="text-emerald-400" />
                </div>
                <p className="text-slate-700 text-[13px] font-bold">
                  Semua dokumen customer aktif sudah lengkap
                </p>
                <p className="text-slate-400 text-[11px] mt-1 font-medium">Tidak ada tindakan diperlukan</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <DashboardDrilldownModal
        isOpen={drilldown !== null}
        onClose={closeDrilldown}
        title={drilldown?.title ?? 'Detail'}
        items={drilldownItems}
        isLoading={drilldownLoading}
        onItemClick={() => {
          if (drilldown?.category === 'kavling' || drilldown?.category === 'penjualan') {
            navigate('/management/penjualan');
          } else if (drilldown?.category === 'tagihan') {
            navigate('/customer/tagihan');
          } else {
            navigate('/proyek/spk');
          }
          closeDrilldown();
        }}
      />
    </div>
  );
};

export default Dashboard;