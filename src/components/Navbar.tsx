import { useState, useRef, useEffect } from 'react';
import { Menu, Building, Bell, Trash2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGetPerumahan } from '../hooks/queries/usePerumahan';
import { useAdminSocket } from '../hooks/useAdminSocket';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, selectedPerumahan, setSelectedPerumahan } = useAuth();
  const profileInitials =
    user?.username?.trim().slice(0, 2).toUpperCase() || 'U';
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

    if (!isNotifOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Utama';
    if (path === '/profile') return 'Profil Saya';

    if (path.startsWith('/customer-detail')) return '';

    const paths = path.split('/').filter(Boolean);

    let lastPath = paths[paths.length - 1];
    if (!isNaN(Number(lastPath)) && paths.length > 1) {
      lastPath = paths[paths.length - 2];
    }

    return lastPath.charAt(0).toUpperCase() + lastPath.slice(1).replace(/-/g, ' ');
  };
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:block">
          <h1 className="text-lg font-semibold font-heading text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {selectedPerumahan?.logo ? (
            <img src={selectedPerumahan.logo} alt="Logo" className="h-7 object-contain" />
          ) : (
            <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm">
              B
            </div>
          )}
          <span className="font-heading font-semibold text-base text-slate-900 tracking-tight">
            {selectedPerumahan?.nama || 'Bumantara'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {showNotifications && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotif}
              className="relative p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all duration-200 cursor-pointer"
            >
              <Bell size={18} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 flex justify-between items-center border-b border-slate-100">
                  <h3 className="font-semibold text-sm text-slate-900">Notifikasi</h3>
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer">
                      <Trash2 size={12} /> Bersihkan
                    </button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Bell size={20} className="text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm">Tidak ada notifikasi baru</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                            {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">
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

        {selectedPerumahan && perumahanList && (
          <div className="hidden md:flex items-center gap-2 bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 rounded-lg px-2.5 py-1.5 transition-all">
            {selectedPerumahan.logo ? (
              <img src={selectedPerumahan.logo} alt="Icon" className="w-4 h-4 object-contain grayscale opacity-70" />
            ) : (
              <Building size={14} className="text-slate-500" />
            )}
            <select
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer outline-none appearance-none pr-4"
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
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-medium text-xs shadow-sm cursor-pointer hover:ring-2 hover:ring-slate-200 hover:ring-offset-2 transition-all"
        >
          {profileInitials}
        </button>
      </div>
    </header>
  );
};

export default Navbar;