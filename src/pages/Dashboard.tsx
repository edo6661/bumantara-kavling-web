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
const Dashboard = () => {
  const stats = [
    {
      title: 'Total Pendapatan',
      value: formatRupiah(12500000000),
      trend: '+15.5%',
      isPositive: true,
      icon: <Wallet className="text-slate-700" size={24} />,
      bgColor: 'bg-slate-100',
    },
    {
      title: 'Kavling Terjual',
      value: '24',
      trend: 'Total 40 Unit',
      isPositive: true,
      icon: <Building2 className="text-blue-700" size={24} />,
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tagihan Jatuh Tempo',
      value: formatRupiah(150000000),
      trend: '5 Customer',
      isPositive: false,
      icon: <AlertCircle className="text-red-700" size={24} />,
      bgColor: 'bg-red-50',
    },
    {
      title: 'Proyek Aktif (SPK)',
      value: '8 Unit',
      trend: 'Rata-rata 65%',
      isPositive: true,
      icon: <HardHat className="text-amber-700" size={24} />,
      bgColor: 'bg-amber-50',
    },
  ];
  const recentTransactions = [
    { id: 'TRX-001', customer: 'Budi Santoso', kavling: 'Blok A - 01', type: 'Booking Fee', amount: 5000000, status: 'Lunas', date: 'Hari ini, 10:30' },
    { id: 'TRX-002', customer: 'Andi Pratama', kavling: 'Blok B - 12', type: 'DP 1', amount: 45000000, status: 'Pending', date: 'Kemarin, 14:15' },
    { id: 'TRX-003', customer: 'Siti Aminah', kavling: 'Blok C - 05', type: 'Cash Keras', amount: 550000000, status: 'Lunas', date: '12 Mar 2026' },
  ];
  const progressData = [
    { kavling: 'Blok A - 01', customer: 'Budi Santoso', progress: 85, tahap: 'Keramik & Plafon', isLate: false },
    { kavling: 'Blok B - 12', customer: 'Andi Pratama', progress: 45, tahap: 'Struktur & Dinding', isLate: false },
    { kavling: 'Blok C - 05', customer: 'Siti Aminah', progress: 15, tahap: 'Pondasi & Sloof', isLate: true },
  ];
  const topAgents = [
    { name: 'Rina Wijaya', closing: 6, feeStatus: 'Rp 15.000.000' },
    { name: 'Andi Pratama', closing: 4, feeStatus: 'Rp 10.000.000' },
    { name: 'Budi Hartono', closing: 2, feeStatus: 'Rp 5.000.000' },
  ];
  const documentAlerts = [
    { customer: 'Rudi Hermawan', kavling: 'Blok D - 02', missing: ['NPWP', 'KK'] },
    { customer: 'Siska Amelia', kavling: 'Blok A - 08', missing: ['KTP Pasangan'] },
  ];
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
            Halo, Edo. Selamat datang kembali! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Berikut adalah ringkasan performa operasional dan finansial Bumantara Kavling hari ini.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-black/10 shrink-0">
          Buat Laporan
        </button>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group">
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
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Status Kavling</h3>
            <button className="text-slate-400 hover:text-black transition-colors cursor-pointer">
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="space-y-5">
            {/* Terjual */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Terjual</span>
                <span className="text-slate-900 font-bold">24 Unit (60%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-black h-2.5 rounded-full w-[60%]"></div>
              </div>
            </div>
            {/* Booking */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Booking</span>
                <span className="text-slate-900 font-bold">6 Unit (15%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-2.5 rounded-full w-[15%]"></div>
              </div>
            </div>
            {/* Available */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Tersedia</span>
                <span className="text-slate-900 font-bold">10 Unit (25%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-green-500 h-2.5 rounded-full w-[25%]"></div>
              </div>
            </div>
          </div>
        </div>
        {/* Penjualan Terbaru */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Penjualan Pembayaran Terbaru</h3>
            <button className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-black transition-colors cursor-pointer">
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 px-4">Kavling</th>
                  <th className="pb-3 px-4">Keterangan</th>
                  <th className="pb-3 px-4 text-right">Nominal</th>
                  <th className="pb-3 pl-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-900">{trx.customer}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock size={12} /> {trx.date}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">{trx.kavling}</td>
                    <td className="py-4 px-4 text-slate-600">{trx.type}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(trx.amount)}
                    </td>
                    <td className="py-4 pl-4 text-center">
                      <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${trx.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Baris Bawah: 3 Kolom Metrik Operasional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Pembangunan Lapangan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <HardHat size={18} className="text-slate-700" />
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Progress Proyek</h3>
            </div>
            <button className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-black transition-colors cursor-pointer">
              Detail
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {progressData.map((prog, idx) => (
              <div key={idx} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-slate-900 font-bold">{prog.kavling}</span>
                  <span className={prog.isLate ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                    {prog.progress}%
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500">{prog.customer}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{prog.tahap}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${prog.isLate ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${prog.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Top Agent Marketing */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Top Agent Bulan Ini</h3>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {topAgents.map((agent, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-amber-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{agent.name}</p>
                    <p className="text-xs text-slate-500">{agent.closing} Closing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Fee</p>
                  <p className="text-sm font-bold text-slate-900">{agent.feeStatus}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            Lihat Data Fee <ChevronRight size={14} />
          </button>
        </div>
        {/* Kelengkapan Dokumen / Alert */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-red-500" />
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Alert Dokumen</h3>
            </div>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
              {documentAlerts.length} Action
            </span>
          </div>
          <div className="space-y-3 flex-1">
            <p className="text-xs text-slate-500 mb-2">Customer berikut belum melengkapi berkas administrasi:</p>
            {documentAlerts.map((alert, idx) => (
              <div key={idx} className="p-3 border border-red-100 bg-red-50/30 rounded-xl">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-slate-900 text-sm">{alert.customer}</p>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {alert.kavling}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {alert.missing.map((doc, i) => (
                    <span key={i} className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                      Missing: {doc}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer">
            Follow Up Customer <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;