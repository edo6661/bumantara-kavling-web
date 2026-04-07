import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCircle,
  FolderKanban,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={20} />,
  },
  {
    title: 'Management',
    icon: <Briefcase size={20} />,
    submenus: [
      { title: 'Penjualan', path: '/management/penjualan' },
      { title: 'Kavling', path: '/management/kavling' },
      { title: 'Notaris', path: '/management/notaris' },
      { title: 'Bank', path: '/management/bank' },
    ],
  },
  {
    title: 'Customer',
    icon: <Users size={20} />,
    submenus: [
      { title: 'Data Sosial', path: '/customer/data-sosial' },
      { title: 'SPR', path: '/customer/spr' },
      { title: 'Administrasi', path: '/customer/kelengkapan-administrasi' },
      { title: 'Kavling', path: '/customer/kavling' },
    ],
  },
  {
    title: 'Marketing',
    path: '/marketing',
    icon: <UserCircle size={20} />,
    submenus: [
      { title: 'Agents', path: '/customer/agents' },
      { title: 'Fee Agent', path: '/customer/fee-agent' },
    ],
  },
  {
    title: 'Proyek',
    icon: <FolderKanban size={20} />,
    submenus: [
      { title: 'SPK', path: '/proyek/spk' },
      { title: 'Progress', path: '/proyek/progress' },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActiveRoute = (path?: string, submenus?: { path: string }[]) => {
    if (path && location.pathname === path) return true;
    if (submenus && submenus.some((sub) => location.pathname === sub.path)) return true;
    return false;
  };

  return (
    <aside className="w-64 h-screen bg-sidebar-bg border-r border-sidebar-border text-sidebar-text flex flex-col transition-base shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border font-heading font-bold text-xl">
        Bumantaraz
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = isActiveRoute(item.path, item.submenus);
            const isOpen = openMenus[item.title] || isActive;

            return (
              <div key={item.title}>
                {item.submenus ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-radius-btn transition-colors duration-200 cursor-pointer ${isActive
                        ? 'bg-sidebar-hover-bg text-sidebar-text font-medium'
                        : 'hover:bg-sidebar-hover-bg text-sidebar-text/80 hover:text-sidebar-text'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isOpen && (
                      <div className="mt-1 mb-2 space-y-1 px-3 pb-2 border-l border-sidebar-border ml-5">
                        {item.submenus.map((sub) => (
                          <NavLink
                            key={sub.title}
                            to={sub.path}
                            className={({ isActive }) =>
                              `block px-3 py-2 rounded-radius-btn text-sm transition-colors duration-200 ${isActive
                                ? 'bg-sidebar-active-bg text-sidebar-active-text font-medium shadow-sm'
                                : 'text-sidebar-text/70 hover:bg-sidebar-submenu-bg hover:text-sidebar-text'
                              }`
                            }
                          >
                            {sub.title}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path!}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-radius-btn transition-colors duration-200 ${isActive
                        ? 'bg-sidebar-active-bg text-sidebar-active-text font-medium shadow-sm'
                        : 'text-sidebar-text/80 hover:bg-sidebar-hover-bg hover:text-sidebar-text'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;