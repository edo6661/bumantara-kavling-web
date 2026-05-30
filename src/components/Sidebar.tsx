import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom'; // <-- Tambah useNavigate
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCircle,
  FolderKanban,
  ChevronDown,
  X,
  ChevronRight,
  ShoppingCart,
  LogOut, // <-- Tambah icon LogOut
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
  },
  {
    title: 'Penjualan',
    icon: <ShoppingCart size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'Data', path: '/management/penjualan', resource: 'PENJUALAN' },
      { title: 'Progress', path: '/management/progress-penjualan', resource: 'PROGRESS_PENJUALAN' },
      { title: 'Ganti Kavling', path: '/management/ganti-kavling', resource: 'GANTI_KAVLING' },
      { title: 'Batal Transaksi', path: '/management/batal-transaksi', resource: 'BATAL_TRANSAKSI' },
    ],
  },
  {
    title: 'Management',
    icon: <Briefcase size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'Kavling', path: '/management/kavling', resource: 'KAVLING' },
      { title: 'Notaris', path: '/management/notaris', resource: 'NOTARIS' },
      { title: 'Bank', path: '/management/bank', resource: 'BANK' },
      { title: 'User', path: '/management/users', resource: 'USER' },
      { title: 'Akses', path: '/management/role-permission', resource: 'ROLE_PERMISSION' },
      { title: 'Audit Log', path: '/management/audit-log', resource: 'AUDIT_LOG' },
    ],
  },
  {
    title: 'Customer',
    icon: <Users size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'Administrasi', path: '/customer/administrasi', resource: 'CUSTOMER' },
      { title: 'Kavling', path: '/customer/kavling', resource: 'CUSTOMER_KAVLING' },
      { title: 'Pembayaran', path: '/customer/tagihan', resource: 'TAGIHAN' },
    ],
  },
  {
    title: 'Marketing',
    icon: <UserCircle size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'Agents', path: '/marketing/agents', resource: 'AGENT' },
      { title: 'Fee Agent', path: '/marketing/fee-agent', resource: 'FEE_AGENT' },
      { title: 'Perusahaan Agent', path: '/marketing/perusahaan', resource: 'AGENT' },
    ],
  },
  {
    title: 'Finance',
    icon: <Banknote size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'Approve Pembayaran', path: '/finance/approve-pembayaran', resource: 'TAGIHAN' },
      { title: 'Bayar Kode Billing PPh', path: '/finance/bayar-kode-billing-pph', resource: 'TAGIHAN' },
      { title: 'Bayar SPK Mandor', path: '/finance/bayar-spk', resource: 'TAGIHAN' },
      { title: 'Bayar Notaris', path: '/finance/bayar-notaris', resource: 'TAGIHAN' },
      { title: 'Bayar Bank KPR', path: '/finance/bayar-kpr', resource: 'TAGIHAN' },
    ],
  },
  {
    title: 'Proyek',
    icon: <FolderKanban size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'SPK', path: '/proyek/spk', resource: 'SPK' },
      { title: 'Progress', path: '/proyek/progress', resource: 'PROGRESS_PROYEK' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate(); // <-- Inisialisasi useNavigate
  const { user, logout } = useAuth(); // <-- Ambil fungsi logout dari context
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const [isExpanded, setIsExpanded] = useState(true);

  const filteredMenuItems = menuItems.map(item => {
    if (!item.submenus) {
      if (item.path === '/' && user?.role === 'MANDOR') return null;
      return item;
    }

    const filteredSubmenus = item.submenus.filter(sub => {
      if (!sub.resource) return true;
      if (isSuperAdmin) return true;
      return user?.permissions?.some(p => p.resource === sub.resource && p.canRead);
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
    if (!isExpanded) {
      setIsExpanded(true);
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

  // <-- Tambah fungsi handleLogout
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/60 flex flex-col transition-all duration-300 ease-in-out shrink-0 md:static md:translate-x-0 
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}
          ${!isExpanded ? 'w-72 md:w-20' : 'w-72'} 
        `}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden md:flex absolute -right-3 top-7 z-50 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm rounded-full p-1 cursor-pointer transition-transform duration-300 hover:scale-110"
        >
          <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <div className={`h-20 flex items-center shrink-0 transition-all duration-300 px-8 justify-between ${!isExpanded ? 'md:px-0 md:justify-center' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-9 w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20 shrink-0">
              B
            </div>
            <span className={`font-heading font-extrabold text-xl tracking-tighter text-slate-900 transition-all duration-300 whitespace-nowrap overflow-hidden opacity-100 w-auto ${!isExpanded ? 'md:opacity-0 md:w-0' : ''}`}>
              Bumantaraz
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar overflow-x-hidden">
          <p className={`px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap overflow-hidden mb-4 opacity-100 h-auto ${!isExpanded ? 'md:opacity-0 md:h-0 md:mb-0' : ''}`}>
            Main Menu
          </p>

          <nav className="space-y-1">
            {filteredMenuItems.map((item) => {
              if (!item) return null;
              const hasSubmenus = !!item.submenus;
              const isActive = checkActive(item.path, item.submenus);
              const isOpenMenu = openMenus[item.title];

              return (
                <div key={item.title} className="relative">
                  {hasSubmenus ? (
                    <>
                      <button
                        onClick={() => handleMenuClick(item.title)}
                        title={!isExpanded ? item.title : undefined}
                        className={`w-full flex items-center py-3 rounded-xl transition-all duration-300 group cursor-pointer px-4 justify-between 
                          ${!isExpanded ? 'md:px-0 md:justify-center' : ''}
                          ${isActive ? 'text-slate-900 font-bold bg-slate-50 md:bg-transparent' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        <div className={`flex items-center gap-3 ${!isExpanded ? 'md:gap-0' : ''}`}>
                          <span className={`shrink-0 ${isActive ? 'text-black' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`}>
                            {item.icon}
                          </span>
                          <span className={`text-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 w-auto ml-3 ${!isExpanded ? 'md:opacity-0 md:w-0 md:ml-0' : ''}`}>
                            {item.title}
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`transition-all duration-300 shrink-0 text-slate-300 group-hover:text-slate-500 opacity-100 w-auto
                            ${isOpenMenu ? 'rotate-180' : ''}
                            ${!isExpanded ? 'md:opacity-0 md:w-0 overflow-hidden' : ''}`}
                        />
                      </button>

                      <div className={`overflow-hidden transition-all duration-300 ease-in-out 
                        ${isOpenMenu ? 'max-h-64 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}
                        ${!isExpanded ? 'md:max-h-0 md:opacity-0 md:mt-0 md:mb-0' : ''}
                      `}>
                        <div className="ml-6 pl-4 border-l-2 border-slate-100 space-y-1">
                          {item.submenus!.map((sub) => {
                            return (
                              <NavLink
                                key={sub.title}
                                to={sub.path}
                                className={({ isActive: linkActive }) => `
                                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap
                                  ${linkActive
                                    ? 'bg-black text-white shadow-md shadow-black/10'
                                    : 'text-slate-500 hover:text-slate-900 hover:translate-x-1'}
                                `}
                              >
                                {sub.title}
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <NavLink
                      to={item.path!}
                      title={!isExpanded ? item.title : undefined}
                      className={({ isActive: linkActive }) =>
                        `w-full flex items-center py-3 rounded-xl transition-all duration-300 group cursor-pointer px-4 justify-between
                        ${!isExpanded ? 'md:px-0 md:justify-center' : ''}
                        ${linkActive
                          ? `bg-black text-white shadow-lg shadow-black/20 font-bold translate-x-1 ${!isExpanded ? 'md:translate-x-0 md:bg-slate-100 md:text-black md:shadow-none' : ''}`
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive: linkActive }) => (
                        <div className={`flex items-center gap-3 ${!isExpanded ? 'md:gap-0' : ''}`}>
                          <span className={`shrink-0 transition-colors ${linkActive ? 'text-white ' + (!isExpanded ? 'md:text-black' : '') : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {item.icon}
                          </span>
                          <span className={`text-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 w-auto ml-3 ${!isExpanded ? 'md:opacity-0 md:w-0 md:ml-0' : ''}`}>
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

        {/* <-- TAMBAH BAGIAN INI: Tombol Logout di bagian paling bawah Sidebar --> */}
        <div className="shrink-0 p-4 border-t border-slate-200/60 bg-white">
          <button
            onClick={handleLogout}
            title={!isExpanded ? "Keluar Sistem" : undefined}
            className={`w-full flex items-center py-3 rounded-xl transition-all duration-300 group cursor-pointer px-4 justify-between text-red-500 hover:bg-red-50 hover:text-red-700
              ${!isExpanded ? 'md:px-0 md:justify-center' : ''}
            `}
          >
            <div className={`flex items-center gap-3 ${!isExpanded ? 'md:gap-0' : ''}`}>
              <span className="shrink-0 transition-colors">
                <LogOut size={20} strokeWidth={1.5} />
              </span>
              <span className={`text-sm tracking-tight font-bold whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 w-auto ml-3 ${!isExpanded ? 'md:opacity-0 md:w-0 md:ml-0' : ''}`}>
                Keluar
              </span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;