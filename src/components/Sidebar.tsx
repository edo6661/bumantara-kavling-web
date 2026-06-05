import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCircle,
  FolderKanban,
  ChevronDown,
  X,
  ShoppingCart,
  LogOut,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { canReadResource } from '../utils/permissions';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
  },
  {
    title: 'Penjualan',
    icon: <ShoppingCart size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'Data Penjualan', path: '/management/penjualan', resource: 'PENJUALAN' },
      { title: 'Progress', path: '/management/progress-penjualan', resource: 'PROGRESS_PENJUALAN' },
      { title: 'Ganti Kavling', path: '/management/ganti-kavling', resource: 'GANTI_KAVLING' },
      { title: 'Batal Transaksi', path: '/management/batal-transaksi', resource: 'BATAL_TRANSAKSI' },
    ],
  },
  {
    title: 'Management',
    icon: <Briefcase size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'Kavling', path: '/management/kavling', resource: 'KAVLING' },
      { title: 'Notaris', path: '/management/notaris', resource: 'NOTARIS' },
      { title: 'Bank', path: '/management/bank', resource: 'BANK' },
      { title: 'User', path: '/management/users', resource: 'USER' },
      { title: 'Akses & Role', path: '/management/role-permission', resource: 'ROLE_PERMISSION' },
      { title: 'Audit Log', path: '/management/audit-log', resource: 'AUDIT_LOG' },
    ],
  },
  {
    title: 'Customer',
    icon: <Users size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'Administrasi', path: '/customer/administrasi', resource: 'CUSTOMER' },
      { title: 'Kavling Customer', path: '/customer/kavling', resource: 'CUSTOMER_KAVLING' },
      { title: 'Pembayaran', path: '/customer/tagihan', resource: 'TAGIHAN' },
    ],
  },
  {
    title: 'Marketing',
    icon: <UserCircle size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'Agents', path: '/marketing/agents', resource: 'AGENT' },
      { title: 'Fee Agent', path: '/marketing/fee-agent', resource: 'FEE_AGENT' },
      { title: 'Perusahaan Agent', path: '/marketing/perusahaan', resource: 'AGENT' },
    ],
  },
  {
    title: 'Finance',
    icon: <Banknote size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'Approve Pembayaran', path: '/finance/approve-pembayaran', resource: 'TAGIHAN' },
      { title: 'Kode Billing PPh', path: '/finance/bayar-kode-billing-pph', resource: 'TAGIHAN' },
      { title: 'Bayar SPK', path: '/finance/bayar-spk', resource: 'TAGIHAN' },
      { title: 'Bayar Notaris', path: '/finance/bayar-notaris', resource: 'TAGIHAN' },
      { title: 'Bayar Bank KPR', path: '/finance/bayar-kpr', resource: 'TAGIHAN' },
    ],
  },
  {
    title: 'Proyek',
    icon: <FolderKanban size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'SPK', path: '/proyek/spk', resource: 'SPK' },
      { title: 'Tukang', path: '/proyek/tukang', resource: 'SPK' },
      { title: 'Progress Proyek', path: '/proyek/progress', resource: 'PROGRESS_PROYEK' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredMenuItems = menuItems.map(item => {
    if (!item.submenus) {
      if (item.path === '/' && user?.role === 'MANDOR') return null;
      return item;
    }
    const filteredSubmenus = item.submenus.filter(sub => {
      if (!sub.resource) return true;
      return canReadResource(user, sub.resource);
    });
    return { ...item, submenus: filteredSubmenus };
  }).filter(item => {
    if (!item) return false;
    return item.submenus ? item.submenus.length > 0 : true;
  });

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialOpenMenus: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.submenus?.some(sub => location.pathname.startsWith(sub.path))) {
        initialOpenMenus[item.title] = true;
      }
    });
    return initialOpenMenus;
  });

  const handleMenuClick = (title: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenMenus((prev) => ({ ...prev, [title]: true }));
    } else {
      setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
    }
  };

  const checkActive = (path?: string, submenus?: { path: string }[]) => {
    if (path && location.pathname === path) return true;
    if (submenus && submenus.some((sub) => location.pathname === sub.path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebarWidth = isCollapsed ? 'md:w-[72px]' : 'md:w-[260px]';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-[#0f1117] text-white
          transition-all duration-300 ease-in-out shrink-0
          md:static md:translate-x-0
          ${isOpen ? 'translate-x-0 w-[260px] shadow-2xl' : '-translate-x-full w-[260px] shadow-none'}
          ${sidebarWidth}
        `}
      >
        {/* Collapse toggle button (desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-8 z-50 w-7 h-7 bg-[#0f1117] border border-slate-700 text-slate-400 hover:text-white shadow-lg rounded-full items-center justify-center cursor-pointer transition-all hover:scale-110"
        >
          {isCollapsed
            ? <ChevronRight size={14} />
            : <ChevronLeft size={14} />
          }
        </button>

        {/* Logo header */}
        <div className={`h-[64px] flex items-center shrink-0 px-5 border-b border-white/5 ${isCollapsed ? 'md:px-0 md:justify-center' : ''}`}>
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'md:gap-0' : ''}`}>
            <div className="min-w-9 w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/25 shrink-0">
              <Building2 size={18} />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
              <p className="font-bold text-white text-[15px] tracking-tight whitespace-nowrap leading-tight">
                Bumantaraz
              </p>
              <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap tracking-widest uppercase">
                Property Manager
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden ml-auto p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
          <nav className="px-3 space-y-0.5">
            {filteredMenuItems.map((item) => {
              if (!item) return null;
              const hasSubmenus = !!item.submenus;
              const isActive = checkActive(item.path, item.submenus);
              const isOpenMenu = openMenus[item.title];

              return (
                <div key={item.title}>
                  {hasSubmenus ? (
                    <>
                      <button
                        onClick={() => handleMenuClick(item.title)}
                        title={isCollapsed ? item.title : undefined}
                        className={`
                          w-full flex items-center py-2.5 rounded-xl transition-all duration-200 group cursor-pointer
                          ${isCollapsed ? 'md:px-0 md:justify-center px-3' : 'px-3 justify-between'}
                          ${isActive
                            ? 'bg-white/10 text-white'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }
                        `}
                      >
                        <div className={`flex items-center gap-3 ${isCollapsed ? 'md:gap-0' : ''}`}>
                          <span className={`shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                            {item.icon}
                          </span>
                          <span className={`text-[13px] font-medium tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'w-auto opacity-100'}`}>
                            {item.title}
                          </span>
                        </div>
                        <ChevronDown
                          size={13}
                          className={`
                            transition-all duration-200 shrink-0 text-slate-600 group-hover:text-slate-400
                            ${isOpenMenu ? 'rotate-180 text-slate-400' : ''}
                            ${isCollapsed ? 'md:hidden' : ''}
                          `}
                        />
                      </button>

                      {/* Submenu */}
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpenMenu && !isCollapsed ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="ml-4 mt-0.5 mb-1 pl-3 border-l border-white/10 space-y-0.5">
                          {item.submenus!.map((sub) => (
                            <NavLink
                              key={sub.title}
                              to={sub.path}
                              className={({ isActive: linkActive }) => `
                                flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200
                                ${linkActive
                                  ? 'bg-blue-500/20 text-blue-300 font-semibold'
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 hover:translate-x-0.5'
                                }
                              `}
                            >
                              <span className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                              {sub.title}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <NavLink
                      to={item.path!}
                      title={isCollapsed ? item.title : undefined}
                      className={({ isActive: linkActive }) => `
                        w-full flex items-center py-2.5 rounded-xl transition-all duration-200 group cursor-pointer
                        ${isCollapsed ? 'md:px-0 md:justify-center px-3' : 'px-3'}
                        ${linkActive
                          ? 'bg-blue-500/15 text-blue-300'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }
                      `}
                    >
                      {({ isActive: linkActive }) => (
                        <div className={`flex items-center gap-3 ${isCollapsed ? 'md:gap-0' : ''}`}>
                          <span className={`shrink-0 transition-colors ${linkActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                            {item.icon}
                          </span>
                          <span className={`text-[13px] font-medium tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'w-auto opacity-100'}`}>
                            {item.title}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User info + Logout */}
        <div className={`shrink-0 border-t border-white/5 p-3 ${isCollapsed ? 'md:flex md:flex-col md:items-center' : ''}`}>
          {/* User card */}
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user?.username?.trim().slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{user?.username}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Keluar Sistem' : undefined}
            className={`
              w-full flex items-center py-2.5 rounded-xl transition-all duration-200 group cursor-pointer
              text-slate-500 hover:bg-red-500/10 hover:text-red-400
              ${isCollapsed ? 'md:px-0 md:justify-center px-3' : 'px-3 gap-3'}
            `}
          >
            <LogOut size={18} strokeWidth={1.75} className="shrink-0" />
            <span className={`text-[13px] font-medium transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'w-auto opacity-100'}`}>
              Keluar
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;