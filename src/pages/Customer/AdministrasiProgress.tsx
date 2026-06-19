import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ban, ClipboardList, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canReadResource } from '../../utils/permissions';
import Administrasi from './Administrasi';
import ProgressPenjualan from '../Management/ProgressPenjualan';

type TabId = 'administrasi' | 'progress-penjualan';

const TABS: { id: TabId; label: string; resource: string; icon: LucideIcon }[] = [
  { id: 'administrasi', label: 'Administrasi Customer', resource: 'CUSTOMER', icon: Users },
  { id: 'progress-penjualan', label: 'Progress Penjualan', resource: 'PROGRESS_PENJUALAN', icon: ClipboardList },
];

const AdministrasiProgress = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const availableTabs = useMemo(
    () => TABS.filter((tab) => canReadResource(user, tab.resource)),
    [user],
  );

  const canAdmin = canReadResource(user, 'CUSTOMER');
  const canProgressPenjualan = canReadResource(user, 'PROGRESS_PENJUALAN');

  const tabParam = searchParams.get('tab') as TabId | null;
  const fallbackTab: TabId = !canAdmin && canProgressPenjualan ? 'progress-penjualan' : 'administrasi';
  const activeTab: TabId =
    tabParam && availableTabs.some((tab) => tab.id === tabParam)
      ? tabParam
      : availableTabs.some((tab) => tab.id === fallbackTab)
        ? fallbackTab
        : (availableTabs[0]?.id ?? 'administrasi');

  const setActiveTab = (tab: TabId) => {
    setSearchParams((prev) => {
      if (tab === 'administrasi') prev.delete('tab');
      else prev.set('tab', tab);
      prev.delete('page');
      prev.delete('search');
      prev.delete('limit');
      prev.delete('orderBy');
      return prev;
    });
  };

  if (availableTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Ban size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Akses Ditolak</h2>
        <p className="text-sm font-medium text-slate-500 max-w-md">
          Maaf, Role Anda tidak memiliki izin untuk melihat modul Administrasi atau Progress Penjualan.
        </p>
      </div>
    );
  }

  const showTabs = availableTabs.length > 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {showTabs && (
        <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar bg-white p-2 rounded-2xl shadow-sm gap-1">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm tracking-wide transition-colors cursor-pointer ${
                  isActive
                    ? 'border-black text-black'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'administrasi' && <Administrasi />}
      {activeTab === 'progress-penjualan' && <ProgressPenjualan />}
    </div>
  );
};

export default AdministrasiProgress;
