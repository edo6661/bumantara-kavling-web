import { Menu, Building, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGetPerumahan } from '../hooks/queries/usePerumahan';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  onMenuClick: () => void;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/profile': 'Profil Saya',
  '/management/manajemen-transaksi': 'Manajemen Transaksi',
  '/management/penjualan': 'Data Penjualan',
  '/management/progress-penjualan': 'Progress Penjualan',
  '/management/ganti-kavling': 'Ganti Kavling',
  '/management/batal-transaksi': 'Batal Transaksi',
  '/management/kavling': 'Kavling',
  '/management/notaris': 'Notaris',
  '/management/bank': 'Bank',
  '/management/users': 'Manajemen User',
  '/management/role-permission': 'Akses & Role',
  '/management/audit-log': 'Audit Log',
  '/customer/administrasi': 'Administrasi & Progress',
  '/customer/kavling': 'Kavling Customer',
  '/customer/tagihan': 'Pembayaran',
  '/marketing/agents': 'Agents',
  '/marketing/agents/pribadi': 'Agent Pribadi',
  '/marketing/agents/perusahaan': 'Agent Perusahaan',
  '/marketing/fee-agent': 'Riwayat Pencairan Agent',
  '/finance/approve-pembayaran': 'Approve Pembayaran',
  '/finance/bayar-kode-billing-pph': 'Kode Billing PPh',
  '/finance/bayar-spk': 'Bayar SPK',
  '/finance/bayar-agent': 'Bayar Agent',
  '/finance/bayar-notaris': 'Bayar Notaris',
  '/finance/bayar-kpr': 'Bayar Bank KPR',
  '/proyek/spk': 'SPK Proyek',
  '/proyek/approve-kasbon': 'Approve Pembayaran SPK',
  '/proyek/approve-kasbon-admin': 'Approve Pembayaran SPK (Admin)',
  '/proyek/tukang': 'Data Tukang',
  '/proyek/progress': 'Progress Proyek',
};

const NOTIFICATION_ROLES = new Set(['ADMIN', 'SUPERADMIN']);

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, selectedPerumahan, setSelectedPerumahan } = useAuth();

  const profileInitials = user?.username?.trim().slice(0, 2).toUpperCase() || 'U';
  const { data: perumahanList } = useGetPerumahan();
  const showNotifications = !!user && NOTIFICATION_ROLES.has(user.role);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/profile' && user?.role === 'AGENT') return 'Profil Agent';
    if (routeLabels[path]) return routeLabels[path];
    if (path.startsWith('/customer-detail')) return 'Detail Customer';
    const paths = path.split('/').filter(Boolean);
    let lastPath = paths[paths.length - 1];
    if (!isNaN(Number(lastPath)) && paths.length > 1) lastPath = paths[paths.length - 2];
    return lastPath.charAt(0).toUpperCase() + lastPath.slice(1).replace(/-/g, ' ');
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return null;
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="h-[64px] flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-100 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 md:hidden">
          {selectedPerumahan?.logo ? (
            <img src={selectedPerumahan.logo} alt="Logo" className="h-7 object-contain" />
          ) : (
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              B
            </div>
          )}
          <span className="font-bold text-slate-900 text-[15px]">
            {selectedPerumahan?.nama || 'Bumantaraz'}
          </span>
        </div>

        <div className="hidden md:flex flex-col justify-center">
          {breadcrumb && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
              {breadcrumb}
            </p>
          )}
          <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {selectedPerumahan && perumahanList && (
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 hover:border-slate-300 transition-colors group">
            {selectedPerumahan.logo ? (
              <img src={selectedPerumahan.logo} alt="Icon" className="w-4 h-4 object-contain" />
            ) : (
              <Building size={14} className="text-slate-400" />
            )}
            <select
              className="bg-transparent border-none text-[13px] font-semibold text-slate-700 focus:ring-0 cursor-pointer outline-none pr-1"
              value={selectedPerumahan.id}
              onChange={(e) => {
                const selected = perumahanList.find(p => String(p.id) === e.target.value);
                if (selected) setSelectedPerumahan(selected);
              }}
            >
              {perumahanList.map(p => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
            <ChevronDown size={12} className="text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
          </div>
        )}

        {showNotifications && <NotificationBell />}

        <button
          type="button"
          onClick={() => navigate('/profile')}
          title="Profil saya"
          className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-[12px] cursor-pointer hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200"
        >
          {profileInitials}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
