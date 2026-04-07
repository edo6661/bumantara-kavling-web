import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  return (
    <header className="h-16 flex items-center px-4 border-b border-gray-200 bg-white md:hidden shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
      >
        <Menu size={24} />
      </button>
      <span className="font-heading font-bold text-lg text-gray-900">Bumantaraz</span>
    </header>
  );
};

export default Navbar;