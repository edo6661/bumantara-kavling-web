import { Menu, Building } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGetPerumahan } from '../hooks/queries/usePerumahan';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const location = useLocation();
  const { selectedPerumahan, setSelectedPerumahan } = useAuth();
  const { data: perumahanList } = useGetPerumahan();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Utama';
    const paths = path.split('/').filter(Boolean);
    const lastPath = paths[paths.length - 1];
    return lastPath.charAt(0).toUpperCase() + lastPath.slice(1).replace('-', ' ');
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

        {/* --- UPDATE: TAMPILKAN LOGO PERUMAHAN DI MOBILE --- */}
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
        {selectedPerumahan && perumahanList && (
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-black/5 transition-all">
            {/* --- UPDATE: TAMPILKAN LOGO KECIL DI SELECT BOX --- */}
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