import { useEffect, useState } from 'react';
import {
  useGetProgressProyek,
  useResetTotalProgressByKavling,
  useSetTotalProgressByKavling,
} from '../../hooks/queries/useProgressProyek';
import { handleApiError } from '../../utils/errorHandler';

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

interface TotalProgressOverrideControlsProps {
  kavlingId: number;
  canEdit: boolean;
  compact?: boolean;
}

const TotalProgressOverrideControls = ({
  kavlingId,
  canEdit,
  compact = false,
}: TotalProgressOverrideControlsProps) => {
  const { data, isLoading } = useGetProgressProyek({ kavlingId });
  const setTotalMutation = useSetTotalProgressByKavling();
  const resetTotalMutation = useResetTotalProgressByKavling();

  const current = clampPercent(Number(data?.persentase ?? 0));
  const isOverride = data?.persentaseIsOverride ?? false;
  const [input, setInput] = useState(String(current));

  useEffect(() => {
    setInput(String(current));
  }, [current]);

  const isMutating = setTotalMutation.isPending || resetTotalMutation.isPending;

  if (isLoading) {
    return <span className="text-xs text-slate-400">...</span>;
  }

  return (
    <div className={compact ? 'flex items-center gap-2 flex-wrap' : 'space-y-2'}>
      <div className="flex items-center gap-2">
        <div
          className={`bg-slate-200 rounded-full h-2 overflow-hidden ${compact ? 'w-16' : 'w-32'}`}
        >
          <div
            className={`h-full rounded-full ${current === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
            style={{ width: `${current}%` }}
          />
        </div>
        <span className="text-xs font-black text-slate-700">
          {current}%{isOverride ? ' *' : ''}
        </span>
        {!compact && (
          <span className="text-[10px] text-slate-500">
            {isOverride ? '(manual)' : '(default dari tahapan)'}
          </span>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onBlur={() => {
              if (input === '') setInput(String(current));
              else setInput(String(clampPercent(parseInt(input, 10))));
            }}
            className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 text-center outline-none"
          />
          <span className="text-xs font-bold text-slate-500">%</span>
          <button
            type="button"
            disabled={isMutating}
            onClick={async () => {
              const parsed = input === '' ? current : clampPercent(parseInt(input, 10));
              try {
                await setTotalMutation.mutateAsync({ kavlingId, persentase: parsed });
              } catch (err: unknown) {
                alert(handleApiError(err).message);
              }
            }}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 text-white hover:bg-black disabled:opacity-50"
          >
            Simpan
          </button>
          <button
            type="button"
            disabled={isMutating || !isOverride}
            onClick={async () => {
              try {
                await resetTotalMutation.mutateAsync({ kavlingId });
              } catch (err: unknown) {
                alert(handleApiError(err).message);
              }
            }}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Default
          </button>
        </div>
      )}
    </div>
  );
};

export default TotalProgressOverrideControls;
