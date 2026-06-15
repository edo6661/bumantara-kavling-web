import { useState, type MouseEvent } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Receipt, ShoppingCart } from 'lucide-react';
import { goToTransaksiTab } from '../../utils/customerNavigation';

type CustomerNameActionTdProps = {
  customerNama: string;
  className?: string;
};

const CustomerNameActionTd = ({ customerNama, className = '' }: CustomerNameActionTdProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, dropUp: false });

  const handleTdClick = (e: MouseEvent<HTMLTableCellElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropUp = spaceBelow < 120;

    setMenuPos({
      top: dropUp ? rect.top : rect.bottom,
      left: rect.left,
      dropUp,
    });
    setOpen((prev) => !prev);
  };

  const goToPenjualan = () => {
    goToTransaksiTab({
      tab: 'penjualan',
      customerNama,
      pathname,
      navigate,
      setSearchParams,
    });
    setOpen(false);
  };

  const goToTagihan = () => {
    goToTransaksiTab({
      tab: 'tagihan',
      customerNama,
      pathname,
      navigate,
      setSearchParams,
    });
    setOpen(false);
  };

  return (
    <td
      className={`py-3 px-4 font-semibold text-slate-800 border-r border-slate-50 cursor-pointer hover:bg-slate-100/80 active:bg-slate-100 transition-colors ${className}`}
      onClick={handleTdClick}
      title="Klik untuk buka penjualan atau tagihan customer"
    >
      <span className="hover:text-blue-700 transition-colors underline decoration-dotted decoration-slate-300 underline-offset-2">
        {customerNama}
      </span>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            className="fixed min-w-[200px] bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
            style={{
              top: menuPos.dropUp ? 'auto' : `${menuPos.top + 6}px`,
              bottom: menuPos.dropUp ? `${window.innerHeight - menuPos.top + 6}px` : 'auto',
              left: `${menuPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={goToPenjualan}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer text-left"
            >
              <ShoppingCart size={14} className="shrink-0 text-blue-600" />
              Lihat Penjualan
            </button>
            <div className="h-px bg-slate-100 mx-2" />
            <button
              type="button"
              onClick={goToTagihan}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer text-left"
            >
              <Receipt size={14} className="shrink-0 text-emerald-600" />
              Lihat Tagihan
            </button>
          </div>
        </>
      )}
    </td>
  );
};

export default CustomerNameActionTd;
