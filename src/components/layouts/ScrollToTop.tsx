import { useEffect, useRef } from 'react';
import { useLocation, Outlet } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <main
      ref={mainRef}
      className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative z-0"
    >
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Outlet />
      </div>
    </main>
  );
};

export default ScrollToTop;
