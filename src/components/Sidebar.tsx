/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCircle,
  FolderKanban,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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


  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialOpenMenus: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.submenus?.some(sub => location.pathname.startsWith(sub.path))) {
        initialOpenMenus[item.title] = true;
      }
    });
    return initialOpenMenus;
  });

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const checkActive = (path?: string, submenus?: { path: string }[]) => {
    if (path && location.pathname === path) return true;
    if (submenus && submenus.some((sub) => location.pathname === sub.path)) return true;
    return false;
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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/60 flex flex-col transition-all duration-500 ease-in-out shrink-0 md:static md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'
          }`}
      >
        <div className="h-20 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">
              B
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tighter text-slate-900">Bumantaraz</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const hasSubmenus = !!item.submenus;
              const isActive = checkActive(item.path, item.submenus);
              const isOpenMenu = openMenus[item.title];

              return (
                <div key={item.title} className="relative">
                  {hasSubmenus ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${isActive
                          ? 'text-slate-900 font-bold'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`${isActive ? 'text-black' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`}>
                            {item.icon}
                          </span>
                          <span className="text-sm tracking-tight">{item.title}</span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 text-slate-300 group-hover:text-slate-500 ${isOpenMenu ? 'rotate-180' : ''}`}
                        />
                      </button>

                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpenMenu ? 'max-h-64 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                        <div className="ml-6 pl-4 border-l-2 border-slate-100 space-y-1">
                          {item.submenus!.map((sub) => {
                            return (
                              <NavLink
                                key={sub.title}
                                to={sub.path}
                                className={({ isActive: linkActive }) => `
                                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200
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

                      className={({ isActive: linkActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${linkActive
                          ? 'bg-black text-white shadow-lg shadow-black/20 font-bold translate-x-1'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      {/* SOLUSI ERROR 2: Gunakan fungsi manual untuk class icon agar TS tidak bingung */}
                      {({ isActive: linkActive }) => (
                        <>
                          <span className={linkActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}>
                            {item.icon}
                          </span>
                          <span className="text-sm tracking-tight">{item.title}</span>
                        </>
                      )}
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