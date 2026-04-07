import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  return (
    <header className="h-16 flex items-center px-4 md:px-6 border-b border-gray-100 bg-white sticky top-0 z-30 shrink-0 md:hidden shadow-sm">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 mr-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
      >
        <Menu size={24} />
      </button>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
          B
        </div>
        <span className="font-heading font-bold text-lg text-gray-900 tracking-tight">Bumantaraz</span>
      </div>
    </header>
  );
};

export default Navbar;