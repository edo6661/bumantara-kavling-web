import { useState } from 'react';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import ScrollToTop from './ScrollToTop';

const RootLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);




  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-black selection:text-white">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <ScrollToTop />
      </div>
    </div>
  );
};

export default RootLayout;