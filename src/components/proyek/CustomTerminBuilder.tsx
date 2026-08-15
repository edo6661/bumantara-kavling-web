import React from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2, Wand2 } from 'lucide-react';
import type { SpkCustomTerminStep } from '../../utils/spkTerminScheme';
import { validateCustomTerminConfig } from '../../utils/spkTerminScheme';

interface CustomTerminBuilderProps {
  value: SpkCustomTerminStep[];
  onChange: (steps: SpkCustomTerminStep[]) => void;
  nilaiKontrak?: number;
  disabled?: boolean;
}

export const CustomTerminBuilder: React.FC<CustomTerminBuilderProps> = ({
  value,
  onChange,
  nilaiKontrak = 0,
  disabled = false,
}) => {
  const steps = value && value.length > 0 ? value : [];

  const totalPercentage = steps.reduce(
    (acc, step) => acc + Math.round((step.kontrakFraction || 0) * 100),
    0,
  );

  const validation = validateCustomTerminConfig(steps);

  const handleAddRow = () => {
    if (disabled || steps.length >= 11) return;
    const nextUrutan = steps.length + 1;
    const remainingPct = Math.max(0, 100 - totalPercentage);
    const lastProgress = steps.length > 0 ? steps[steps.length - 1]!.minProgress : 0;
    const nextProgress = Math.min(100, lastProgress + 25);

    const newStep: SpkCustomTerminStep = {
      urutan: nextUrutan,
      label: `Termin ${nextUrutan}`,
      shortLabel: `${remainingPct || 25}%·${nextUrutan}`,
      kontrakFraction: (remainingPct || 25) / 100,
      minProgress: nextProgress,
      isRetensi: false,
    };

    onChange([...steps, newStep]);
  };

  const handleRemoveRow = (index: number) => {
    if (disabled || steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      urutan: i + 1,
    }));
    onChange(next);
  };

  const handleUpdateField = (
    index: number,
    field: keyof SpkCustomTerminStep,
    val: any,
  ) => {
    if (disabled) return;
    const next = steps.map((s, i) => {
      if (i !== index) return s;
      if (field === 'kontrakFraction') {
        const pct = Math.max(0, Math.min(100, Number(val) || 0));
        return {
          ...s,
          kontrakFraction: pct / 100,
          shortLabel: s.isRetensi ? 'Ret.' : `${pct}%·${s.urutan}`,
        };
      }
      if (field === 'minProgress') {
        return { ...s, minProgress: Math.max(0, Math.min(100, Number(val) || 0)) };
      }
      if (field === 'isRetensi') {
        const isRet = Boolean(val);
        return {
          ...s,
          isRetensi: isRet,
          label: isRet ? (s.label.toLowerCase().includes('retensi') ? s.label : 'Retensi (5% kontrak)') : s.label,
          shortLabel: isRet ? 'Ret.' : `${Math.round(s.kontrakFraction * 100)}%·${s.urutan}`,
        };
      }
      return { ...s, [field]: val };
    });
    onChange(next);
  };

  const handleApplyPreset = (type: '3_TERMIN' | '4_TERMIN' | '50_45_5') => {
    if (disabled) return;
    if (type === '3_TERMIN') {
      onChange([
        { urutan: 1, label: 'Termin 1 (35% progress)', kontrakFraction: 0.35, minProgress: 35 },
        { urutan: 2, label: 'Termin 2 (70% progress)', kontrakFraction: 0.35, minProgress: 70 },
        { urutan: 3, label: 'Termin 3 (95% progress)', kontrakFraction: 0.25, minProgress: 95 },
        { urutan: 4, label: 'Retensi (5% kontrak)', kontrakFraction: 0.05, minProgress: 100, isRetensi: true },
      ]);
    } else if (type === '4_TERMIN') {
      onChange([
        { urutan: 1, label: 'Termin 1 (25% progress)', kontrakFraction: 0.25, minProgress: 25 },
        { urutan: 2, label: 'Termin 2 (50% progress)', kontrakFraction: 0.25, minProgress: 50 },
        { urutan: 3, label: 'Termin 3 (75% progress)', kontrakFraction: 0.25, minProgress: 75 },
        { urutan: 4, label: 'Termin 4 (95% progress)', kontrakFraction: 0.20, minProgress: 95 },
        { urutan: 5, label: 'Retensi (5% kontrak)', kontrakFraction: 0.05, minProgress: 100, isRetensi: true },
      ]);
    } else if (type === '50_45_5') {
      onChange([
        { urutan: 1, label: 'Termin 55% (50% kontrak)', kontrakFraction: 0.50, minProgress: 55 },
        { urutan: 2, label: 'Termin 100% (45% kontrak)', kontrakFraction: 0.45, minProgress: 100 },
        { urutan: 3, label: 'Retensi (5% kontrak)', kontrakFraction: 0.05, minProgress: 100, isRetensi: true },
      ]);
    }
  };

  const is100Percent = Math.abs(totalPercentage - 100) < 0.1;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all dark:border-slate-800 dark:bg-slate-900/40">
      {/* Header & Preset Quickloader */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>Konfigurasi Skema Termin Kustom</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Dinamis
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tentukan nama, persentase nilai kontrak, dan ambang batas minimum progress proyek.
          </p>
        </div>

        {!disabled && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
              <Wand2 className="h-3.5 w-3.5 text-amber-500" /> Muat Template:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('50_45_5')}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              50-45-5%
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('3_TERMIN')}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              35-35-25-5%
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('4_TERMIN')}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              25×3-20-5%
            </button>
          </div>
        )}
      </div>

      {/* Interactive Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-100/75 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
            <tr>
              <th className="w-10 px-3 py-2.5 text-center">#</th>
              <th className="min-w-[200px] px-3 py-2.5">Nama / Milestone Termin</th>
              <th className="w-28 px-3 py-2.5 text-center">Porsi (%)</th>
              <th className="w-28 px-3 py-2.5 text-center">Min. Progress (%)</th>
              {nilaiKontrak > 0 && <th className="w-36 px-3 py-2.5 text-right">Est. Nominal</th>}
              <th className="w-24 px-3 py-2.5 text-center">Retensi?</th>
              {!disabled && <th className="w-12 px-3 py-2.5 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {steps.map((step, idx) => {
              const pct = Math.round((step.kontrakFraction || 0) * 100);
              const nominalEst = Math.round(nilaiKontrak * (step.kontrakFraction || 0));

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    step.isRetensi
                      ? 'bg-amber-50/40 dark:bg-amber-950/15'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="px-3 py-2 text-center font-medium text-slate-500 dark:text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={step.label}
                      onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                      placeholder={`Termin ${idx + 1}`}
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        disabled={disabled}
                        value={pct || ''}
                        onChange={(e) =>
                          handleUpdateField(idx, 'kontrakFraction', e.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 pr-6 pl-2.5 py-1.5 text-center text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <span className="pointer-events-none absolute right-2 text-xs font-medium text-slate-400">
                        %
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={disabled}
                        value={step.minProgress ?? ''}
                        onChange={(e) =>
                          handleUpdateField(idx, 'minProgress', e.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 pr-6 pl-2.5 py-1.5 text-center text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <span className="pointer-events-none absolute right-2 text-xs font-medium text-slate-400">
                        %
                      </span>
                    </div>
                  </td>
                  {nilaiKontrak > 0 && (
                    <td className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                      Rp {nominalEst.toLocaleString('id-ID')}
                    </td>
                  )}
                  <td className="px-3 py-2 text-center">
                    <label className="inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={step.isRetensi === true}
                        onChange={(e) =>
                          handleUpdateField(idx, 'isRetensi', e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </label>
                  </td>
                  {!disabled && (
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={steps.length <= 1}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        title="Hapus baris termin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer controls & Total summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!disabled && (
          <button
            type="button"
            onClick={handleAddRow}
            disabled={steps.length >= 11}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-slate-800/80"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Termin</span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold ${
              is100Percent
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {is100Percent ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>Total Porsi: {totalPercentage}% / 100%</span>
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {!validation.valid && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-start gap-2 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>{validation.message}</span>
        </div>
      )}
    </div>
  );
};
