import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, Receipt, TrendingUp, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canReadResource } from '../../utils/permissions';

import Penjualan from '../Management/Penjualan';
import Tagihan from '../Customer/Tagihan';
import LaporanPemasukanPenjualan from '../Laporan/LaporanPemasukanPenjualan';

type TabId = 'penjualan' | 'tagihan' | 'laporan';

const TABS: { id: TabId; label: string; icon: LucideIcon; resource: string }[] = [
  { id: 'penjualan', label: 'Penjualan', icon: ShoppingCart, resource: 'PENJUALAN' },
  { id: 'tagihan', label: 'Tagihan', icon: Receipt, resource: 'TAGIHAN' },
  { id: 'laporan', label: 'Pemasukan', icon: TrendingUp, resource: 'LAPORAN' },
];

const ManajemenTransaksi = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const availableTabs = useMemo(
    () => TABS.filter((tab) => canReadResource(user, tab.resource)),
    [user],
  );

  const tabParam = searchParams.get('tab') as TabId | null;
  const activeTab: TabId =
    tabParam && availableTabs.some((tab) => tab.id === tabParam)
      ? tabParam
      : (availableTabs[0]?.id ?? 'penjualan');

  const filterCustomerName = searchParams.get('filterCustomerName') || '';

  const handleTabChange = (tabId: TabId) => {
    setSearchParams((prev) => {
      prev.set('tab', tabId);
      return prev;
    });
  };

  const clearGlobalFilter = () => {
    setSearchParams((prev) => {
      prev.delete('filterCustomerName');
      prev.delete('filterKavling');
      return prev;
    });
  };

  const showTabs = availableTabs.length > 1;

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-50/60 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-5 py-6 space-y-6 animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="px-6 pt-5 pb-0">
            <h1 className="mb-8 text-[26px] font-black text-slate-900 tracking-tight leading-none mb-1.5">
              Transaksi
            </h1>

            {filterCustomerName && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-semibold text-blue-700">
                <span>Filter Aktif: Customer <strong className="text-blue-900">{filterCustomerName}</strong></span>
                <button
                  onClick={clearGlobalFilter}
                  className="p-0.5 hover:bg-blue-200 rounded-md transition-colors"
                  title="Hapus Filter"
                >
                  <XCircle size={14} />
                </button>
              </div>
            )}

            {showTabs && (
              <div className="flex items-center gap-6 border-b border-slate-100 overflow-x-auto custom-scrollbar">
                {availableTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all border-b-[3px] whitespace-nowrap ${
                        isActive
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="min-h-[60vh]">
          {activeTab === 'penjualan' && <Penjualan />}
          {activeTab === 'tagihan' && <Tagihan />}
          {activeTab === 'laporan' && <LaporanPemasukanPenjualan />}
        </div>
      </div>
    </div>
  );
};

export default ManajemenTransaksi;
