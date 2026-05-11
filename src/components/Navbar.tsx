import { useState, useRef, useEffect } from 'react';
import { Menu, Building, Bell, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGetPerumahan } from '../hooks/queries/usePerumahan';
import { useAdminSocket } from '../hooks/useAdminSocket';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const location = useLocation();
  const { selectedPerumahan, setSelectedPerumahan } = useAuth();
  const { data: perumahanList } = useGetPerumahan();


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

    if (path.startsWith('/customer-detail')) return '';

    const paths = path.split('/').filter(Boolean);

    let lastPath = paths[paths.length - 1];
    if (!isNaN(Number(lastPath)) && paths.length > 1) {
      lastPath = paths[paths.length - 2];
    }

    return lastPath.charAt(0).toUpperCase() + lastPath.slice(1).replace(/-/g, ' ');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-gray-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-30 shrink-0 shadow-sm/50">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
        >
          <Menu size={22} />
        </button>

        <div className="hidden md:block">
          <h1 className="text-xl font-bold font-heading text-gray-900 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {selectedPerumahan?.logo ? (
            <img src={selectedPerumahan.logo} alt="Logo" className="h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
              B
            </div>
          )}
          <span className="font-heading font-bold text-lg text-gray-900 tracking-tight">
            {selectedPerumahan?.nama || 'Bumantaraz'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">

        {/* --- TOMBOL NOTIFIKASI BELL --- */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotif}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
            )}
          </button>

          {/* DROPDOWN NOTIFIKASI */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Notifikasi</h3>
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer">
                    <Trash2 size={12} /> Bersihkan
                  </button>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <Bell size={32} className="text-slate-200 mb-3" />
                    <p className="text-slate-500 text-sm font-medium">Belum ada notifikasi baru.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-indigo-50/40' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                          {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1"></span>}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-wider">
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

        {selectedPerumahan && perumahanList && (
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-black/5 transition-all">
            {selectedPerumahan.logo ? (
              <img src={selectedPerumahan.logo} alt="Icon" className="w-5 h-5 object-contain" />
            ) : (
              <Building size={16} className="text-slate-500" />
            )}
            <select
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none w-32 md:w-auto"
              value={selectedPerumahan.id}
              onChange={(e) => {
                const selected = perumahanList.find(p => String(p.id) === e.target.value);
                if (selected) {
                  setSelectedPerumahan(selected);
                }
              }}
            >
              {perumahanList.map(p => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
        )}

        <div className="w-9 h-9 bg-gradient-to-tr from-gray-800 to-black rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md cursor-pointer border-2 border-white ring-1 ring-gray-100">
          Aq
        </div>
      </div>
    </header>
  );
};

export default Navbar;