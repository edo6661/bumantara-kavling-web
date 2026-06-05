import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Wallet,
  AlertCircle,
  HardHat,
  ArrowUpRight,
  Clock,
  Award,
  FileText,
  ChevronRight,
  TrendingUp,
  Users,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { useGetDashboardSummary } from '../hooks/queries/useDashboard';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboardData, isLoading } = useGetDashboardSummary();

  if (isLoading || !dashboardData) return <PageLoader />;

  const { stats, recentTransactions, topAgents, documentAlerts } = dashboardData;

  const kavlingRekeningTrend = stats.kavlingByRekening?.length
    ? stats.kavlingByRekening.map((r) => `${r.label}: ${r.terjual}/${r.total}`).join(' · ')
    : `Dari Total ${stats.totalKavling} Unit`;

  const statCards = [
    {
      title: 'Total Pendapatan',
      value: formatRupiah(stats.totalPendapatan),
      badge: 'Pembayaran Lunas',
      badgeType: 'green' as const,
      icon: Wallet,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accentColor: 'from-emerald-500',
      link: '/customer/tagihan',
    },
    {
      title: 'Kavling Terjual',
      value: `${stats.kavlingTerjual} Unit`,
      badge: `dari ${stats.totalKavling} total`,
      badgeType: 'blue' as const,
      icon: Building2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      accentColor: 'from-blue-500',
      detail: kavlingRekeningTrend,
      link: '/management/penjualan',
    },
    {
      title: 'Tagihan Jatuh Tempo',
      value: formatRupiah(stats.tagihanJatuhTempo),
      badge: `${stats.customerJatuhTempo} customer`,
      badgeType: 'red' as const,
      icon: AlertCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      accentColor: 'from-red-500',
      link: '/customer/tagihan',
    },
    {
      title: 'Proyek Aktif (SPK)',
      value: `${stats.proyekAktif} Unit`,
      badge: 'Sedang Dibangun',
      badgeType: 'amber' as const,
      icon: HardHat,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      accentColor: 'from-amber-500',
      link: '/proyek/spk',
    },
  ];

  const badgeStyles = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-700',
  };

  const percentTerjual = stats.totalKavling > 0
    ? Math.round((stats.kavlingTerjual / stats.totalKavling) * 100)
    : 0;
  const availableKavling = stats.totalKavling - stats.kavlingTerjual;
  const percentAvailable = stats.totalKavling > 0
    ? Math.round((availableKavling / stats.totalKavling) * 100)
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 17) return 'Selamat siang';
    return 'Selamat malam';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Welcome header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-0.5">{getGreeting()},</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {user?.username ?? 'Pengguna'} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 shadow-sm">
          <Clock size={14} className="text-slate-400" />
          <span className="font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(stat.link)}
              className="group bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden relative"
            >
              {/* Subtle gradient accent top */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.accentColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={18} className={stat.iconColor} strokeWidth={2} />
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeStyles[stat.badgeType]}`}>
                  {stat.badge}
                </span>
              </div>

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                {stat.title}
              </p>
              <p className="text-xl font-bold text-slate-900 leading-tight">
                {stat.value}
              </p>
              {'detail' in stat && stat.detail && (
                <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed line-clamp-2">
                  {stat.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Kavling Status */}
        <div
          className="bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/80 transition-all duration-200"
          onClick={() => navigate('/management/penjualan')}
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-[15px]">Status Kavling</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats.totalKavling} unit total</p>
            </div>
            <button className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Terjual */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-800 shrink-0" />
                  Terjual / Proses
                </span>
                <span className="text-[12px] font-bold text-slate-900">
                  {stats.kavlingTerjual} <span className="font-medium text-slate-400">({percentTerjual}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-slate-800 transition-all duration-700"
                  style={{ width: `${percentTerjual}%` }}
                />
              </div>
            </div>

            {/* Per rekening breakdown */}
            {stats.kavlingByRekening?.map((rek) => {
              const percentRek = rek.total > 0 ? Math.round((rek.terjual / rek.total) * 100) : 0;
              return (
                <div key={rek.rekeningId}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                      {rek.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      {rek.terjual}/{rek.total} <span className="font-medium text-slate-400">({percentRek}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-blue-400 transition-all duration-700"
                      style={{ width: `${percentRek}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Tersedia */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  Tersedia
                </span>
                <span className="text-[12px] font-bold text-slate-900">
                  {availableKavling} <span className="font-medium text-slate-400">({percentAvailable}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-emerald-400 transition-all duration-700"
                  style={{ width: `${percentAvailable}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-[15px]">Penjualan Terbaru</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{recentTransactions.length} transaksi terkini</p>
            </div>
            <button
              onClick={() => navigate('/management/penjualan')}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Lihat Semua <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest pr-4">Customer</th>
                  <th className="text-left pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Blok</th>
                  <th className="text-left pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 hidden sm:table-cell">Tipe</th>
                  <th className="text-right pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Nilai</th>
                  <th className="text-center pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? recentTransactions.map((trx) => (
                  <tr
                    key={trx.id}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => navigate('/management/penjualan')}
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-slate-900 text-[13px]">{trx.customer}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {trx.date}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[13px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {trx.kavling}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[12px] text-slate-500 hidden sm:table-cell">{trx.type}</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="text-[13px] font-bold text-slate-900">{formatRupiah(trx.amount)}</span>
                    </td>
                    <td className="py-3.5 pl-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        trx.status === 'LUNAS'
                          ? 'bg-emerald-50 text-emerald-700'
                          : trx.status === 'PROSES'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <TrendingUp size={28} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-slate-400 text-[13px]">Belum ada transaksi terbaru.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top Agents */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Award size={16} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]">Top Agent</h3>
                <p className="text-[11px] text-slate-400">Performa terbaik bulan ini</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {topAgents.length > 0 ? topAgents.map((agent, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[12px] shrink-0 ${
                  idx === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/30'
                  : idx === 1 ? 'bg-slate-200 text-slate-700'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-[13px] truncate">{agent.name}</p>
                  <p className="text-[11px] text-slate-400">{agent.closing} closing penjualan</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-slate-400">Fee Cair</p>
                  <p className="text-[13px] font-bold text-slate-900">{agent.feeStatus}</p>
                </div>
              </div>
            )) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Users size={28} className="text-slate-200 mb-2" />
                <p className="text-slate-400 text-[13px]">Belum ada data agent.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/marketing/fee-agent')}
            className="w-full mt-4 py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Lihat Data Fee <ChevronRight size={14} />
          </button>
        </div>

        {/* Document Alerts */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <FileText size={16} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]">Alert Dokumen</h3>
                <p className="text-[11px] text-slate-400">Berkas belum lengkap</p>
              </div>
            </div>
            {documentAlerts.length > 0 && (
              <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[11px] font-bold rounded-full">
                {documentAlerts.length} belum lengkap
              </span>
            )}
          </div>

          {documentAlerts.length > 0 && (
            <p className="text-[11px] text-slate-400 mb-3">Customer yang booking namun belum melengkapi berkas:</p>
          )}

          <div className="space-y-2 flex-1">
            {documentAlerts.length > 0 ? documentAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="p-3 border border-red-100 bg-red-50/30 rounded-xl cursor-pointer hover:bg-red-50/60 hover:border-red-200 transition-all duration-200"
                onClick={() => navigate('/customer/kelengkapan-administrasi')}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <p className="font-semibold text-slate-900 text-[13px]">{alert.customer}</p>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shrink-0 ml-2">
                    {alert.kavling}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {alert.missing.map((doc, i) => (
                    <span key={i} className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <FileText size={20} className="text-emerald-400" />
                </div>
                <p className="text-slate-700 text-[13px] font-semibold">Semua dokumen lengkap!</p>
                <p className="text-slate-400 text-[12px] mt-0.5">Tidak ada berkas yang perlu dilengkapi.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/customer/kelengkapan-administrasi')}
            className="w-full mt-4 py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
          >
            Lengkapi Dokumen <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;