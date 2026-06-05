import { useState, useRef, useEffect } from 'react';
import { Menu, Building, Bell, Trash2, Search, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGetPerumahan } from '../hooks/queries/usePerumahan';
import { useAdminSocket } from '../hooks/useAdminSocket';

interface NavbarProps {
  onMenuClick: () => void;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/profile': 'Profil Saya',
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
  '/customer/administrasi': 'Administrasi Customer',
  '/customer/kavling': 'Kavling Customer',
  '/customer/tagihan': 'Pembayaran',
  '/marketing/agents': 'Agen Marketing',
  '/marketing/fee-agent': 'Fee Agent',
  '/marketing/perusahaan': 'Perusahaan Agent',
  '/finance/approve-pembayaran': 'Approve Pembayaran',
  '/finance/bayar-kode-billing-pph': 'Kode Billing PPh',
  '/finance/bayar-spk': 'Bayar SPK',
  '/finance/bayar-notaris': 'Bayar Notaris',
  '/finance/bayar-kpr': 'Bayar Bank KPR',
  '/proyek/spk': 'SPK Proyek',
  '/proyek/tukang': 'Data Tukang',
  '/proyek/progress': 'Progress Proyek',
};

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, selectedPerumahan, setSelectedPerumahan } = useAuth();

  const profileInitials = user?.username?.trim().slice(0, 2).toUpperCase() || 'U';
  const { data: perumahanList } = useGetPerumahan();
  const showNotifications = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useAdminSocket();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && unreadCount > 0) markAllAsRead();
  };

  const getPageTitle = () => {
    const path = location.pathname;
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
    <header className="h-[64px] flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-100 sticky top-0 z-30 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Mobile brand logo */}
        <div className="flex items-center gap-2 md:hidden">
          {selectedPerumahan?.logo ? (
            <img src={selectedPerumahan.logo} alt="Logo" className="h-7 object-contain" />
          ) : (
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              B
            </div>
          )}
          <span className="font-bold text-slate-900 text-[15px]">
            {selectedPerumahan?.nama || 'Bumantaraz'}
          </span>
        </div>

        {/* Desktop page title with breadcrumb */}
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

      {/* Right section */}
      <div className="flex items-center gap-2">

        {/* Perumahan selector */}
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

        {/* Notifications */}
        {showNotifications && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotif}
              className="relative w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {/* Notification dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-[14px]">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <p className="text-[11px] text-slate-400">{unreadCount} belum dibaca</p>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Hapus semua
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <Bell size={20} className="text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-[13px] font-medium">Tidak ada notifikasi</p>
                      <p className="text-slate-400 text-[12px] mt-1">Anda sudah up-to-date!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <p className="text-[13px] font-semibold text-slate-800 leading-tight">{notif.title}</p>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                          </div>
                          <p className="text-[12px] text-slate-500 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
                            {notif.createdAt?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile avatar */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          title="Profil saya"
          className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-[12px] cursor-pointer hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200"
        >
          {profileInitials}
        </button>
      </div>
    </header>
  );
};

export default Navbar;