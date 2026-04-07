import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const location = useLocation();


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

        {/* Judul Halaman di Header (Hanya muncul di Desktop) */}
        <div className="hidden md:block">
          <h1 className="text-xl font-bold font-heading text-gray-900 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>

        {/* Logo Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
            B
          </div>
          <span className="font-heading font-bold text-lg text-gray-900 tracking-tight">Bumantaraz</span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">


        <div className="w-9 h-9 bg-gradient-to-tr from-gray-800 to-black rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md cursor-pointer border-2 border-white ring-1 ring-gray-100">
          Aq
        </div>
      </div>
    </header>
  );
};

export default Navbar;