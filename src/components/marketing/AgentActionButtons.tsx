import type { MouseEvent } from 'react';
import { Edit2, Eye, Key, Trash2, UploadCloud, CheckCircle } from 'lucide-react';
import type { AgentData } from '../../types/models/agent';
import type { AgentCrudApi, OpenAgentModalOptions } from '../../hooks/useAgentCrud';

interface AgentActionButtonsProps {
  agent: AgentData;
  crud: Pick<
    AgentCrudApi,
    'handleApprove' | 'openDetailModal' | 'openModal' | 'openUploadModal' | 'handleGenerateAccount' | 'handleDelete'
  >;
  openModalOptions?: OpenAgentModalOptions;
  /** Stop event propagation (for nested clickable rows) */
  stopPropagation?: boolean;
  className?: string;
}

const AgentActionButtons = ({
  agent,
  crud,
  openModalOptions,
  stopPropagation = true,
  className = '',
}: AgentActionButtonsProps) => {
  const wrap = (fn: () => void) => (e: MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    fn();
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {agent.status === 'PENDING' && (
        <button
          onClick={wrap(() => void crud.handleApprove(agent))}
          className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-md transition-all cursor-pointer shadow-sm"
          title="Setujui Agent (Approve)"
          type="button"
        >
          <CheckCircle size={16} />
        </button>
      )}
      <button
        onClick={wrap(() => crud.openDetailModal(agent))}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
        title="Detail"
        type="button"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={wrap(() => crud.openModal(agent, openModalOptions))}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
        title="Edit"
        type="button"
      >
        <Edit2 size={16} />
      </button>
      <button
        onClick={wrap(() => crud.openUploadModal(agent))}
        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all cursor-pointer"
        title="Upload Dokumen Agent"
        type="button"
      >
        <UploadCloud size={16} />
      </button>
      <button
        onClick={wrap(() => void crud.handleGenerateAccount(agent))}
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          agent.hasAccount
            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700'
            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
        }`}
        title={agent.hasAccount ? 'Reset Kredensial (Password)' : 'Buat Akun Portal Agent'}
        type="button"
      >
        <Key size={16} />
      </button>
      <button
        onClick={wrap(() => void crud.handleDelete(agent))}
        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
        title="Hapus"
        type="button"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default AgentActionButtons;
