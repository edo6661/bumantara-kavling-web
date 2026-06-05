import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Wallet,
  AlertCircle,
  HardHat,
  ArrowRight,
  Clock,
  Award,
  FileText,
  ChevronRight,
  TrendingUp
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
      trend: 'Pembayaran Lunas',
      isPositive: true,
      icon: <Wallet className="text-emerald-600" size={24} />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      link: '/customer/tagihan'
    },
    {
      title: 'Kavling Terjual',
      value: `${stats.kavlingTerjual} Unit`,
      trend: `Dari ${stats.totalKavling} Unit`,
      detail: kavlingRekeningTrend,
      isPositive: true,
      icon: <Building2 className="text-indigo-600" size={24} />,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      link: '/management/penjualan'
    },
    {
      title: 'Tagihan Jatuh Tempo',
      value: formatRupiah(stats.tagihanJatuhTempo),
      trend: `${stats.customerJatuhTempo} Customer`,
      isPositive: false,
      icon: <AlertCircle className="text-rose-600" size={24} />,
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      link: '/customer/tagihan'
    },
    {
      title: 'Proyek Aktif (SPK)',
      value: `${stats.proyekAktif} Unit`,
      trend: 'Sedang Dibangun',
      isPositive: true,
      icon: <HardHat className="text-amber-600" size={24} />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      link: '/proyek/spk'
    },
  ];

  const percentTerjual = stats.totalKavling > 0 ? Math.round((stats.kavlingTerjual / stats.totalKavling) * 100) : 0;
  const availableKavling = stats.totalKavling - stats.kavlingTerjual;
  const percentAvailable = stats.totalKavling > 0 ? Math.round((availableKavling / stats.totalKavling) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-lg border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight mb-2">
              Halo, {user?.username ?? 'Pengguna'} 
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl">
              Selamat datang di Dashboard.
            </p>
          </div>
          <button 
            onClick={() => navigate('/management/penjualan')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold backdrop-blur-sm transition-all border border-white/10"
          >
            <TrendingUp size={16} /> Laporan Penjualan
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={() => navigate(stat.link)}
            className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Subtle corner accent */}
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-${stat.bgColor.split('-')[1]}-100/50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3.5 rounded-2xl ${stat.bgColor} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                {stat.icon}
              </div>
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${stat.isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                {stat.trend}
              </span>
            </div>
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">{stat.title}</h3>
              <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
              {'detail' in stat && stat.detail && (
                <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-50 inline-block px-2 py-1 rounded-md">{stat.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Status Kavling & Penjualan Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Kavling */}
        <div
          className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Status Kavling</h3>
            <button onClick={() => navigate('/management/penjualan')} className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer bg-slate-50 p-2 rounded-full hover:bg-indigo-50">
              <ArrowRight size={18} />
            </button>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="group">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Terjual / Proses</span>
                <span className="text-indigo-700">{stats.kavlingTerjual} Unit <span className="text-slate-400 font-medium">({percentTerjual}%)</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full relative" style={{ width: `${percentTerjual}%` }}>
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              {stats.kavlingByRekening?.map((rek) => {
                const percentRek = rek.total > 0 ? Math.round((rek.terjual / rek.total) * 100) : 0;
                return (
                  <div key={rek.rekeningId}>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-500">{rek.label}</span>
                      <span className="text-slate-700">{rek.terjual}/{rek.total} <span className="text-slate-400">({percentRek}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-slate-400 h-full rounded-full" style={{ width: `${percentRek}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600">Tersedia</span>
                <span className="text-emerald-600">{availableKavling} Unit <span className="text-slate-400 font-medium">({percentAvailable}%)</span></span>
              </div>
              <div className="w-full bg-emerald-50 rounded-full h-3 overflow-hidden border border-emerald-100">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentAvailable}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Penjualan Terbaru */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Penjualan Terbaru</h3>
            <button
              onClick={() => navigate('/management/penjualan')}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b-2 border-slate-100">
                  <th className="pb-4 pl-2 pr-4 font-extrabold">Customer</th>
                  <th className="pb-4 px-4 font-extrabold">Blok - No</th>
                  <th className="pb-4 px-4 font-extrabold">Pembayaran</th>
                  <th className="pb-4 px-4 text-right font-extrabold">Nilai Jual</th>
                  <th className="pb-4 pl-4 pr-2 text-center font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length > 0 ? recentTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => navigate('/management/penjualan')}>
                    <td className="py-4 pl-2 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
                          {trx.customer.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{trx.customer}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                            <Clock size={10} /> {trx.date}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs">{trx.kavling}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{trx.type}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(trx.amount)}
                    </td>
                    <td className="py-4 pl-4 pr-2 text-center">
                      <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                        trx.status === 'LUNAS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        trx.status === 'PROSES' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText size={32} className="mb-3 opacity-50" />
                        <p className="text-sm font-medium">Belum ada transaksi terbaru.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Top Agent & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agent */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Award size={20} className="text-amber-600" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Top Agent</h3>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {topAgents.length > 0 ? topAgents.map((agent, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${idx === 0 ? 'bg-amber-400 text-white shadow-amber-200' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 text-slate-600'}`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{agent.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{agent.closing} Closing Penjualan</p>
                  </div>
                </div>
                <div className="text-right bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Pencairan Fee</p>
                  <p className="text-sm font-bold text-emerald-600">{agent.feeStatus}</p>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full min-h-[150px]">
                <p className="text-sm text-slate-400 font-medium bg-slate-50 px-4 py-2 rounded-lg">Belum ada data agent bulan ini.</p>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/marketing/fee-agent')} className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors cursor-pointer border border-slate-200/60">
            Lihat Detail Fee <ChevronRight size={16} />
          </button>
        </div>

        {/* Document Alerts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <FileText size={20} className="text-rose-600" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Alert Dokumen</h3>
            </div>
            {documentAlerts.length > 0 && (
              <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
                {documentAlerts.length} Menunggu
              </span>
            )}
          </div>
          <div className="space-y-3 flex-1">
            {documentAlerts.length > 0 ? (
              <>
                <p className="text-xs text-slate-500 mb-3 font-medium">Customer (Booking) belum melengkapi berkas:</p>
                {documentAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 border border-rose-100 bg-rose-50/50 rounded-2xl cursor-pointer hover:bg-rose-50 hover:border-rose-200 transition-colors group" onClick={() => navigate('/customer/kelengkapan-administrasi')}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-900 text-sm group-hover:text-rose-700 transition-colors">{alert.customer}</p>
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                        {alert.kavling}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {alert.missing.map((doc, i) => (
                        <span key={i} className="text-[10px] font-bold text-rose-600 bg-white border border-rose-100 px-2 py-0.5 rounded-md shadow-sm">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <Award className="text-emerald-500" size={24} />
                </div>
                <p className="text-sm font-bold text-slate-700">Semua Dokumen Lengkap</p>
                <p className="text-xs text-slate-500 mt-1">Tidak ada customer yang tertinggal administrasi.</p>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/customer/kelengkapan-administrasi')} className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer border border-rose-100">
            Kelola Kelengkapan <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      {/* Tambahkan sedikit inline keyframes untuk animasi efek progress bar */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default Dashboard;