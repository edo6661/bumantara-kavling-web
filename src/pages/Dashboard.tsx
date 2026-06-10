import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Clock,
  FileSignature,
  Home,
  Landmark,
  Layers,
  ShoppingCart,
} from 'lucide-react';
import { useGetDashboardSummary, useGetDashboardDrilldown } from '../hooks/queries/useDashboard';
import type { DashboardDrilldownCategory } from '../services/dashboard.service';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';
import KpiCard from '../components/dashboard/KpiCard';
import DashboardMonthlyReportCard from '../components/dashboard/DashboardMonthlyReportCard';
import DashboardTodayUnits from '../components/dashboard/DashboardTodayUnits';
import BookingRateChart from '../components/dashboard/BookingRateChart';
import DashboardDrilldownModal from '../components/dashboard/DashboardDrilldownModal';
import { DASHBOARD_COLORS } from '../components/dashboard/dashboardTheme';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
      {children}
    </span>
    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
  </div>
);

type DrilldownState = {
  category: DashboardDrilldownCategory;
  filter?: string;
  title: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);

  const { data: dashboardData, isLoading } = useGetDashboardSummary();

  const { data: drilldownItems = [], isLoading: drilldownLoading } =
    useGetDashboardDrilldown(
      drilldown?.category ?? null,
      drilldown?.filter,
      undefined,
      drilldown !== null,
    );

  const openDrilldown = (
    category: DashboardDrilldownCategory,
    filter: string | undefined,
    title: string,
  ) => {
    setDrilldown({ category, filter, title });
  };

  const closeDrilldown = () => setDrilldown(null);

  if (isLoading || !dashboardData?.executive) return <PageLoader />;

  const { executive } = dashboardData;
  const { kpi, year } = executive;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 17) return 'Selamat siang';
    return 'Selamat malam';
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-50/60 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-5 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-500 to-violet-500" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-1 h-14 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                  {getGreeting()}
                </p>
                <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">
                  {user?.username ?? 'Pengguna'} 👋
                </h1>
                <p className="text-[12px] text-slate-400 mt-1.5 font-medium">
                  Dashboard operasional — ringkasan unit, akad, dan pendapatan tahun {year}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-2xl text-sm text-slate-500 border border-slate-100">
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
          </div>
        </div>

        {/* KPI Cards */}
        <section>
          <SectionLabel>Ringkasan Utama</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <KpiCard
              title="Unit Tersedia"
              value={`${kpi.unitTersedia} Unit`}
              subtitle="Kavling siap dijual"
              icon={Home}
              onClick={() => openDrilldown('kavling', 'AVAILABLE', 'Kavling Tersedia')}
            />
            <KpiCard
              title="Akad Bulan Ini"
              value={`${kpi.akadBulanIni} Unit`}
              subtitle="Berdasarkan tanggal akad PPJB"
              icon={FileSignature}
              onClick={() =>
                openDrilldown('penjualan', 'AKAD_BULAN_INI', 'Akad Bulan Ini')
              }
            />
            <KpiCard
              title="Unit Ter-Booking Hari Ini"
              value={`${kpi.unitBookingHariIni} Unit`}
              subtitle="Penjualan baru hari ini"
              icon={ShoppingCart}
              onClick={() =>
                openDrilldown('penjualan', 'BOOKED_TODAY', 'Booking Hari Ini')
              }
            />
            <KpiCard
              title="Unit Ter-Proses Hari Ini"
              value={`${kpi.unitProsesHariIni} Unit`}
              subtitle="Unit masuk proses hari ini"
              icon={Layers}
              onClick={() =>
                openDrilldown('penjualan', 'PROSES_TODAY', 'Proses Hari Ini')
              }
            />
            <KpiCard
              title="Total Unit KPR"
              value={`${kpi.totalUnitKpr} Unit`}
              subtitle="All time — non batal"
              icon={Landmark}
              onClick={() => openDrilldown('penjualan', 'KPR', 'Penjualan KPR')}
            />
            <KpiCard
              title="Total Unit Cash Bertahap"
              value={`${kpi.totalUnitCashBertahap} Unit`}
              subtitle="All time — non batal"
              icon={Building2}
              onClick={() =>
                openDrilldown('penjualan', 'CASH_BERTAHAP', 'Penjualan Cash Bertahap')
              }
            />
          </div>
        </section>

        {/* Unit Hari Ini */}
        <section>
          <SectionLabel>Per Hari Ini</SectionLabel>
          <DashboardTodayUnits
            todayDate={executive.todayDate ?? new Date().toISOString().substring(0, 10)}
            bookingHariIni={executive.bookingHariIni ?? []}
            prosesHariIni={executive.prosesHariIni ?? []}
            onItemClick={() => navigate('/management/penjualan')}
            onViewAllBooking={() =>
              openDrilldown('penjualan', 'BOOKED_TODAY', 'Booking Hari Ini')
            }
            onViewAllProses={() =>
              openDrilldown('penjualan', 'PROSES_TODAY', 'Proses Hari Ini')
            }
          />
        </section>

        {/* Laporan Tahunan */}
        <section>
          <SectionLabel>Laporan Tahun {year}</SectionLabel>
          <div className="space-y-4">
            <DashboardMonthlyReportCard
              title={`Pendapatan Tahun ${year}`}
              subtitle="Nominal tagihan customer status Lunas (booking fee, DP, cicilan, dll.) per bulan dikonfirmasi"
              year={year}
              rows={executive.pendapatanTahunIni}
              totalLabel="Total Pendapatan"
              chartColor={DASHBOARD_COLORS.success}
            />
            <DashboardMonthlyReportCard
              title={`Akad Tahun ${year}`}
              subtitle="Total harga jual unit yang tanggal akad PPJB-nya jatuh di bulan tersebut"
              year={year}
              rows={executive.akadTahunIni}
              showCount
              totalLabel="Total Akad"
              chartColor={DASHBOARD_COLORS.primary}
            />
            <DashboardMonthlyReportCard
              title={`Penjualan Cash Keras & Cash Bertahap Tahun ${year}`}
              subtitle="Total harga jual penjualan Cash Keras & Bertahap baru, dihitung saat transaksi dibuat"
              year={year}
              rows={executive.penjualanCashTahunIni}
              showCount
              totalLabel="Total Penjualan Cash"
              chartColor={DASHBOARD_COLORS.warning}
            />
          </div>
        </section>

        {/* Booking Rate Chart */}
        <section>
          <SectionLabel>Tingkat Pemesanan</SectionLabel>
          <BookingRateChart year={year} data={executive.tingkatPemesanan} />
        </section>
      </div>

      <DashboardDrilldownModal
        isOpen={drilldown !== null}
        onClose={closeDrilldown}
        title={drilldown?.title ?? 'Detail'}
        items={drilldownItems}
        isLoading={drilldownLoading}
        onItemClick={() => {
          if (drilldown?.category === 'kavling') {
            navigate('/management/kavling');
          } else {
            navigate('/management/penjualan');
          }
          closeDrilldown();
        }}
      />
    </div>
  );
};

export default Dashboard;
