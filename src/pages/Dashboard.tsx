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
import { useGetDashboardSummary, useGetDashboardDrilldown, useGetPenjualanPeriodeSummary } from '../hooks/queries/useDashboard';
import {
  buildPendapatanDrilldownFilter,
  buildAkadDrilldownFilter,
  buildPenjualanPeriodeDrilldownFilter,
  isPendapatanDrilldownFilter,
  isPenjualanPeriodDrilldownFilter,
  parsePenjualanBulanDrilldownFilter,
  parsePenjualanPeriodeDrilldownFilter,
  type DashboardDrilldownCategory,
  type DrilldownItem,
  type PenjualanBulanCaraPembayaran,
} from '../services/dashboard.service';
import { buildManajemenTransaksiSearchPath, MANAJEMEN_TRANSAKSI_PATH } from '../utils/customerNavigation';
import {
  formatPenjualanPeriodeTitle,
  getCurrentMonthDateRange,
  monthRangeFromYearMonth,
} from '../utils/penjualanPeriode';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';
import KpiCard from '../components/dashboard/KpiCard';
import DashboardMonthlyReportCard from '../components/dashboard/DashboardMonthlyReportCard';
import DashboardTodayUnits from '../components/dashboard/DashboardTodayUnits';
import DashboardDrilldownModal from '../components/dashboard/DashboardDrilldownModal';
import DashboardKavlingOverview, {
  type KavlingOverviewAction,
} from '../components/dashboard/DashboardKavlingOverview';
import DashboardMonthlySalesSection from '../components/dashboard/DashboardMonthlySalesSection';
import { DASHBOARD_COLORS } from '../components/dashboard/dashboardTheme';

function parsePenjualanSalesDrilldownFilter(filter?: string): {
  dateFrom: string;
  dateTo: string;
  caraPembayaran: PenjualanBulanCaraPembayaran;
} | null {
  const periode = parsePenjualanPeriodeDrilldownFilter(filter);
  if (periode) return periode;

  const bulan = parsePenjualanBulanDrilldownFilter(filter);
  if (!bulan) return null;

  const range = monthRangeFromYearMonth(bulan.year, bulan.month);
  return {
    dateFrom: range.from,
    dateTo: range.to,
    caraPembayaran: bulan.caraPembayaran,
  };
}

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
  blok?: string;
  title: string;
  navigateByCustomer?: boolean;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);
  const initialSalesRange = getCurrentMonthDateRange();
  const [salesDateFrom, setSalesDateFrom] = useState(initialSalesRange.from);
  const [salesDateTo, setSalesDateTo] = useState(initialSalesRange.to);

  const { data: dashboardData, isLoading } = useGetDashboardSummary();

  const { data: penjualanPeriodeSummary, isLoading: penjualanPeriodeLoading } =
    useGetPenjualanPeriodeSummary(salesDateFrom, salesDateTo, !isLoading);

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
    options?: { blok?: string; navigateByCustomer?: boolean },
  ) => {
    setDrilldown({
      category,
      filter,
      title,
      blok: options?.blok,
      navigateByCustomer: options?.navigateByCustomer,
    });
  };

  const closeDrilldown = () => setDrilldown(null);

  const navigateToPenjualan = (search?: string) => {
    closeDrilldown();
    navigate(
      search
        ? `/management/penjualan?search=${encodeURIComponent(search)}`
        : '/management/penjualan',
    );
  };

  const navigateToKavling = (status?: string) => {
    closeDrilldown();
    navigate(status ? `/management/kavling?status=${status}` : '/management/kavling');
  };

  const handleKavlingAction = (action: KavlingOverviewAction) => {
    if (action.type === 'navigate-all') {
      navigate('/management/kavling');
      return;
    }
    openDrilldown('kavling', action.status, `Kavling ${action.label}`);
  };

  if (isLoading || !dashboardData?.executive) return <PageLoader />;

  const { executive, stats, kavlingByStatus } = dashboardData;
  const { kpi, year } = executive;

  const handleMonthlySalesCaraClick = (
    cara: PenjualanBulanCaraPembayaran,
    title: string,
  ) => {
    openDrilldown(
      'penjualan',
      buildPenjualanPeriodeDrilldownFilter(salesDateFrom, salesDateTo, cara),
      title,
      { navigateByCustomer: true },
    );
  };

  const penjualanSalesDrilldown = parsePenjualanSalesDrilldownFilter(drilldown?.filter);

  const handlePenjualanPeriodeCaraChange = (cara: PenjualanBulanCaraPembayaran) => {
    if (!penjualanSalesDrilldown || !drilldown) return;
    setDrilldown({
      ...drilldown,
      filter: buildPenjualanPeriodeDrilldownFilter(
        penjualanSalesDrilldown.dateFrom,
        penjualanSalesDrilldown.dateTo,
        cara,
      ),
      title: formatPenjualanPeriodeTitle(
        penjualanSalesDrilldown.dateFrom,
        penjualanSalesDrilldown.dateTo,
      ),
    });
  };

  const handleSalesDateFromChange = (value: string) => {
    setSalesDateFrom(value);
    if (value && salesDateTo && value > salesDateTo) {
      setSalesDateTo(value);
    }
  };

  const handleSalesDateToChange = (value: string) => {
    setSalesDateTo(value);
    if (value && salesDateFrom && value < salesDateFrom) {
      setSalesDateFrom(value);
    }
  };

  const getKavlingCount = (status: string) =>
    kavlingByStatus.find((item) => item.status === status)?.count ?? 0;

  const kavlingOverview = {
    total: stats.totalKavling,
    tersedia: getKavlingCount('AVAILABLE'),
    terProses: getKavlingCount('BOOKING'),
    terjual: getKavlingCount('TERJUAL'),
  };

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
              icon={Landmark}
              onClick={() => openDrilldown('penjualan', 'KPR', 'Penjualan KPR')}
            />
            <KpiCard
              title="Total Unit Cash Bertahap"
              value={`${kpi.totalUnitCashBertahap} Unit`}
              icon={Building2}
              onClick={() =>
                openDrilldown('penjualan', 'CASH_BERTAHAP', 'Penjualan Cash Bertahap')
              }
            />
          </div>
        </section>

        {/* Penjualan Bulanan */}
        <section>
          <SectionLabel>Penjualan Bulanan</SectionLabel>
          <DashboardMonthlySalesSection
            dateFrom={salesDateFrom}
            dateTo={salesDateTo}
            onDateFromChange={handleSalesDateFromChange}
            onDateToChange={handleSalesDateToChange}
            summary={penjualanPeriodeSummary}
            isLoadingCounts={penjualanPeriodeLoading}
            onCaraClick={handleMonthlySalesCaraClick}
          />
        </section>

        {/* Kavling */}
        <section>
          <SectionLabel>Kavling</SectionLabel>
          <DashboardKavlingOverview
            total={kavlingOverview.total}
            tersedia={kavlingOverview.tersedia}
            terProses={kavlingOverview.terProses}
            terjual={kavlingOverview.terjual}
            kavlingByStatus={kavlingByStatus}
            onAction={handleKavlingAction}
          />
        </section>

        {/* Unit Hari Ini */}
        <section>
          <SectionLabel>Per Hari Ini</SectionLabel>
          <DashboardTodayUnits
            todayDate={executive.todayDate ?? new Date().toISOString().substring(0, 10)}
            bookingHariIni={executive.bookingHariIni ?? []}
            prosesHariIni={executive.prosesHariIni ?? []}
            onItemClick={(item) => navigateToPenjualan(item.id)}
            onViewAllBooking={() =>
              openDrilldown('penjualan', 'BOOKED_TODAY', 'Booking Hari Ini')
            }
            onViewAllProses={() =>
              openDrilldown('penjualan', 'PROSES_TODAY', 'Proses Hari Ini')
            }
          />
        </section>

        {/* Pendapatan All Time */}
        <section>
          <SectionLabel>Pendapatan</SectionLabel>
          <DashboardMonthlyReportCard
            title="Pendapatan All Time"
            subtitle="Seluruh tagihan customer status Lunas berdasarkan tanggal pembayaran (jatuh tempo). Klik periode untuk detail customer & bukti."
            totalPeriodLabel="All Time"
            periodColumnLabel="Periode"
            rows={executive.pendapatanAllTime ?? []}
            totalLabel="Total Pendapatan"
            chartColor={DASHBOARD_COLORS.success}
            onRowClick={(row) =>
              openDrilldown(
                'tagihan',
                buildPendapatanDrilldownFilter(row.year ?? year, row.month),
                `Pendapatan ${row.monthLabel}`,
              )
            }
          />
        </section>

        {/* Laporan Tahunan */}
        <section>
          <SectionLabel>Laporan Tahun {year}</SectionLabel>
          <div className="space-y-4">
            <DashboardMonthlyReportCard
              title={`Akad Tahun ${year}`}
              subtitle="Total harga jual unit yang tanggal akad PPJB-nya jatuh di bulan tersebut. Klik bulan untuk detail transaksi."
              year={year}
              rows={executive.akadTahunIni}
              showCount
              totalLabel="Total Akad"
              chartColor={DASHBOARD_COLORS.primary}
              onRowClick={(row) =>
                openDrilldown(
                  'penjualan',
                  buildAkadDrilldownFilter(year, row.month),
                  `Akad ${row.monthLabel}`,
                )
              }
            />
          </div>
        </section>
      </div>

      <DashboardDrilldownModal
        isOpen={drilldown !== null}
        onClose={closeDrilldown}
        title={drilldown?.title ?? 'Detail'}
        items={drilldownItems}
        isLoading={drilldownLoading}
        mode={isPendapatanDrilldownFilter(drilldown?.filter) ? 'pendapatan' : 'default'}
        entityLabel={
          isPendapatanDrilldownFilter(drilldown?.filter)
            ? 'pembayaran'
            : drilldown?.navigateByCustomer
              ? 'customer'
              : drilldown?.category === 'kavling'
                ? 'unit'
                : 'item'
        }
        emptyMessage={
          isPendapatanDrilldownFilter(drilldown?.filter)
            ? 'Tidak ada pembayaran untuk periode ini'
            : isPenjualanPeriodDrilldownFilter(drilldown?.filter)
              ? 'Tidak ada penjualan untuk periode dan cara pembayaran ini'
            : drilldown?.category === 'kavling'
              ? 'Tidak ada kavling untuk filter ini'
              : 'Tidak ada item untuk filter ini'
        }
        onViewAll={
          drilldown?.category === 'kavling'
            ? () => navigateToKavling(drilldown.filter)
            : drilldown?.category === 'penjualan' && !drilldown.navigateByCustomer
              ? () => navigateToPenjualan()
              : drilldown?.navigateByCustomer
                ? () => {
                    closeDrilldown();
                    navigate(MANAJEMEN_TRANSAKSI_PATH);
                  }
                : undefined
        }
        viewAllLabel={
          drilldown?.category === 'kavling'
            ? 'Lihat semua di Kavling'
            : drilldown?.navigateByCustomer
              ? 'Lihat semua di Manajemen Transaksi'
              : drilldown?.category === 'penjualan'
                ? 'Lihat semua di Penjualan'
                : 'Lihat semua'
        }
        onItemClick={
          isPendapatanDrilldownFilter(drilldown?.filter)
            ? undefined
            : (item: DrilldownItem) => {
                if (drilldown?.navigateByCustomer) {
                  closeDrilldown();
                  navigate(buildManajemenTransaksiSearchPath(item.label));
                  return;
                }
                if (drilldown?.category === 'kavling') {
                  navigateToKavling(drilldown.filter);
                } else {
                  navigateToPenjualan(item.id);
                }
              }
        }
        penjualanBulanCara={penjualanSalesDrilldown?.caraPembayaran}
        onPenjualanBulanCaraChange={
          penjualanSalesDrilldown ? handlePenjualanPeriodeCaraChange : undefined
        }
      />
    </div>
  );
};

export default Dashboard;
