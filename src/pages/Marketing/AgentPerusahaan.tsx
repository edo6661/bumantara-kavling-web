import { Building2, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import KelolaPerusahaanAgentTab from './KelolaPerusahaanAgentTab';
import KelolaAgentTab from './KelolaAgentTab';

type AgentPerusahaanTab = 'perusahaan' | 'agent';

const AgentPerusahaan = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: AgentPerusahaanTab =
    searchParams.get('tab') === 'perusahaan' ? 'perusahaan' : 'agent';

  const handleTabChange = (tab: AgentPerusahaanTab) => {
    setSearchParams((prev) => {
      if (tab === 'agent') prev.delete('tab');
      else prev.set('tab', 'perusahaan');
      return prev;
    });
  };

  const tabBar = (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
      <button
        type="button"
        onClick={() => handleTabChange('perusahaan')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          activeTab === 'perusahaan'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Building2 size={16} />
        Kelola Agent Perusahaan
      </button>
      <button
        type="button"
        onClick={() => handleTabChange('agent')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          activeTab === 'agent'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Users size={16} />
        Kelola Agent
      </button>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {tabBar}
      {activeTab === 'perusahaan' ? <KelolaPerusahaanAgentTab /> : <KelolaAgentTab />}
    </div>
  );
};

export default AgentPerusahaan;
