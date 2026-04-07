import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCircle,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
  },
  {
    title: 'Management',
    icon: <Briefcase size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'Penjualan', path: '/management/penjualan' },
      { title: 'Kavling', path: '/management/kavling' },
      { title: 'Notaris', path: '/management/notaris' },
      { title: 'Bank', path: '/management/bank' },
    ],
  },
  {
    title: 'Customer',
    icon: <Users size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'Data Sosial', path: '/customer/data-sosial' },
      { title: 'SPR', path: '/customer/spr' },
      { title: 'Administrasi', path: '/customer/kelengkapan-administrasi' },
      { title: 'Kavling', path: '/customer/kavling' },
    ],
  },
  {
    title: 'Marketing',
    icon: <UserCircle size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'Agents', path: '/marketing/agents' },
      { title: 'Fee Agent', path: '/marketing/fee-agent' },
    ],
  },
  {
    title: 'Proyek',
    icon: <FolderKanban size={20} strokeWidth={1.5} />,
    submenus: [
      { title: 'SPK', path: '/proyek/spk' },
      { title: 'Progress', path: '/proyek/progress' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActiveRoute = (path?: string, submenus?: { path: string }[]) => {
    if (path && location.pathname === path) return true;
    if (submenus && submenus.some((sub) => location.pathname === sub.path)) return true;
    return false;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shrink-0 md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } shadow-2xl md:shadow-none`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              B
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-gray-900">Bumantaraz</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = isActiveRoute(item.path, item.submenus);
              const isOpenMenu = openMenus[item.title] || isActive;

              return (
                <div key={item.title}>
                  {item.submenus ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive
                          ? 'bg-gray-50 text-black font-semibold'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-black' : 'text-gray-400'}>{item.icon}</span>
                          <span>{item.title}</span>
                        </div>
                        {isOpenMenu ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </button>

                      {isOpenMenu && (
                        <div className="mt-1 mb-3 space-y-1 px-4 pb-2 border-l-2 border-gray-100 ml-6">
                          {item.submenus.map((sub) => (
                            <NavLink
                              key={sub.title}
                              to={sub.path}
                              className={({ isActive }) =>
                                `block px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive
                                  ? 'bg-black text-white font-medium shadow-sm'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
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
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                          ? 'bg-black text-white font-medium shadow-sm'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                        }`
                      }
                    >
                      <span className={isActiveRoute(item.path) ? 'text-white' : 'text-gray-400'}>
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </NavLink>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;