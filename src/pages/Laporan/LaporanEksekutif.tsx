import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useGetDashboardSummary, useGetDashboardDrilldown } from '../../hooks/queries/useDashboard';
import type { DashboardDrilldownCategory } from '../../services/dashboard.service';
import PageLoader from '../PageLoader';
import KpiCard from '../../components/dashboard/KpiCard';
import DashboardMonthlyReportCard from '../../components/dashboard/DashboardMonthlyReportCard';
import BookingRateChart from '../../components/dashboard/BookingRateChart';
import DashboardDrilldownModal from '../../components/dashboard/DashboardDrilldownModal';
import { DASHBOARD_COLORS } from '../../components/dashboard/dashboardTheme';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import {
  Building2,
  FileSignature,
  Home,
  Landmark,
  Layers,
  ShoppingCart,
} from 'lucide-react';

type DrilldownState = {
  category: DashboardDrilldownCategory;
  filter?: string;
  title: string;
};

const LaporanEksekutif = () => {
  const navigate = useNavigate();
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

  if (isLoading || !dashboardData?.executive) return <PageLoader />;

  const { executive } = dashboardData;
  const { kpi, year } = executive;

  return (
    <ReportPageLayout
      title="Laporan Eksekutif"
      subtitle={`Ringkasan kinerja penjualan, akad, dan pendapatan tahun ${year} — untuk evaluasi manajemen`}
      icon={BarChart3}
    >
      <section>
        <ReportSectionLabel>Indikator Utama</ReportSectionLabel>
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
            onClick={() => openDrilldown('penjualan', 'AKAD_BULAN_INI', 'Akad Bulan Ini')}
          />
          <KpiCard
            title="Unit Ter-Booking Hari Ini"
            value={`${kpi.unitBookingHariIni} Unit`}
            subtitle="Penjualan baru hari ini"
            icon={ShoppingCart}
            onClick={() => openDrilldown('penjualan', 'BOOKED_TODAY', 'Booking Hari Ini')}
          />
          <KpiCard
            title="Unit Ter-Proses Hari Ini"
            value={`${kpi.unitProsesHariIni} Unit`}
            subtitle="Unit masuk proses hari ini"
            icon={Layers}
            onClick={() => openDrilldown('penjualan', 'PROSES_TODAY', 'Proses Hari Ini')}
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
            onClick={() => openDrilldown('penjualan', 'CASH_BERTAHAP', 'Penjualan Cash Bertahap')}
          />
        </div>
      </section>

      <section>
        <ReportSectionLabel>Laporan Tahun {year}</ReportSectionLabel>
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

      <section>
        <ReportSectionLabel>Tingkat Pemesanan</ReportSectionLabel>
        <BookingRateChart year={year} data={executive.tingkatPemesanan} />
      </section>

      <DashboardDrilldownModal
        isOpen={drilldown !== null}
        onClose={() => setDrilldown(null)}
        title={drilldown?.title ?? 'Detail'}
        items={drilldownItems}
        isLoading={drilldownLoading}
        onItemClick={() => {
          if (drilldown?.category === 'kavling') {
            navigate('/management/kavling');
          } else {
            navigate('/management/penjualan');
          }
          setDrilldown(null);
        }}
      />
    </ReportPageLayout>
  );
};

export default LaporanEksekutif;
