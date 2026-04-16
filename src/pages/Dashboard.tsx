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
  ChevronRight
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { useGetDashboardSummary } from '../hooks/queries/useDashboard';
import PageLoader from './PageLoader';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading } = useGetDashboardSummary();

  if (isLoading || !dashboardData) return <PageLoader />;

  const { stats, recentTransactions, topAgents, documentAlerts } = dashboardData;

  const statCards = [
    {
      title: 'Total Pendapatan',
      value: formatRupiah(stats.totalPendapatan),
      trend: 'Pembayaran Lunas',
      isPositive: true,
      icon: <Wallet className="text-slate-700" size={24} />,
      bgColor: 'bg-slate-100',
      link: '/customer/tagihan'
    },
    {
      title: 'Kavling Terjual',
      value: `${stats.kavlingTerjual} Unit`,
      trend: `Dari Total ${stats.totalKavling} Unit`,
      isPositive: true,
      icon: <Building2 className="text-blue-700" size={24} />,
      bgColor: 'bg-blue-50',
      link: '/management/penjualan'
    },
    {
      title: 'Tagihan Jatuh Tempo',
      value: formatRupiah(stats.tagihanJatuhTempo),
      trend: `${stats.customerJatuhTempo} Customer`,
      isPositive: false,
      icon: <AlertCircle className="text-red-700" size={24} />,
      bgColor: 'bg-red-50',
      link: '/customer/tagihan'
    },
    {
      title: 'Proyek Aktif (SPK)',
      value: `${stats.proyekAktif} Unit`,
      trend: 'Sedang Dibangun',
      isPositive: true,
      icon: <HardHat className="text-amber-700" size={24} />,
      bgColor: 'bg-amber-50',
      link: '/proyek/spk'
    },
  ];

  const percentTerjual = stats.totalKavling > 0 ? Math.round((stats.kavlingTerjual / stats.totalKavling) * 100) : 0;
  const availableKavling = stats.totalKavling - stats.kavlingTerjual;
  const percentAvailable = stats.totalKavling > 0 ? Math.round((availableKavling / stats.totalKavling) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
            Selamat datang kembali! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Berikut adalah ringkasan performa operasional dan finansial hari ini.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={() => navigate(stat.link)}
            className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.trend}
              </span>
            </div>
            <div>
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Kavling Overview */}
        <div
          className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all"
          onClick={() => navigate('/management/penjualan')}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Status Kavling</h3>
            <button className="text-slate-400 hover:text-black transition-colors cursor-pointer">
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Terjual / Proses</span>
                <span className="text-slate-900 font-bold">{stats.kavlingTerjual} Unit ({percentTerjual}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-black h-2.5 rounded-full" style={{ width: `${percentTerjual}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Tersedia</span>
                <span className="text-slate-900 font-bold">{availableKavling} Unit ({percentAvailable}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentAvailable}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Penjualan Terbaru */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Penjualan Terbaru</h3>
            <button
              onClick={() => navigate('/management/penjualan')}
              className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-black transition-colors cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 px-4">Kavling</th>
                  <th className="pb-3 px-4">Pembayaran</th>
                  <th className="pb-3 px-4 text-right">Nilai Jual</th>
                  <th className="pb-3 pl-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTransactions.length > 0 ? recentTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate('/management/penjualan')}>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{trx.customer}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock size={12} /> {trx.date}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">{trx.kavling}</td>
                    <td className="py-4 px-4 text-slate-600">{trx.type.replace('_', ' ')}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(trx.amount)}
                    </td>
                    <td className="py-4 pl-4 text-center">
                      <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${trx.status === 'LUNAS' ? 'bg-green-100 text-green-700' :
                        trx.status === 'PROSES' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">Belum ada transaksi terbaru.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agent Marketing */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Top Agent</h3>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {topAgents.length > 0 ? topAgents.map((agent, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-amber-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{agent.name}</p>
                    <p className="text-xs text-slate-500">{agent.closing} Closing Penjualan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Pencairan Fee</p>
                  <p className="text-sm font-bold text-slate-900">{agent.feeStatus}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic text-center py-4">Belum ada data agent.</p>
            )}
          </div>
          <button onClick={() => navigate('/marketing/fee-agent')} className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            Lihat Data Fee <ChevronRight size={14} />
          </button>
        </div>

        {/* Kelengkapan Dokumen */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-red-500" />
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Alert Dokumen Customer</h3>
            </div>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
              {documentAlerts.length} Belum Lengkap
            </span>
          </div>
          <div className="space-y-3 flex-1">
            <p className="text-xs text-slate-500 mb-2">Customer yang telah booking namun belum melengkapi berkas:</p>
            {documentAlerts.length > 0 ? documentAlerts.map((alert, idx) => (
              <div key={idx} className="p-3 border border-red-100 bg-red-50/30 rounded-xl cursor-pointer hover:bg-red-50 transition-colors" onClick={() => navigate('/customer/kelengkapan-administrasi')}>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-slate-900 text-sm">{alert.customer}</p>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {alert.kavling}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {alert.missing.map((doc, i) => (
                    <span key={i} className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                      Kekurangan: {doc}
                    </span>
                  ))}
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic text-center py-4">Semua dokumen customer lengkap.</p>
            )}
          </div>
          <button onClick={() => navigate('/customer/kelengkapan-administrasi')} className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer">
            Lengkapi Dokumen <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;