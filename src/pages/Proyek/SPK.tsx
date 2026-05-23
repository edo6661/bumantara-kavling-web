import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, X, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { handleApiError } from '../../utils/errorHandler';
import { useGetKavlings } from "../../hooks/queries/useKavling";
import { useGetMandors } from "../../hooks/queries/useProgressProyek";
import {
  useCreateSpk,
  useDeleteSpk,
  useGetSpk,
  useUpdateSpk,
} from "../../hooks/queries/useSpk";
import type { SpkData } from '../../services/spk.service';
import type { KavlingData } from '../../services/kavling.service';

interface SpkFormState {
  noSpk: string;
  tanggalSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number | '';
  notesPekerjaan: string;
  jatuhTempo: string;
  mandorId: number | '';
  kavlingIds: number[];
  fileSpk: File | null;
  existingFileSpk: string | null;
}

interface KavlingSpkAssignment {
  spkId: number;
  noSpk: string;
  mandorUsername: string;
}

interface KavlingPickerRow {
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  customerNama: string;
  disabled: boolean;
  handledBy?: KavlingSpkAssignment;
}

interface KavlingBlokGroup {
  blok: string;
  units: KavlingPickerRow[];
}

type BlokSelectionState = 'none' | 'partial' | 'all';

const getSelectableUnitIds = (units: KavlingPickerRow[]) =>
  units.filter((u) => !u.disabled).map((u) => u.kavlingId);

const getBlokSelectionState = (
  units: KavlingPickerRow[],
  selectedIds: number[],
): BlokSelectionState => {
  const selectable = getSelectableUnitIds(units);
  if (selectable.length === 0) return 'none';
  const selectedCount = selectable.filter((id) => selectedIds.includes(id)).length;
  if (selectedCount === 0) return 'none';
  if (selectedCount === selectable.length) return 'all';
  return 'partial';
};

interface BlokCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  onChange: () => void;
}

const BlokCheckbox = ({ checked, indeterminate, disabled, onChange }: BlokCheckboxProps) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="w-4 h-4 rounded border-gray-300 text-indigo-600 shrink-0 disabled:cursor-not-allowed"
    />
  );
};

const todayIso = () => new Date().toISOString().split('T')[0]!;

const compareKavlingBlokUnit = (
  a: { blok: string; nomorUnit: string },
  b: { blok: string; nomorUnit: string },
) => {
  const blokCmp = a.blok.localeCompare(b.blok, undefined, { numeric: true, sensitivity: 'base' });
  if (blokCmp !== 0) return blokCmp;
  return a.nomorUnit.localeCompare(b.nomorUnit, undefined, { numeric: true, sensitivity: 'base' });
};

const SPK_KAVLING_PREVIEW_MAX = 8;

const SpkKavlingCell = ({ items }: { items: SpkData['kavlingItems'] }) => {
  const sorted = useMemo(
    () => [...items].sort(compareKavlingBlokUnit),
    [items],
  );

  if (sorted.length === 0) {
    return <span className="text-xs text-slate-400">-</span>;
  }

  const preview = sorted.slice(0, SPK_KAVLING_PREVIEW_MAX);
  const hiddenCount = sorted.length - preview.length;
  const fullLabel = sorted.map((k) => `${k.blok}-${k.nomorUnit}`).join(', ');

  return (
    <div className="max-w-[200px]" title={fullLabel}>
      <div className="flex flex-wrap gap-0.5">
        {preview.map((k) => (
          <span
            key={k.kavlingId}
            className="inline-flex items-center px-1 py-px rounded bg-slate-100 text-[10px] font-semibold text-slate-600 leading-tight whitespace-nowrap"
          >
            {k.blok}-{k.nomorUnit}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="inline-flex items-center px-1 py-px rounded bg-slate-200/80 text-[10px] font-bold text-slate-500 leading-tight">
            +{hiddenCount}
          </span>
        )}
      </div>
    </div>
  );
};

const getCustomerNamaFromKavling = (kavling: KavlingData): string => {
  const activePenjualan = kavling.penjualan?.find((p) => p.customer?.nama);
  return activePenjualan?.customer?.nama ?? '-';
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileNameFromUrl = (url: string) => {
  try {
    const segment = url.split('/').pop() ?? url;
    return decodeURIComponent(segment.split('?')[0] ?? segment);
  } catch {
    return 'Dokumen SPK.pdf';
  }
};

const initialFormState = (): SpkFormState => ({
  noSpk: '',
  tanggalSpk: todayIso(),
  judulPekerjaan: '',
  nilaiKontrak: '',
  notesPekerjaan: '',
  jatuhTempo: '',
  mandorId: '',
  kavlingIds: [],
  fileSpk: null,
  existingFileSpk: null,
});

const SPK = () => {
  const { data: spkList = [], isLoading: loadingSpk } = useGetSpk();
  const { data: kavlingResponse, isLoading: loadingKavling } = useGetKavlings({ limit: 500 });
  const { data: mandorList = [] } = useGetMandors();
  const createMutation = useCreateSpk();
  const updateMutation = useUpdateSpk();
  const deleteMutation = useDeleteSpk();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SpkData | null>(null);
  const [formData, setFormData] = useState<SpkFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [expandedBloks, setExpandedBloks] = useState<Set<string>>(new Set());

  const kavlingSpkAssignmentMap = useMemo(() => {
    const map = new Map<number, KavlingSpkAssignment>();
    spkList.forEach((spk) => {
      spk.kavlingItems.forEach((item) => {
        map.set(item.kavlingId, {
          spkId: spk.id,
          noSpk: spk.noSpk,
          mandorUsername: spk.mandor.username,
        });
      });
    });
    return map;
  }, [spkList]);

  const kavlingPickerRows = useMemo(() => {
    if (!kavlingResponse?.items) return [];

    const rows: KavlingPickerRow[] = kavlingResponse.items.map((k) => {
      const assignment = kavlingSpkAssignmentMap.get(k.id);
      const isCurrentSpk =
        editingId !== null && assignment?.spkId === editingId;

      return {
        kavlingId: k.id,
        blok: k.blok,
        nomorUnit: k.nomorUnit,
        customerNama: getCustomerNamaFromKavling(k),
        disabled: !!assignment && !isCurrentSpk,
        handledBy: assignment && !isCurrentSpk ? assignment : undefined,
      };
    });

    return rows.sort(compareKavlingBlokUnit);
  }, [kavlingResponse, kavlingSpkAssignmentMap, editingId]);

  const kavlingBlokGroups = useMemo((): KavlingBlokGroup[] => {
    const groupMap = new Map<string, KavlingPickerRow[]>();
    kavlingPickerRows.forEach((row) => {
      const existing = groupMap.get(row.blok) ?? [];
      existing.push(row);
      groupMap.set(row.blok, existing);
    });

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(([blok, units]) => ({ blok, units }));
  }, [kavlingPickerRows]);

  useEffect(() => {
    if (isModalOpen && kavlingBlokGroups.length > 0) {
      setExpandedBloks(new Set(kavlingBlokGroups.map((g) => g.blok)));
    }
  }, [isModalOpen, kavlingBlokGroups]);

  useEffect(() => {
    if (!formData.fileSpk) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formData.fileSpk);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.fileSpk]);

  const columns = [
    { header: 'No. SPK', accessor: 'noSpk' },
    {
      header: 'Mandor',
      accessor: 'mandor',
      render: (val: SpkData['mandor']) => (
        <span className="text-slate-700 font-medium">{val?.username || '-'}</span>
      ),
    },
    {
      header: 'Kavling',
      accessor: 'kavlingItems',
      render: (items: SpkData['kavlingItems']) => <SpkKavlingCell items={items} />,
    },
    {
      header: 'Nilai Kontrak',
      accessor: 'nilaiKontrak',
      render: (val: number) => formatRupiah(val),
    },
    {
      header: 'Dokumen',
      accessor: 'fileSpk',
      render: (val: string | null) => val ? (
        <a
          href={val}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Lihat PDF
        </a>
      ) : (
        <span className="text-gray-400 text-xs">-</span>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState());
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: SpkData) => {
    setEditingId(item.id);
    setFormData({
      noSpk: item.noSpk,
      tanggalSpk: item.tanggalSpk.split('T')[0]!,
      judulPekerjaan: item.judulPekerjaan,
      nilaiKontrak: item.nilaiKontrak,
      notesPekerjaan: item.notesPekerjaan || '',
      jatuhTempo: item.jatuhTempo ? item.jatuhTempo.split('T')[0]! : '',
      mandorId: item.mandorId,
      kavlingIds: item.kavlingItems.map((p) => p.kavlingId),
      fileSpk: null,
      existingFileSpk: item.fileSpk,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openDetail = (item: SpkData) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState());
    setEditingId(null);
  };

  const updateKavlingIds = (updater: (ids: number[]) => number[]) => {
    setFormData((prev) => ({ ...prev, kavlingIds: updater(prev.kavlingIds) }));
    if (errors.kavlingIds) {
      setErrors((prev) => ({ ...prev, kavlingIds: undefined }));
    }
  };

  const toggleKavling = (kavlingId: number, disabled: boolean) => {
    if (disabled) return;
    updateKavlingIds((ids) =>
      ids.includes(kavlingId) ? ids.filter((id) => id !== kavlingId) : [...ids, kavlingId],
    );
  };

  const toggleBlok = (units: KavlingPickerRow[]) => {
    const selectableIds = getSelectableUnitIds(units);
    if (selectableIds.length === 0) return;

    updateKavlingIds((ids) => {
      const allSelected = selectableIds.every((id) => ids.includes(id));
      if (allSelected) {
        return ids.filter((id) => !selectableIds.includes(id));
      }
      return Array.from(new Set([...ids, ...selectableIds]));
    });
  };

  const toggleBlokExpanded = (blok: string) => {
    setExpandedBloks((prev) => {
      const next = new Set(prev);
      if (next.has(blok)) next.delete(blok);
      else next.add(blok);
      return next;
    });
  };

  const clearUploadedFile = () => {
    setFormData((prev) => ({ ...prev, fileSpk: null, existingFileSpk: null }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === 'number'
        ? value === ''
          ? ''
          : Number(value)
        : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!formData.noSpk.trim()) newErrors.noSpk = 'Nomor SPK wajib diisi';
    if (!formData.judulPekerjaan.trim()) newErrors.judulPekerjaan = 'Judul pekerjaan wajib diisi';
    if (formData.nilaiKontrak === '' || Number(formData.nilaiKontrak) <= 0) {
      newErrors.nilaiKontrak = 'Nilai kontrak harus lebih dari 0';
    }
    if (!formData.mandorId) newErrors.mandorId = 'Mandor wajib dipilih';
    if (formData.kavlingIds.length === 0) {
      newErrors.kavlingIds = 'Pilih minimal satu kavling';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      noSpk: formData.noSpk.trim(),
      tanggalSpk: formData.tanggalSpk,
      judulPekerjaan: formData.judulPekerjaan.trim(),
      nilaiKontrak: Number(formData.nilaiKontrak),
      notesPekerjaan: formData.notesPekerjaan.trim() || undefined,
      jatuhTempo: formData.jatuhTempo || undefined,
      mandorId: Number(formData.mandorId),
      kavlingIds: formData.kavlingIds,
      fileSpk: formData.fileSpk,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleDelete = async (item: SpkData) => {
    if (!window.confirm(`Hapus data SPK ${item.noSpk}? Mandor pada kavling terkait akan dilepas.`)) return;
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasUploadedFile = !!formData.fileSpk || !!formData.existingFileSpk;

  if (loadingSpk || loadingKavling) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Surat Perintah Kerja (SPK)"
        columns={columns}
        data={spkList}
        onAdd={openCreateModal}
        onEdit={openEditModal}
        onDetail={openDetail}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailItem(null); }}
        title="Detail SPK"
        size="lg"
      >
        {detailItem && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">No. SPK</p>
                <p className="font-bold text-slate-900">{detailItem.noSpk}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal SPK</p>
                <p className="font-medium">{formatDate(detailItem.tanggalSpk)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Judul Pekerjaan</p>
                <p className="font-medium text-slate-800">{detailItem.judulPekerjaan}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Mandor</p>
                <p className="font-medium">{detailItem.mandor.username}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Nilai Kontrak</p>
                <p className="font-bold">{formatRupiah(detailItem.nilaiKontrak)}</p>
              </div>
              {detailItem.jatuhTempo && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Jatuh Tempo</p>
                  <p className="font-medium">{formatDate(detailItem.jatuhTempo)}</p>
                </div>
              )}
              {detailItem.notesPekerjaan && (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Catatan Pekerjaan</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{detailItem.notesPekerjaan}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Kavling dalam SPK</p>
              <ul className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {[...detailItem.kavlingItems]
                  .sort((a, b) => compareKavlingBlokUnit(a, b))
                  .map((item) => (
                    <li key={item.id} className="px-4 py-2.5 text-sm flex justify-between gap-4">
                      <span className="font-bold text-slate-800">
                        Blok {item.blok}-{item.nomorUnit}
                      </span>
                      <span className="text-slate-500 shrink-0">{item.customerNama}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {detailItem.fileSpk && (
              <a
                href={detailItem.fileSpk}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
              >
                <FileText size={16} />
                Buka dokumen SPK (PDF)
              </a>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit SPK' : 'Buat SPK Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi SPK</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nomor SPK" name="noSpk" value={formData.noSpk} onChange={handleChange} error={errors.noSpk} />
              <Input label="Tanggal SPK" type="date" name="tanggalSpk" value={formData.tanggalSpk} onChange={handleChange} />
              <div className="md:col-span-2">
                <Input label="Judul Pekerjaan" name="judulPekerjaan" value={formData.judulPekerjaan} onChange={handleChange} error={errors.judulPekerjaan} />
              </div>
              <Input
                label="Nilai Kontrak (Rp)"
                type="number"
                step="any"
                name="nilaiKontrak"
                value={formData.nilaiKontrak === '' ? '' : formData.nilaiKontrak}
                onChange={handleChange}
                error={errors.nilaiKontrak}
              />
              <Input label="Jatuh Tempo (opsional)" type="date" name="jatuhTempo" value={formData.jatuhTempo} onChange={handleChange} />
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Catatan Pekerjaan (opsional)
                </label>
                <textarea
                  name="notesPekerjaan"
                  value={formData.notesPekerjaan}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm min-h-[80px] text-black"
                  placeholder="Catatan tambahan pekerjaan..."
                />
              </div>
              <Select
                label="Mandor"
                name="mandorId"
                value={formData.mandorId !== '' ? String(formData.mandorId) : ''}
                onChange={handleChange}
                error={errors.mandorId}
                options={[
                  { value: '', label: '-- Pilih Mandor --' },
                  ...mandorList.map((m) => ({
                    value: String(m.id),
                    label: m.username,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-2">Kavling Proyek</h4>
            <p className="text-xs text-slate-500 mb-3">
              Centang blok untuk memilih semua unit di blok tersebut, atau buka blok dan pilih unit tertentu saja.
              Mandor pada SPK ini akan mengurus semua kavling yang dipilih.
            </p>
            {errors.kavlingIds && (
              <p className="text-xs text-red-600 mb-2">{errors.kavlingIds}</p>
            )}
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
              {kavlingBlokGroups.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 italic text-center">
                  Belum ada data kavling.
                </p>
              ) : (
                kavlingBlokGroups.map((group) => {
                  const blokState = getBlokSelectionState(group.units, formData.kavlingIds);
                  const selectableIds = getSelectableUnitIds(group.units);
                  const selectedInBlok = selectableIds.filter((id) =>
                    formData.kavlingIds.includes(id),
                  ).length;
                  const isExpanded = expandedBloks.has(group.blok);
                  const blokCheckboxDisabled = selectableIds.length === 0;

                  return (
                    <div key={group.blok}>
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/90 border-b border-slate-100">
                        <BlokCheckbox
                          checked={blokState === 'all'}
                          indeterminate={blokState === 'partial'}
                          disabled={blokCheckboxDisabled}
                          onChange={() => toggleBlok(group.units)}
                        />
                        <button
                          type="button"
                          onClick={() => toggleBlokExpanded(group.blok)}
                          className="p-0.5 rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 shrink-0"
                          aria-expanded={isExpanded}
                          title={isExpanded ? 'Tutup daftar unit' : 'Buka daftar unit'}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBlokExpanded(group.blok)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <span className="text-sm font-bold text-slate-800">Blok {group.blok}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {selectedInBlok}/{selectableIds.length} unit dipilih
                            {group.units.length > selectableIds.length && (
                              <span className="text-amber-600">
                                {' '}· {group.units.length - selectableIds.length} tidak tersedia
                              </span>
                            )}
                          </span>
                        </button>
                      </div>

                      {isExpanded &&
                        group.units.map((k) => (
                          <label
                            key={k.kavlingId}
                            className={`flex items-start gap-3 pl-9 pr-4 py-2 transition-colors ${
                              k.disabled
                                ? 'bg-slate-50/80 cursor-not-allowed opacity-80'
                                : 'hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.kavlingIds.includes(k.kavlingId)}
                              disabled={k.disabled}
                              onChange={() => toggleKavling(k.kavlingId, k.disabled)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 shrink-0 mt-0.5 disabled:cursor-not-allowed"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-bold min-w-[72px] ${
                                    k.disabled ? 'text-slate-500' : 'text-slate-800'
                                  }`}
                                >
                                  Unit {k.nomorUnit}
                                </span>
                                <span
                                  className="text-xs text-slate-500 truncate max-w-[140px] ml-auto sm:ml-0"
                                  title={k.customerNama}
                                >
                                  {k.customerNama}
                                </span>
                              </div>
                              {k.handledBy && (
                                <p className="text-[11px] text-amber-700 font-medium mt-1 leading-snug">
                                  Sudah ditangani mandor {k.handledBy.mandorUsername} (SPK {k.handledBy.noSpk})
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Dokumen</h4>
            <FileInput
              label="Upload SPK (PDF, opsional)"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setFormData((prev) => ({
                  ...prev,
                  fileSpk: file,
                  existingFileSpk: file ? null : prev.existingFileSpk,
                }));
                e.target.value = '';
              }}
            />

            {hasUploadedFile && (
              <div className="mt-3 flex items-start gap-3 p-3 bg-white border border-red-100 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <FileText size={22} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {formData.fileSpk?.name ?? getFileNameFromUrl(formData.existingFileSpk!)}
                  </p>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-0.5">
                    PDF
                    {formData.fileSpk && (
                      <span className="text-slate-400 normal-case tracking-normal font-medium ml-2">
                        {formatFileSize(formData.fileSpk.size)}
                      </span>
                    )}
                  </p>
                  {formData.existingFileSpk && !formData.fileSpk && (
                    <a
                      href={formData.existingFileSpk}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 font-bold mt-1 hover:underline"
                    >
                      <ExternalLink size={12} />
                      Pratinjau dokumen tersimpan
                    </a>
                  )}
                  {filePreviewUrl && formData.fileSpk && (
                    <p className="text-xs text-slate-500 mt-1">File siap diunggah saat simpan</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearUploadedFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  title="Hapus file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan SPK'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SPK;
