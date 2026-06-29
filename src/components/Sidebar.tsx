import { useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  FileBarChart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { canReadResource } from '../utils/permissions';
import { useSidebarBadges } from '../hooks/queries/useSidebarBadges';
import SidebarBadge from './ui/SidebarBadge';

const FINANCE_STAFF_ROLES = ['FINANCE', 'ADMIN', 'SUPERADMIN'] as const;
const ADMIN_STAFF_ROLES = ['ADMIN', 'SUPERADMIN'] as const;

type SubmenuItem =
  | {
      title: string;
      path: string;
      resource?: string;
      resources?: string[];
      pengawasOnly?: boolean;
      rolesOnly?: readonly string[];
    }
  | {
      title: string;
      resource?: string;
      resources?: string[];
      rolesOnly?: readonly string[];
      children: { title: string; path: string }[];
    };

type MenuItem = {
  title: string;
  icon: ReactNode;
  path?: string;
  submenus?: SubmenuItem[];
  agentOnly?: boolean;
};

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
  },
  {
    title: 'Profil Agent',
    path: '/profile',
    icon: <UserCircle size={18} strokeWidth={1.75} />,
    agentOnly: true,
  },
  {
    title: 'Penjualan',
    icon: <ShoppingCart size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'Manajemen Transaksi', path: '/management/manajemen-transaksi', resource: 'PENJUALAN' },
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
      { title: 'Administrasi', path: '/customer/administrasi', resources: ['CUSTOMER', 'PROGRESS_PENJUALAN'] },
      // { title: 'Kavling Customer', path: '/customer/kavling', resource: 'CUSTOMER_KAVLING' },
      // { title: 'Pembayaran', path: '/customer/tagihan', resource: 'TAGIHAN' },
    ],
  },
  {
    title: 'Marketing',
    icon: <UserCircle size={18} strokeWidth={1.75} />,
    submenus: [
      {
        title: 'Agents',
        resource: 'AGENT',
        children: [
          { title: 'Agent Pribadi', path: '/marketing/agents/pribadi' },
          { title: 'Agent Perusahaan', path: '/marketing/agents/perusahaan' },
        ],
      },
      { title: 'Riwayat Pencairan', path: '/marketing/fee-agent', resource: 'FEE_AGENT' },
    ],
  },
  {
    title: 'Finance',
    icon: <Banknote size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'Approve Pembayaran', path: '/finance/approve-pembayaran', resource: 'TAGIHAN' },
      { title: 'Kode Billing PPh', path: '/finance/bayar-kode-billing-pph', resource: 'TAGIHAN' },
      { title: 'Bayar SPK', path: '/finance/bayar-spk', resource: 'TAGIHAN' },
      { title: 'Bayar Agent', path: '/finance/bayar-agent', resource: 'TAGIHAN' },
      { title: 'Bayar Notaris', path: '/finance/bayar-notaris', resource: 'TAGIHAN' },
      { title: 'Bayar Bank KPR', path: '/finance/bayar-kpr', resource: 'TAGIHAN' },
    ],
  },
  {
    title: 'Proyek',
    icon: <FolderKanban size={18} strokeWidth={1.75} />,
    submenus: [
      { title: 'SPK', path: '/proyek/spk', resource: 'SPK' },
      { title: 'Approve SPK', path: '/proyek/approve-spk', resource: 'SPK', rolesOnly: ADMIN_STAFF_ROLES },
      { title: 'Approve Pembayaran SPK', path: '/proyek/approve-kasbon', resource: 'SPK', pengawasOnly: true },
      {
        title: 'Pembayaran',
        rolesOnly: FINANCE_STAFF_ROLES,
        children: [
          { title: 'Upah Tukang', path: '/proyek/pembayaran/upah-tukang' },
        ],
      },
      { title: 'Tukang', path: '/proyek/tukang', resource: 'SPK' },
      { title: 'Progress Proyek', path: '/proyek/progress', resource: 'PROGRESS_PROYEK' },
    ],
  },
  {
    title: 'Laporan',
    icon: <FileBarChart size={18} strokeWidth={1.75} />,
    submenus: [
      // { title: 'Eksekutif', path: '/laporan/eksekutif', resource: 'LAPORAN' },
      // { title: 'Penjualan & Koleksi', path: '/laporan/penjualan', resource: 'LAPORAN' },
      { title: 'Pemasukan Penjualan', path: '/laporan/pemasukan-penjualan', resource: 'LAPORAN' },
      { title: 'Rekap Pemasukan', path: '/laporan/rekap-pemasukan', resource: 'LAPORAN' },
      // { title: 'Rekap Pembayaran', path: '/laporan/rekap-pembayaran', resource: 'LAPORAN' },
      // { title: 'Progress Proyek', path: '/laporan/progress-proyek', resource: 'LAPORAN' },
      // { title: 'Biaya Proyek', path: '/laporan/biaya-proyek', resource: 'LAPORAN' },
      // { title: 'Keuangan', path: '/laporan/keuangan', resource: 'LAPORAN' },
      // { title: 'Marketing', path: '/laporan/marketing', resource: 'LAPORAN' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const isSpkRumahPath = (pathname: string, search: string) =>
  pathname === '/proyek/spk' && !search.includes('tab=infra');

const isSpkInfraPath = (pathname: string, search: string) =>
  pathname === '/proyek/spk' && search.includes('tab=infra');

const isSpkChildPathActive = (path: string, pathname: string, search: string) => {
  if (path.includes('tab=infra')) return isSpkInfraPath(pathname, search);
  if (path === '/proyek/spk') return isSpkRumahPath(pathname, search);
  return pathname.startsWith(path);
};

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationSearch = location.search || (searchParams.toString() ? `?${searchParams.toString()}` : '');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { getBadgeForPath, getSectionBadge } = useSidebarBadges();

  const canAccessSubmenu = (sub: SubmenuItem) => {
    if ('rolesOnly' in sub && sub.rolesOnly) {
      return !!user?.role && sub.rolesOnly.includes(user.role);
    }
    if ('pengawasOnly' in sub && sub.pengawasOnly) {
      return user?.role === 'PENGAWAS' || user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
    }
    if ('resources' in sub && sub.resources) {
      return sub.resources.some((resource) => canReadResource(user, resource));
    }
    if (!sub.resource) return true;
    return canReadResource(user, sub.resource);
  };

  const filteredMenuItems = menuItems.map(item => {
    if (item.agentOnly && user?.role !== 'AGENT') return null;
    if (!item.agentOnly && user?.role === 'AGENT' && item.path === '/') return null;
    if (user?.role === 'AGENT' && item.title === 'Management') return null;
    if (!item.submenus) {
      if (item.path === '/' && (user?.role === 'MANDOR' || user?.role === 'PENGAWAS')) {
        return null;
      }
      return item;
    }
    const filteredSubmenus = item.submenus
      .filter(canAccessSubmenu)
      .map((sub) => {
        if ('children' in sub && sub.children) {
          return { ...sub, children: sub.children };
        }
        if (
          user?.role === 'SUPERADMIN' &&
          'path' in sub &&
          sub.path === '/proyek/spk'
        ) {
          return {
            title: 'SPK',
            resource: 'SPK',
            children: [
              { title: 'SPK Rumah', path: '/proyek/spk' },
              { title: 'SPK Infrastruktur', path: '/proyek/spk?tab=infra' },
            ],
          };
        }
        return sub;
      })
      .filter((sub) => {
        if ('children' in sub && sub.children) return sub.children.length > 0;
        return true;
      });
    return { ...item, submenus: filteredSubmenus };
  }).filter(item => {
    if (!item) return false;
    return item.submenus ? item.submenus.length > 0 : true;
  });

  const isSubmenuPathActive = (sub: SubmenuItem) => {
    if ('path' in sub && sub.path) {
      if (sub.path === '/proyek/spk') {
        return location.pathname === '/proyek/spk';
      }
      return location.pathname.startsWith(sub.path);
    }
    if ('children' in sub && sub.children) {
      return sub.children.some((child) =>
        isSpkChildPathActive(child.path, location.pathname, locationSearch),
      );
    }
    return false;
  };

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialOpenMenus: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.submenus?.some(isSubmenuPathActive)) {
        initialOpenMenus[item.title] = true;
      }
    });
    return initialOpenMenus;
  });

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>(() => {
    const initialOpenSubMenus: Record<string, boolean> = {};
    menuItems.forEach(item => {
      item.submenus?.forEach((sub) => {
        if (
          'children' in sub &&
          sub.children?.some((child) =>
            isSpkChildPathActive(child.path, location.pathname, locationSearch),
          )
        ) {
          initialOpenSubMenus[`${item.title}::${sub.title}`] = true;
        }
      });
    });
    return initialOpenSubMenus;
  });

  const handleMenuClick = (title: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenMenus((prev) => ({ ...prev, [title]: true }));
    } else {
      setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
    }
  };

  const checkActive = (path?: string, submenus?: SubmenuItem[]) => {
    if (path && location.pathname === path) return true;
    if (submenus && submenus.some(isSubmenuPathActive)) return true;
    return false;
  };

  const handleSubMenuClick = (parentTitle: string, subTitle: string) => {
    const key = `${parentTitle}::${subTitle}`;
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenMenus((prev) => ({ ...prev, [parentTitle]: true }));
      setOpenSubMenus((prev) => ({ ...prev, [key]: true }));
    } else {
      setOpenSubMenus((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleLogout = () => {
    const isAgent = user?.role === 'AGENT';
    logout();
    navigate(isAgent ? '/agent-login' : '/login', { replace: true });
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
            <div className="min-w-9 w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/25 shrink-0">
              <Building2 size={18} />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
              <p className="font-bold text-white text-[15px] tracking-tight whitespace-nowrap leading-tight">
                Bumantaraz
              </p>
              <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap tracking-widest uppercase">
                Sistem Internal
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
              const sectionBadge = getSectionBadge(item.title);

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
                        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'md:gap-0' : ''}`}>
                          <span className={`relative shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                            {item.icon}
                            {isCollapsed && sectionBadge > 0 && (
                              <SidebarBadge count={sectionBadge} variant="compact" />
                            )}
                          </span>
                          <span className={`text-[13px] font-medium tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'w-auto opacity-100'}`}>
                            {item.title}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 shrink-0 ${isCollapsed ? 'md:hidden' : ''}`}>
                          {!isCollapsed && sectionBadge > 0 && (
                            <SidebarBadge count={sectionBadge} />
                          )}
                          <ChevronDown
                            size={13}
                            className={`
                              transition-all duration-200 text-slate-600 group-hover:text-slate-400
                              ${isOpenMenu ? 'rotate-180 text-slate-400' : ''}
                            `}
                          />
                        </div>
                      </button>

                      {/* Submenu */}
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpenMenu && !isCollapsed ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="ml-4 mt-0.5 mb-1 pl-3 border-l border-white/10 space-y-0.5">
                          {item.submenus!.map((sub) => {
                            if ('children' in sub && sub.children) {
                              const subKey = `${item.title}::${sub.title}`;
                              const isNestedOpen = openSubMenus[subKey];
                              const isNestedActive = isSubmenuPathActive(sub);

                              return (
                                <div key={sub.title}>
                                  <button
                                    type="button"
                                    onClick={() => handleSubMenuClick(item.title, sub.title)}
                                    className={`
                                      w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 cursor-pointer
                                      ${isNestedActive
                                        ? 'bg-white/10 text-slate-200'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                      }
                                    `}
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <span className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                                      <span className="truncate">{sub.title}</span>
                                    </span>
                                    <ChevronDown
                                      size={12}
                                      className={`shrink-0 transition-transform duration-200 ${isNestedOpen ? 'rotate-180' : ''}`}
                                    />
                                  </button>

                                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isNestedOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="ml-3 mt-0.5 pl-3 border-l border-white/10 space-y-0.5">
                                      {sub.children.map((child) => {
                                        const badgeCount = getBadgeForPath(child.path);
                                        const childLinkActive = isSpkChildPathActive(
                                          child.path,
                                          location.pathname,
                                          locationSearch,
                                        );
                                        return (
                                          <NavLink
                                            key={child.path}
                                            to={child.path}
                                            className={`
                                              flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-200
                                              ${childLinkActive
                                                ? 'bg-blue-500/20 text-blue-300 font-semibold'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 hover:translate-x-0.5'
                                              }
                                            `}
                                          >
                                            <span className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                                            <span className="flex-1 truncate">{child.title}</span>
                                            <SidebarBadge count={badgeCount} />
                                          </NavLink>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (!('path' in sub)) return null;

                            const badgeCount = getBadgeForPath(sub.path);
                            return (
                              <NavLink
                                key={sub.path}
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
                                <span className="flex-1 truncate">{sub.title}</span>
                                <SidebarBadge count={badgeCount} />
                              </NavLink>
                            );
                          })}
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
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