import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../shared/Modal';
import Select from '../shared/Select';
import FileInput from '../shared/FileInput';
import CollapsibleDetailSection from '../shared/CollapsibleDetailSection';
import CurrencyInput from '../shared/CurrencyInput';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../shared/BuktiFileThumbnail';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { handleApiError } from '../../utils/errorHandler';
import { useQueryClient } from '@tanstack/react-query';
import {
  clearKasbonDraftCache,
  useCreateSpkPembayaranRequest,
  useDeleteSpkPengurangan,
  useGetKasbonDraft,
  useGetSpkPembayaranBySpk,
  useSaveKasbonDraft,
  useSubmitKasbonDraft,
  useUpdateSpkKasbon,
  useUpdateSpkUpah,
} from '../../hooks/queries/useSpkPembayaran';
import { useGetTukangList } from '../../hooks/queries/useTukang';
import type {
  CreateSpkPembayaranBody,
  SpkPembayaranData,
  SpkPembayaranKasbonBarisBody,
  SpkPembayaranUpahBarisBody,
} from '../../services/spkPembayaran.service';
import { spkPembayaranService } from '../../services/spkPembayaran.service';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useGetProfile } from '../../hooks/queries/useProfile';
import { useGetMandorRekening } from '../../hooks/queries/useProgressProyek';
import type { SpkData } from '../../services/spk.service';
import {
  buildSpkKasbonTargetLabel,
  buildSpkPembayaranJenisLabel,
  calcSpkPembayaranNominal,
  canRequestKasbon,
  canRequestSpkPembayaran,
  formatPengurangMengurangiLabel,
  getJenisUiColor,
  getKasbonTargetSteps,
  getPengurangRowWaterfallSplit,
  getPengurangTerminCapacity,
  getSpkTerminJenisOrder,
  getSpkTerminScheme,
  getTerminPaymentStatus,
  validatePengurangTerminNominal,
  canSpillPengurangToNextTermin,
  resolveSpkTerminScheme,
  type SpkKasbonTargetTermin,
  type SpkPembayaranJenis,
  type SpkPengurangTerminRow,
  type SpkTerminPembayaranJenis,
  type SpkTerminSchemeKey,
} from '../../utils/spkPembayaran';
import { buildSpkPembayaranKalkulasi } from '../../utils/spkPembayaranKalkulasi';
import { isValidNik, normalizeNikInput } from '../../utils/nik';
import {
  formatMandorRekeningLabel,
  pickDefaultMandorRekeningId,
  type MandorRekeningData,
} from '../../utils/mandorRekening';
import {
  groupKasbonBarisForDisplay,
  kasbonSupplierDisplayName,
  kasbonTanggalPoSummary,
  KASBON_NAMA_SUPPLIER_DEFAULT,
  normalizeMaterialNamaSupplier,
  toKasbonDateIso,
} from '../../utils/kasbonBarisDisplay';
import { ocrService } from '../../services/ocr.service';

const JENIS_UI_COLOR = {
  KASBON: {
    badge: 'bg-orange-100 text-orange-900 border-orange-200',
    row: 'bg-orange-50/60',
    text: 'text-orange-800',
  },
  UPAH: {
    badge: 'bg-teal-100 text-teal-900 border-teal-200',
    row: 'bg-teal-50/60',
    text: 'text-teal-800',
  },
} as const;

const todayIso = () => new Date().toISOString().split('T')[0]!;

const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const uploadPengajuanPdf = async (file: File): Promise<string> => {
  if (!isPdfFile(file)) {
    throw new Error('Dokumen harus berformat PDF.');
  }
  return spkPembayaranService.uploadDokumenPengajuan(file);
};

const toDateInputValue = (dateStr: string | null | undefined) => {
  const iso = toKasbonDateIso(dateStr);
  return iso || todayIso();
};

interface UpahBarisForm {
  key: string;
  tukangId: number | '';
  nik: string;
  nama: string;
}

const newUpahBaris = (): UpahBarisForm => ({
  key: `${Date.now()}-${Math.random()}`,
  tukangId: '',
  nik: '',
  nama: '',
});

type ParseUpahBarisResult =
  | { ok: true; data: SpkPembayaranUpahBarisBody[] }
  | { ok: false; message: string };

const parseUpahBarisBody = (rows: UpahBarisForm[]): ParseUpahBarisResult => {
  const parsed: SpkPembayaranUpahBarisBody[] = [];
  for (const row of rows) {
    const nik = normalizeNikInput(row.nik);
    const nama = row.nama.trim();
    if (!nama) return { ok: false, message: 'Nama tukang wajib diisi.' };
    if (!nik) return { ok: false, message: 'NIK tukang wajib diisi.' };
    parsed.push({
      tukangId: row.tukangId === '' ? null : row.tukangId,
      nik,
      nama,
    });
  }
  if (!parsed.length) {
    return { ok: false, message: 'Minimal satu baris tukang wajib diisi.' };
  }
  return { ok: true, data: parsed };
};

const upahBarisFromPembayaran = (row: SpkPembayaranData): UpahBarisForm[] =>
  (row.upahBaris ?? []).map((b) => ({
    key: `baris-${b.id}`,
    tukangId: b.tukangId ?? '',
    nik: b.nik,
    nama: b.nama,
  }));

interface MaterialItemForm {
  key: string;
  keterangan: string;
  nominal: number | '';
}

interface MaterialBonForm {
  key: string;
  tanggal: string;
  items: MaterialItemForm[];
  fotoBonFile: File | null;
  fotoBonUrl: string | null;
  fotoBonPreview: string | null;
}

interface MaterialSupplierForm {
  key: string;
  namaSupplier: string;
  bons: MaterialBonForm[];
}

const newMaterialItem = (): MaterialItemForm => ({
  key: `${Date.now()}-${Math.random()}`,
  keterangan: '',
  nominal: '',
});

const newMaterialBon = (): MaterialBonForm => ({
  key: `${Date.now()}-${Math.random()}`,
  tanggal: todayIso(),
  items: [newMaterialItem()],
  fotoBonFile: null,
  fotoBonUrl: null,
  fotoBonPreview: null,
});

const newMaterialSupplier = (): MaterialSupplierForm => ({
  key: `${Date.now()}-${Math.random()}`,
  namaSupplier: '',
  bons: [newMaterialBon()],
});

interface LegacyKasbonRowForm {
  key: string;
  keterangan: string;
  nominal: number | '';
  tanggalPo: string;
}

const newLegacyKasbonRow = (): LegacyKasbonRowForm => ({
  key: `${Date.now()}-${Math.random()}`,
  keterangan: '',
  nominal: '',
  tanggalPo: todayIso(),
});

const LEGACY_KASBON_KETERANGAN_SUGGESTIONS = [
  'Material mandor',
  'Material kantor',
  'Tenaga',
];

const bonHasFoto = (bon: MaterialBonForm) =>
  !!bon.fotoBonFile || !!bon.fotoBonUrl?.trim();

const revokeBonPreview = (bon: MaterialBonForm) => {
  if (bon.fotoBonPreview?.startsWith('blob:')) {
    URL.revokeObjectURL(bon.fotoBonPreview);
  }
};

const bonHasContent = (bon: MaterialBonForm) =>
  bonHasFoto(bon) ||
  bon.items.some((i) => i.keterangan.trim() !== '' || i.nominal !== '');

const bonMaterialTotal = (bon: MaterialBonForm) =>
  bon.items.reduce(
    (sum, item) => sum + (item.nominal === '' ? 0 : Number(item.nominal)),
    0,
  );

const supplierMaterialTotal = (supplier: MaterialSupplierForm) =>
  supplier.bons.reduce((sum, bon) => sum + bonMaterialTotal(bon), 0);

const supplierIsUsed = (supplier: MaterialSupplierForm) =>
  supplier.namaSupplier.trim() !== '' || supplier.bons.some(bonHasContent);

const allMaterialTotal = (suppliers: MaterialSupplierForm[]) =>
  suppliers.reduce((sum, s) => sum + supplierMaterialTotal(s), 0);

const isBatchKasbon = (row: SpkPembayaranData) => (row.kasbonBaris?.length ?? 0) > 0;

const flattenMaterialSuppliers = (
  suppliers: MaterialSupplierForm[],
): SpkPembayaranKasbonBarisBody[] | null => {
  const parsed: SpkPembayaranKasbonBarisBody[] = [];
  for (const supplier of suppliers) {
    const namaSupplier = normalizeMaterialNamaSupplier(supplier.namaSupplier);
    for (const bon of supplier.bons) {
      if (!bonHasContent(bon)) continue;
      if (!bon.tanggal) return null;
      const fotoBon = bon.fotoBonUrl?.trim() || null;
      let hasItem = false;
      for (const item of bon.items) {
        const keterangan = item.keterangan.trim();
        const nominal = item.nominal === '' ? 0 : Number(item.nominal);
        if (!keterangan || !nominal || nominal <= 0) return null;
        hasItem = true;
        parsed.push({
          namaSupplier,
          keterangan,
          tanggalPo: bon.tanggal,
          nominal,
          fotoBon,
        });
      }
      if (!hasItem) return null;
    }
  }
  return parsed.length ? parsed : null;
};

const uploadMaterialSupplierFotos = async (
  suppliers: MaterialSupplierForm[],
): Promise<MaterialSupplierForm[]> =>
  Promise.all(
    suppliers.map(async (supplier) => ({
      ...supplier,
      bons: await Promise.all(
        supplier.bons.map(async (bon) => {
          if (!bon.fotoBonFile) return bon;
          const url = await spkPembayaranService.uploadFotoBon(bon.fotoBonFile);
          revokeBonPreview(bon);
          return {
            ...bon,
            fotoBonFile: null,
            fotoBonUrl: url,
            fotoBonPreview: url,
          };
        }),
      ),
    })),
  );

const kasbonBarisToSuppliers = (
  baris: SpkPembayaranData['kasbonBaris'],
): MaterialSupplierForm[] => {
  if (!baris?.length) return [newMaterialSupplier()];
  const supplierMap = new Map<string, MaterialSupplierForm>();
  for (const b of baris) {
    const nama = normalizeMaterialNamaSupplier(b.namaSupplier || '');
    let supplier = supplierMap.get(nama);
    if (!supplier) {
      supplier = {
        key: `supplier-${nama}-${supplierMap.size}`,
        namaSupplier: nama,
        bons: [],
      };
      supplierMap.set(nama, supplier);
    }
    const tanggal = toDateInputValue(b.tanggalPo);
    const foto = b.fotoBon ?? '';
    const bonLookup = `${tanggal}\0${foto}`;
    let bon = supplier.bons.find(
      (x) => `${x.tanggal}\0${x.fotoBonUrl ?? ''}` === bonLookup,
    );
    if (!bon) {
      bon = {
        key: `bon-${bonLookup}-${supplier.bons.length}`,
        tanggal,
        items: [],
        fotoBonFile: null,
        fotoBonUrl: b.fotoBon ?? null,
        fotoBonPreview: b.fotoBon ?? null,
      };
      supplier.bons.push(bon);
    }
    bon.items.push({
      key: `kasbon-${b.id}`,
      keterangan: b.keterangan,
      nominal: b.nominal,
    });
  }
  const groups = Array.from(supplierMap.values());
  return groups.length ? groups : [newMaterialSupplier()];
};

const KasbonBatchDetailView = ({
  baris,
}: {
  baris: NonNullable<SpkPembayaranData['kasbonBaris']>;
}) => {
  const groups = useMemo(() => groupKasbonBarisForDisplay(baris), [baris]);
  const totalBons = groups.reduce((sum, g) => sum + g.bons.length, 0);

  return (
    <div className="space-y-2 min-w-[220px]">
      <p className="text-[9px] font-medium text-slate-500">
        {groups.length} supplier · {totalBons} bon · {baris.length} item
      </p>
      {groups.map((supplier) => (
        <div
          key={supplier.namaSupplier}
          className="rounded-lg border border-orange-100 bg-white overflow-hidden shadow-sm"
        >
          <div className="flex items-start justify-between gap-2 px-2.5 py-1.5 bg-orange-50 border-b border-orange-100">
            <span className="text-[11px] font-bold text-slate-900 leading-snug">
              {kasbonSupplierDisplayName(supplier.namaSupplier)}
            </span>
            <span className="text-[10px] font-bold text-orange-800 tabular-nums shrink-0">
              {formatRupiah(supplier.total)}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {supplier.bons.map((bon) => (
              <div
                key={`${supplier.namaSupplier}-${bon.tanggalIso}-${bon.fotoBon ?? 'no-foto'}`}
                className="px-2.5 py-2"
              >
                <div className="flex gap-2.5 items-start">
                  {bon.fotoBon ? (
                    <a
                      href={bon.fotoBon}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Lihat foto bon"
                      className="shrink-0"
                    >
                      <img
                        src={bon.fotoBon}
                        alt=""
                        className="h-11 w-11 rounded-md object-cover border border-slate-200 hover:ring-2 hover:ring-orange-200 transition-shadow"
                      />
                    </a>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold text-slate-500 mb-1">
                      {bon.items.length > 1 ? (
                        <span className="text-slate-400 font-medium">
                           {bon.items.length} item
                        </span>
                      ) : null}
                    </p>
                    <ul className="space-y-1">
                      {bon.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex justify-between gap-2 text-[10px] leading-snug"
                        >
                          <span className="text-slate-800 font-medium">{item.keterangan}</span>
                          <span className="font-bold text-orange-800 tabular-nums shrink-0">
                            {formatRupiah(item.nominal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {bon.items.length > 1 && (
                      <p className="text-[9px] text-slate-500 mt-1 text-right tabular-nums">
                        Subtotal bon {formatRupiah(bon.subtotal)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const thClass =
  'px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase bg-slate-50 border border-slate-200 whitespace-nowrap';
const tdClass = 'px-2.5 py-1.5 border border-slate-200 text-xs text-slate-800 align-middle';

const toCalcRows = (list: SpkPembayaranData[]) =>
  list
    .filter((p) => p.status !== 'DRAFT')
    .map((p) => ({
      id: p.id,
      jenis: p.jenis,
      status: p.status,
      nominal: p.nominal,
      mengurangiTermin: p.mengurangiTermin,
    }));

const KalkulasiSingkat = ({
  jenis,
  spk,
  pembayaranList,
}: {
  jenis: SpkTerminPembayaranJenis;
  spk: SpkData;
  pembayaranList: SpkPembayaranData[];
}) => {
  const baris = buildSpkPembayaranKalkulasi(
    jenis,
    { nilaiKontrak: spk.nilaiKontrak },
    toCalcRows(pembayaranList),
    resolveSpkTerminScheme(spk),
  );

  return (
    <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5 text-[9px] text-slate-500 leading-tight min-w-[160px]">
      {baris.map((b) => (
        <div key={b.label} className="flex justify-between gap-2">
          <span className="text-left">{b.label}</span>
          <span
            className={`shrink-0 font-semibold tabular-nums ${
              b.tipe === 'negatif'
                ? 'text-red-600'
                : b.tipe === 'hasil'
                  ? 'text-blue-600'
                  : 'text-slate-600'
            }`}
          >
            {b.tipe === 'negatif' ? '− ' : ''}
            {formatRupiah(b.nilai)}
          </span>
        </div>
      ))}
    </div>
  );
};

const materialBonHasFilledItems = (bon: MaterialBonForm) =>
  bon.items.some((i) => i.keterangan.trim() !== '' || i.nominal !== '');

const applyKasbonBonOcr = (
  supplier: MaterialSupplierForm,
  bonKey: string,
  extracted: Awaited<ReturnType<typeof ocrService.extractKasbonBon>>,
): MaterialSupplierForm => ({
  ...supplier,
  namaSupplier:
    extracted.namaSupplier?.trim() ||
    supplier.namaSupplier.trim() ||
    KASBON_NAMA_SUPPLIER_DEFAULT,
  bons: supplier.bons.map((bon) => {
    if (bon.key !== bonKey) return bon;
    const items =
      extracted.items.length > 0
        ? extracted.items.map((row) => ({
            key: `${Date.now()}-${Math.random()}`,
            keterangan: row.keterangan,
            nominal: row.nominal,
          }))
        : bon.items;
    return {
      ...bon,
      tanggal: extracted.tanggal ?? bon.tanggal,
      items,
    };
  }),
});

const LegacyKasbonCreateEditor = ({
  rows,
  setRows,
  idPrefix,
}: {
  rows: LegacyKasbonRowForm[];
  setRows: React.Dispatch<React.SetStateAction<LegacyKasbonRowForm[]>>;
  idPrefix: string;
}) => (
  <div className="space-y-3">
    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
      Mode sementara untuk sinkronisasi data kasbon manual. Cukup isi{' '}
      <strong>keterangan</strong> dan <strong>nominal</strong> — tanpa foto bon. Setiap baris
      menjadi satu pengajuan kasbon terpisah.
    </p>
    <div className="flex flex-wrap gap-1.5">
      {LEGACY_KASBON_KETERANGAN_SUGGESTIONS.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() =>
            setRows((prev) => [...prev, { ...newLegacyKasbonRow(), keterangan: label }])
          }
          className="px-2.5 py-1 text-[10px] font-bold rounded-full border border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
        >
          + {label}
        </button>
      ))}
    </div>
    <div className="overflow-x-auto rounded-lg border border-amber-200">
      <table className="w-full text-xs border-collapse min-w-[520px]">
        <thead>
          <tr>
            <th className={thClass}>Keterangan</th>
            <th className={thClass}>Tanggal</th>
            <th className={thClass}>Nominal</th>
            <th className={`${thClass} w-10`} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className={tdClass}>
                <input
                  type="text"
                  value={row.keterangan}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.key === row.key ? { ...r, keterangan: e.target.value } : r,
                      ),
                    )
                  }
                  className="w-full min-w-[160px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                  placeholder="Contoh: Material mandor"
                />
              </td>
              <td className={tdClass}>
                <input
                  type="date"
                  value={row.tanggalPo}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.key === row.key ? { ...r, tanggalPo: e.target.value } : r,
                      ),
                    )
                  }
                  className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                />
              </td>
              <td className={tdClass}>
                <CurrencyInput
                  name={`${idPrefix}-legacy-${row.key}`}
                  value={row.nominal === '' ? 0 : row.nominal}
                  onValueChange={(_, value) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.key === row.key ? { ...r, nominal: value > 0 ? value : '' } : r,
                      ),
                    )
                  }
                  placeholder="0"
                  compact
                />
              </td>
              <td className={tdClass}>
                <button
                  type="button"
                  disabled={rows.length <= 1}
                  onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                  title="Hapus baris"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button
      type="button"
      onClick={() => setRows((prev) => [...prev, newLegacyKasbonRow()])}
      className="text-xs font-bold text-amber-700 hover:underline"
    >
      + Tambah baris
    </button>
    <p className="text-sm font-bold text-amber-800">
      Total:{' '}
      {formatRupiah(
        rows.reduce((sum, r) => sum + (r.nominal === '' ? 0 : Number(r.nominal)), 0),
      )}
    </p>
  </div>
);

const MaterialSuppliersEditor = ({
  suppliers,
  setSuppliers,
  idPrefix,
}: {
  suppliers: MaterialSupplierForm[];
  setSuppliers: React.Dispatch<React.SetStateAction<MaterialSupplierForm[]>>;
  idPrefix: string;
}) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [ocrLoadingKey, setOcrLoadingKey] = useState<string | null>(null);

  const openBonPhotoPicker = (supplierKey: string, bonKey: string, replace: boolean) => {
    const supplier = suppliers.find((s) => s.key === supplierKey);
    const bon = supplier?.bons.find((b) => b.key === bonKey);
    if (!bon) return;
    if (
      replace &&
      (bonHasFoto(bon) || materialBonHasFilledItems(bon)) &&
      !window.confirm(
        'Foto dan isian bon ini akan diganti. Bon lain pada supplier yang sama tidak berubah.\n\nLanjutkan?',
      )
    ) {
      return;
    }
    fileInputRefs.current[bonKey]?.click();
  };

  const attachFotoBon = (supplierKey: string, bonKey: string, file: File) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.key !== supplierKey) return s;
        return {
          ...s,
          bons: s.bons.map((b) => {
            if (b.key !== bonKey) return b;
            revokeBonPreview(b);
            return {
              ...b,
              fotoBonFile: file,
              fotoBonUrl: null,
              fotoBonPreview: URL.createObjectURL(file),
            };
          }),
        };
      }),
    );
  };

  const handleBonPhoto = async (supplierKey: string, bonKey: string, file: File) => {
    setOcrLoadingKey(bonKey);
    try {
      const extracted = await ocrService.extractKasbonBon(file);
      if (!extracted.tanggal && extracted.items.length === 0) {
        alert(
          'Bon tidak terbaca dengan jelas. Pastikan foto fokus, tidak blur, dan semua baris terlihat.',
        );
        attachFotoBon(supplierKey, bonKey, file);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const nextSuppliers = suppliers.map((s) => {
        if (s.key !== supplierKey) return s;
        const withFoto = {
          ...s,
          bons: s.bons.map((b) => {
            if (b.key !== bonKey) return b;
            revokeBonPreview(b);
            return {
              ...b,
              fotoBonFile: file,
              fotoBonUrl: null,
              fotoBonPreview: previewUrl,
            };
          }),
        };
        return applyKasbonBonOcr(withFoto, bonKey, extracted);
      });

      setSuppliers(nextSuppliers);
    } catch (err) {
      alert(handleApiError(err).message);
    } finally {
      setOcrLoadingKey(null);
      const input = fileInputRefs.current[bonKey];
      if (input) input.value = '';
    }
  };

  const removeSupplier = (supplier: MaterialSupplierForm) => {
    supplier.bons.forEach(revokeBonPreview);
    setSuppliers((prev) => prev.filter((s) => s.key !== supplier.key));
  };

  const removeBon = (supplierKey: string, bon: MaterialBonForm) => {
    revokeBonPreview(bon);
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.key !== supplierKey) return s;
        const nextBons = s.bons.filter((b) => b.key !== bon.key);
        return { ...s, bons: nextBons.length ? nextBons : [newMaterialBon()] };
      }),
    );
  };

  return (
  <div className="space-y-4">
    {suppliers.map((supplier, supplierIndex) => (
      <div
        key={supplier.key}
        className="rounded-xl border border-orange-200 bg-orange-50/30 p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wide">
            Supplier {supplierIndex + 1}
          </p>
          <button
            type="button"
            disabled={suppliers.length <= 1}
            onClick={() => removeSupplier(supplier)}
            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 shrink-0"
            title="Hapus supplier"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Nama supplier</label>
          <input
            type="text"
            value={supplier.namaSupplier}
            onChange={(e) =>
              setSuppliers((prev) =>
                prev.map((s) =>
                  s.key === supplier.key ? { ...s, namaSupplier: e.target.value } : s,
                ),
              )
            }
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
            placeholder="Nama toko / supplier (kosong = -)"
          />
        </div>

        {supplier.bons.map((bon, bonIndex) => (
          <div
            key={bon.key}
            className="rounded-lg border border-orange-200/80 bg-white p-3 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-orange-700 uppercase">Bon {bonIndex + 1}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  ref={(el) => {
                    fileInputRefs.current[bon.key] = el;
                  }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  id={`${idPrefix}-bon-ocr-${bon.key}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleBonPhoto(supplier.key, bon.key, file);
                  }}
                />
                {!bonHasFoto(bon) ? (
                  <button
                    type="button"
                    disabled={ocrLoadingKey === bon.key}
                    onClick={() => openBonPhotoPicker(supplier.key, bon.key, false)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-orange-300 bg-orange-50 text-[10px] font-bold text-orange-800 hover:bg-orange-100 disabled:opacity-50"
                    title="Ambil foto bon — isi otomatis via OCR"
                  >
                    {ocrLoadingKey === bon.key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                    Foto bon (opsional)
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={ocrLoadingKey === bon.key}
                    onClick={() => openBonPhotoPicker(supplier.key, bon.key, true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-300 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    title="Ganti foto bon ini"
                  >
                    {ocrLoadingKey === bon.key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                    Ganti bon
                  </button>
                )}
                {supplier.bons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBon(supplier.key, bon)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Hapus bon"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {(bon.fotoBonPreview || bon.fotoBonUrl) && (
              <div className="flex items-center gap-3 p-2 rounded-lg border border-green-200 bg-green-50/50">
                <a
                  href={bon.fotoBonPreview ?? bon.fotoBonUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <img
                    src={bon.fotoBonPreview ?? bon.fotoBonUrl!}
                    alt={`Preview bon ${bonIndex + 1}`}
                    className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                  />
                </a>
                <p className="text-[10px] font-semibold text-green-800 leading-snug">
                  Preview foto bon {bonIndex + 1}
                  <span className="block font-normal text-green-700">
                    Klik gambar untuk perbesar
                  </span>
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</label>
              <input
                type="date"
                value={bon.tanggal}
                onChange={(e) =>
                  setSuppliers((prev) =>
                    prev.map((s) =>
                      s.key !== supplier.key
                        ? s
                        : {
                            ...s,
                            bons: s.bons.map((b) =>
                              b.key === bon.key ? { ...b, tanggal: e.target.value } : b,
                            ),
                          },
                    ),
                  )
                }
                className="mt-1 w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs border-collapse min-w-[480px]">
                <thead>
                  <tr>
                    <th className={thClass}>Keterangan</th>
                    <th className={thClass}>Nominal</th>
                    <th className={`${thClass} w-10`} />
                  </tr>
                </thead>
                <tbody>
                  {bon.items.map((item) => (
                    <tr key={item.key}>
                      <td className={tdClass}>
                        <input
                          type="text"
                          value={item.keterangan}
                          onChange={(e) =>
                            setSuppliers((prev) =>
                              prev.map((s) =>
                                s.key !== supplier.key
                                  ? s
                                  : {
                                      ...s,
                                      bons: s.bons.map((b) =>
                                        b.key !== bon.key
                                          ? b
                                          : {
                                              ...b,
                                              items: b.items.map((i) =>
                                                i.key === item.key
                                                  ? { ...i, keterangan: e.target.value }
                                                  : i,
                                              ),
                                            },
                                      ),
                                    },
                              ),
                            )
                          }
                          className="w-full min-w-[160px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                          placeholder="Contoh: Semen 50 sak"
                        />
                      </td>
                      <td className={tdClass}>
                        <CurrencyInput
                          compact
                          name={`${idPrefix}-nominal-${item.key}`}
                          value={item.nominal === '' ? 0 : item.nominal}
                          onValueChange={(_, value) =>
                            setSuppliers((prev) =>
                              prev.map((s) =>
                                s.key !== supplier.key
                                  ? s
                                  : {
                                      ...s,
                                      bons: s.bons.map((b) =>
                                        b.key !== bon.key
                                          ? b
                                          : {
                                              ...b,
                                              items: b.items.map((i) =>
                                                i.key === item.key
                                                  ? { ...i, nominal: value > 0 ? value : '' }
                                                  : i,
                                              ),
                                            },
                                      ),
                                    },
                              ),
                            )
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          disabled={bon.items.length <= 1}
                          onClick={() =>
                            setSuppliers((prev) =>
                              prev.map((s) =>
                                s.key !== supplier.key
                                  ? s
                                  : {
                                      ...s,
                                      bons: s.bons.map((b) =>
                                        b.key !== bon.key
                                          ? b
                                          : {
                                              ...b,
                                              items: b.items.filter((i) => i.key !== item.key),
                                            },
                                      ),
                                    },
                              ),
                            )
                          }
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                          title="Hapus item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() =>
                setSuppliers((prev) =>
                  prev.map((s) =>
                    s.key === supplier.key
                      ? {
                          ...s,
                          bons: s.bons.map((b) =>
                            b.key === bon.key
                              ? { ...b, items: [...b.items, newMaterialItem()] }
                              : b,
                          ),
                        }
                      : s,
                  ),
                )
              }
              className="text-xs font-bold text-orange-700 hover:underline"
            >
              + Tambah item
            </button>
            <p className="text-[10px] font-semibold text-orange-800">
              Subtotal bon ini: <span className='text-red-500'>
              {formatRupiah(bonMaterialTotal(bon))}
              </span>
            </p>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setSuppliers((prev) =>
              prev.map((s) =>
                s.key === supplier.key ? { ...s, bons: [...s.bons, newMaterialBon()] } : s,
              ),
            )
          }
          className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:underline"
        >
          <Plus size={14} />
          Tambah bon di supplier yang sama
        </button>

        <p className="text-[10px] text-slate-500">
          Foto bon opsional — bisa isi item manual tanpa foto.
        </p>

        <p className="text-xs font-semibold text-orange-900">
          Total belanja supplier ini: <span className='text-red-500'>
          {formatRupiah(supplierMaterialTotal(supplier))}
          </span>
        </p>
      </div>
    ))}
    <button
      type="button"
      onClick={() => setSuppliers((prev) => [...prev, newMaterialSupplier()])}
      className="text-xs font-bold text-orange-700 hover:underline"
    >
      + Tambah supplier
    </button>
    <p className="text-sm font-bold text-orange-800">
      Total semua belanja material: {formatRupiah(allMaterialTotal(suppliers))}
    </p>
  </div>
  );
};

const UpahTukangEditor = ({
  upahTanggalDari,
  setUpahTanggalDari,
  upahTanggalSampai,
  setUpahTanggalSampai,
  upahBaris,
  setUpahBaris,
  upahTotalNominal,
  setUpahTotalNominal,
  tukangList,
  onSelectTukang,
  idPrefix,
}: {
  upahTanggalDari: string;
  setUpahTanggalDari: (v: string) => void;
  upahTanggalSampai: string;
  setUpahTanggalSampai: (v: string) => void;
  upahBaris: UpahBarisForm[];
  setUpahBaris: React.Dispatch<React.SetStateAction<UpahBarisForm[]>>;
  upahTotalNominal: number | '';
  setUpahTotalNominal: (v: number | '') => void;
  tukangList: { id: number; nik: string; nama: string }[];
  onSelectTukang: (key: string, tukangId: number | '') => void;
  idPrefix: string;
}) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase">Dari tanggal</label>
        <input
          type="date"
          value={upahTanggalDari}
          onChange={(e) => setUpahTanggalDari(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase">Sampai tanggal</label>
        <input
          type="date"
          value={upahTanggalSampai}
          onChange={(e) => setUpahTanggalSampai(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
        />
      </div>
    </div>
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs border-collapse min-w-[480px]">
        <thead>
          <tr>
            <th className={thClass}>Pilih tukang</th>
            <th className={thClass}>NIK</th>
            <th className={thClass}>Nama</th>
            <th className={`${thClass} w-10`} />
          </tr>
        </thead>
        <tbody>
          {upahBaris.map((row) => (
            <tr key={row.key}>
              <td className={tdClass}>
                <select
                  value={row.tukangId === '' ? '' : String(row.tukangId)}
                  onChange={(e) =>
                    onSelectTukang(row.key, e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                >
                  <option value="">Input manual</option>
                  {tukangList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nik} — {t.nama}
                    </option>
                  ))}
                </select>
              </td>
              <td className={tdClass}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={20}
                  value={row.nik}
                  onChange={(e) =>
                    setUpahBaris((prev) =>
                      prev.map((r) =>
                        r.key === row.key
                          ? { ...r, nik: normalizeNikInput(e.target.value), tukangId: '' }
                          : r,
                      ),
                    )
                  }
                  className="w-full min-w-[100px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                  placeholder="NIK"
                  title={
                    row.tukangId === '' && row.nik && !isValidNik(row.nik)
                      ? 'Untuk export Coretax, NIK harus 16 digit'
                      : undefined
                  }
                />
              </td>
              <td className={tdClass}>
                <input
                  type="text"
                  value={row.nama}
                  onChange={(e) =>
                    setUpahBaris((prev) =>
                      prev.map((r) =>
                        r.key === row.key ? { ...r, nama: e.target.value } : r,
                      ),
                    )
                  }
                  className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                  placeholder="Nama"
                />
              </td>
              <td className={tdClass}>
                <button
                  type="button"
                  disabled={upahBaris.length <= 1}
                  onClick={() =>
                    setUpahBaris((prev) => prev.filter((r) => r.key !== row.key))
                  }
                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                  title="Hapus tukang"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button
      type="button"
      onClick={() => setUpahBaris((prev) => [...prev, newUpahBaris()])}
      className="text-xs font-bold text-teal-700 hover:underline"
    >
      + Tambah tukang
    </button>
    <CurrencyInput
      label="Total upah tukang"
      name={`${idPrefix}-upah-total`}
      value={upahTotalNominal === '' ? 0 : upahTotalNominal}
      onValueChange={(_, value) => setUpahTotalNominal(value > 0 ? value : '')}
      placeholder="0"
    />
  </div>
);

const PengurangMengurangiCell = ({
  rowId,
  nilaiKontrak,
  pengurangRows,
  terminStatus,
  fallbackTermin,
  terminScheme,
}: {
  rowId: number;
  nilaiKontrak: number;
  pengurangRows: SpkPengurangTerminRow[];
  terminStatus: ReturnType<typeof getTerminPaymentStatus>;
  fallbackTermin?: SpkKasbonTargetTermin | null;
  terminScheme: SpkTerminSchemeKey;
}) => {
  const kasbonTargetLabels = buildSpkKasbonTargetLabel(terminScheme);
  const split = getPengurangRowWaterfallSplit(
    nilaiKontrak,
    pengurangRows,
    rowId,
    terminStatus,
    terminScheme,
  );

  const label = formatPengurangMengurangiLabel(split, formatRupiah, terminScheme);
  if (label === '—') {
    return (
      <span>
        {fallbackTermin ? kasbonTargetLabels[fallbackTermin] : '—'}
      </span>
    );
  }

  return (
    <div className="space-y-1 text-[10px] leading-snug">
      {Object.entries(split.byTarget).map(([target, nominal]) => {
        if (!nominal || nominal <= 0) return null;
        return (
          <div key={target}>
            <span className="font-bold text-blue-700">
              {kasbonTargetLabels[target as SpkKasbonTargetTermin]}
            </span>
            <span className="block tabular-nums text-slate-700">{formatRupiah(nominal)}</span>
          </div>
        );
      })}
    </div>
  );
};

const PengurangPlafonBanner = ({
  nilaiKontrak,
  rows,
  termin,
  additionalNominal,
  excludeId,
  terminStatus,
  terminScheme,
  spkProgress,
}: {
  nilaiKontrak: number;
  rows: SpkPengurangTerminRow[];
  termin: SpkKasbonTargetTermin;
  additionalNominal: number;
  excludeId?: number;
  terminStatus?: ReturnType<typeof getTerminPaymentStatus>;
  terminScheme: SpkTerminSchemeKey;
  spkProgress?: number;
}) => {
  const kasbonTargetLabels = buildSpkKasbonTargetLabel(terminScheme);
  const targets = getKasbonTargetSteps(getSpkTerminScheme(terminScheme));
  const nextTarget = targets.find((step) => step.jenis === termin);
  const nextTargetIndex = targets.findIndex((step) => step.jenis === termin);
  const spillLabel =
    nextTargetIndex >= 0 && nextTargetIndex < targets.length - 1
      ? kasbonTargetLabels[targets[nextTargetIndex + 1]!.jenis]
      : null;
  const nextStep =
    nextTargetIndex >= 0 && nextTargetIndex < targets.length - 1
      ? targets[nextTargetIndex + 1]
      : null;

  const cap = getPengurangTerminCapacity(nilaiKontrak, rows, termin, {
    excludeId,
    additionalNominal,
    terminStatus,
    terminScheme,
  });

  const strictValidation =
    additionalNominal > 0
      ? validatePengurangTerminNominal(
          nilaiKontrak,
          rows,
          termin,
          additionalNominal,
          excludeId,
          terminStatus,
          terminScheme,
          spkProgress,
        )
      : { allowed: true as const };
  const isAllowed = strictValidation.allowed;

  return (
    <div className="space-y-2">
      {!isAllowed && strictValidation.reason && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-bold">Tidak dapat diajukan</p>
          <p className="text-xs mt-1 leading-relaxed">{strictValidation.reason}</p>
        </div>
      )}
      {spkProgress != null &&
        additionalNominal > 0 &&
        nextStep &&
        !canSpillPengurangToNextTermin(spkProgress, termin, terminScheme) && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
            Progress proyek saat ini <strong>{spkProgress}%</strong>. Material/upah dibatasi
            sisa plafon <strong>{kasbonTargetLabels[termin]}</strong> ({formatRupiah(cap.sisa)})
            sampai progress mencapai <strong>{nextStep.minProgress}%</strong>
            {spillLabel ? ` (termin ${spillLabel})` : ''}.
          </p>
        )}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plafon</p>
        <p className="font-black text-slate-800">{formatRupiah(cap.bruto)}</p>
      </div>
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Terpakai</p>
        <p className="font-black text-slate-800">{formatRupiah(cap.terpakai)}</p>
      </div>
      <div className={`p-2.5 rounded-lg border ${isAllowed || additionalNominal <= 0 ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'}`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sisa</p>
        <p className={`font-black ${isAllowed || additionalNominal <= 0 ? 'text-slate-800' : 'text-red-600'}`}>{formatRupiah(cap.sisa)}</p>
      </div>
      {additionalNominal > 0 && (
        <>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Nominal ini</p>
            <p className="font-black text-blue-700">{formatRupiah(additionalNominal)}</p>
          </div>
          <div className={`p-2.5 rounded-lg border col-span-2 sm:col-span-2 ${isAllowed ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sisa setelah</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-black ${isAllowed ? 'text-emerald-700' : 'text-red-600'}`}>{formatRupiah(Math.max(0, cap.sisaSetelah))}</p>
              {!isAllowed && (
                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Melebihi plafon</span>
              )}
              {isAllowed && cap.spilloverKeTermin100 > 0 && spillLabel && (
                <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">
                  {formatRupiah(cap.spilloverKeTermin100)} mengurangi {spillLabel}
                </span>
              )}
            </div>
          </div>
        </>
      )}
      {targets[0]?.jenis === termin &&
        cap.sisa <= 0 &&
        cap.combinedSisa > 0 &&
        additionalNominal <= 0 &&
        spillLabel && (
        <div className="col-span-2 sm:col-span-3 p-2.5 rounded-lg bg-violet-50 border border-violet-100 text-[10px] text-violet-800">
          Plafon {nextTarget?.kasbonTargetLabel ?? kasbonTargetLabels[termin]} sudah habis. Pengajuan berikutnya akan mengurangi {spillLabel} (sisa gabungan: {formatRupiah(cap.combinedSisa)}).
        </div>
      )}
    </div>
    </div>
  );
};

const compareKavlingBlokUnit = (
  a: { blok: string; nomorUnit: string },
  b: { blok: string; nomorUnit: string },
) => {
  const blokCmp = a.blok.localeCompare(b.blok, undefined, { numeric: true, sensitivity: 'base' });
  if (blokCmp !== 0) return blokCmp;
  return a.nomorUnit.localeCompare(b.nomorUnit, undefined, { numeric: true, sensitivity: 'base' });
};

interface SpkPembayaranPanelProps {
  spk: SpkData;
  canAjukan: boolean;
  /** Hanya tampilkan modal ajukan kasbon (shortcut dari tabel SPK). */
  kasbonOnly?: boolean;
  onKasbonModalClose?: () => void;
  /** Hanya histori pengajuan kasbon & upah (expand baris tabel SPK). */
  historiOnly?: boolean;
}

const SpkPembayaranPanel = ({
  spk,
  canAjukan,
  kasbonOnly = false,
  onKasbonModalClose,
  historiOnly = false,
}: SpkPembayaranPanelProps) => {
  const { user } = useAuth();
  const { canUpdate: canUpdateSpk } = usePermission('SPK');
  const isMandor = user?.role === 'MANDOR';
  const isAssignedMandor =
    isMandor && user?.id != null && Number(spk.mandorId) === Number(user.id);
  const canManagePengurangan = canUpdateSpk || isAssignedMandor;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [kasbonModalOpen, setKasbonModalOpen] = useState(false);
  const [kasbonEditModalOpen, setKasbonEditModalOpen] = useState(false);
  const [editingKasbon, setEditingKasbon] = useState<SpkPembayaranData | null>(null);
  const [editingKasbonIsBatch, setEditingKasbonIsBatch] = useState(false);
  const [materialSuppliers, setMaterialSuppliers] = useState<MaterialSupplierForm[]>(() => [
    newMaterialSupplier(),
  ]);
  const [kasbonLegacyKeterangan, setKasbonLegacyKeterangan] = useState('');
  const [kasbonLegacyNominal, setKasbonLegacyNominal] = useState<number | ''>('');
  const [kasbonLegacyTanggalPo, setKasbonLegacyTanggalPo] = useState(() => todayIso());
  const [kasbonInputMode, setKasbonInputMode] = useState<'detail' | 'legacy'>('detail');
  const [legacyCreateRows, setLegacyCreateRows] = useState<LegacyKasbonRowForm[]>(() => [
    newLegacyKasbonRow(),
  ]);
  const [upahEditModalOpen, setUpahEditModalOpen] = useState(false);
  const [editingUpah, setEditingUpah] = useState<SpkPembayaranData | null>(null);
  const [upahTanggalDari, setUpahTanggalDari] = useState(() => todayIso());
  const [upahTanggalSampai, setUpahTanggalSampai] = useState(() => todayIso());
  const [upahBaris, setUpahBaris] = useState<UpahBarisForm[]>(() => [newUpahBaris()]);
  const [upahTotalNominal, setUpahTotalNominal] = useState<number | ''>('');
  const [materialInvoiceFile, setMaterialInvoiceFile] = useState<File | null>(null);
  const [materialDokumenFile, setMaterialDokumenFile] = useState<File | null>(null);
  const [upahInvoiceFile, setUpahInvoiceFile] = useState<File | null>(null);
  const [legacyKasbonInvoiceFile, setLegacyKasbonInvoiceFile] = useState<File | null>(null);
  const [legacyKasbonMaterialDocFile, setLegacyKasbonMaterialDocFile] = useState<File | null>(null);
  const [terminAjukanModal, setTerminAjukanModal] = useState<SpkTerminPembayaranJenis | null>(
    null,
  );
  const [terminInvoiceFile, setTerminInvoiceFile] = useState<File | null>(null);
  const [terminBaFile, setTerminBaFile] = useState<File | null>(null);
  const [terminProgressFile, setTerminProgressFile] = useState<File | null>(null);
  const [draftAutoSaveStatus, setDraftAutoSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const hydratedDraftKeyRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const kasbonCreateModalOpen = kasbonModalOpen || kasbonOnly;

  const { data: pembayaranList = [], isLoading } = useGetSpkPembayaranBySpk(spk.id);
  const {
    data: kasbonDraft,
    isFetched: kasbonDraftFetched,
    isFetching: kasbonDraftFetching,
  } = useGetKasbonDraft(spk.id, kasbonCreateModalOpen);

  const hasActiveDraft =
    kasbonDraftFetched &&
    !kasbonDraftFetching &&
    !!kasbonDraft?.kasbonBaris?.length;

  const isKasbonDraftLoading = kasbonCreateModalOpen && (!kasbonDraftFetched || kasbonDraftFetching);
  const { data: tukangList = [] } = useGetTukangList(
    undefined,
    kasbonModalOpen || upahEditModalOpen || kasbonOnly,
  );
  const createMutation = useCreateSpkPembayaranRequest();
  const saveDraftMutation = useSaveKasbonDraft();
  const submitDraftMutation = useSubmitKasbonDraft();
  const updateKasbonMutation = useUpdateSpkKasbon();
  const updateUpahMutation = useUpdateSpkUpah();
  const deleteMutation = useDeleteSpkPengurangan();

  const { data: profile } = useGetProfile();
  const { data: mandorRekeningRemote = [] } = useGetMandorRekening(
    spk.mandorId,
    canAjukan && !isAssignedMandor,
  );
  const mandorRekeningOptions: MandorRekeningData[] = useMemo(() => {
    if (isAssignedMandor) {
      const list = profile?.mandor?.rekeningList;
      if (list?.length) return list;
      if (profile?.mandor) {
        return [
          {
            id: 0,
            namaBank: profile.mandor.namaBank,
            noRekening: profile.mandor.noRekening,
            atasNamaRekening: profile.mandor.atasNamaRekening,
            isDefault: true,
          },
        ];
      }
      return [];
    }
    return mandorRekeningRemote;
  }, [isAssignedMandor, profile?.mandor, mandorRekeningRemote]);

  const [selectedMandorRekeningId, setSelectedMandorRekeningId] = useState<number | ''>('');

  useEffect(() => {
    if (!canAjukan) return;
    setSelectedMandorRekeningId(pickDefaultMandorRekeningId(mandorRekeningOptions));
  }, [canAjukan, mandorRekeningOptions, spk.id]);

  const resolveSubmitMandorRekeningId = (): number | undefined => {
    if (!mandorRekeningOptions.length) return undefined;
    if (mandorRekeningOptions.length === 1) {
      const only = mandorRekeningOptions[0]!;
      return only.id > 0 ? only.id : undefined;
    }
    if (selectedMandorRekeningId === '') return undefined;
    return Number(selectedMandorRekeningId);
  };

  const assertMandorRekeningSelected = () => {
    if (mandorRekeningOptions.length > 1 && selectedMandorRekeningId === '') {
      alert('Pilih rekening tujuan transfer terlebih dahulu.');
      return false;
    }
    return true;
  };

  const mandorRekeningSelect =
    mandorRekeningOptions.length > 0 && canAjukan ? (
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 space-y-2">
        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
          Rekening tujuan transfer
        </p>
        {mandorRekeningOptions.length === 1 ? (
          <p className="text-xs text-blue-900 font-medium">
            {formatMandorRekeningLabel(mandorRekeningOptions[0]!)}
            {mandorRekeningOptions[0]?.atasNamaRekening && (
              <span className="block text-[10px] text-blue-700/80 mt-0.5">
                a/n {mandorRekeningOptions[0]!.atasNamaRekening}
              </span>
            )}
          </p>
        ) : (
          <Select
            label="Pilih rekening"
            name="mandorRekeningId"
            value={selectedMandorRekeningId !== '' ? String(selectedMandorRekeningId) : ''}
            onChange={(e) =>
              setSelectedMandorRekeningId(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
            options={[
              { value: '', label: '— Pilih rekening —' },
              ...mandorRekeningOptions.map((rek) => ({
                value: String(rek.id),
                label: formatMandorRekeningLabel(rek),
              })),
            ]}
          />
        )}
      </div>
    ) : null;

  const submittedPembayaranList = useMemo(
    () => pembayaranList.filter((p) => p.status !== 'DRAFT'),
    [pembayaranList],
  );
  const calcRows = toCalcRows(submittedPembayaranList);
  const terminScheme = resolveSpkTerminScheme(spk);
  const terminJenisOrder = useMemo(() => {
    const base = getSpkTerminJenisOrder(terminScheme);
    const legacyTermin = submittedPembayaranList
      .map((p) => p.jenis)
      .filter(
        (jenis): jenis is SpkTerminPembayaranJenis =>
          jenis !== 'KASBON' &&
          jenis !== 'UPAH' &&
          !base.includes(jenis as SpkTerminPembayaranJenis),
      );
    return [...base, ...legacyTermin];
  }, [terminScheme, submittedPembayaranList]);
  const jenisLabels = useMemo(() => buildSpkPembayaranJenisLabel(terminScheme), [terminScheme]);
  const kasbonTargetLabels = useMemo(() => buildSpkKasbonTargetLabel(terminScheme), [terminScheme]);
  const terminStatus = useMemo(
    () => getTerminPaymentStatus(calcRows, terminScheme),
    [calcRows, terminScheme],
  );

  const pengurangRows: SpkPengurangTerminRow[] = useMemo(
    () =>
      submittedPembayaranList.map((p) => ({
        id: p.id,
        jenis: p.jenis,
        nominal: p.nominal,
        mengurangiTermin: p.mengurangiTermin,
      })),
    [submittedPembayaranList],
  );
  const statusRows = submittedPembayaranList.map((p) => ({
    id: p.id,
    jenis: p.jenis,
    status: p.status,
    nominal: p.nominal,
    mengurangiTermin: p.mengurangiTermin,
  }));

  const spkInput = {
    nilaiKontrak: spk.nilaiKontrak,
    progress: Number(spk.progress ?? 0),
  };

  const kasbonItems = submittedPembayaranList.filter((p) => p.jenis === 'KASBON');
  const upahItems = submittedPembayaranList.filter((p) => p.jenis === 'UPAH');
  const pengurangCheck = canRequestKasbon(statusRows, spk.nilaiKontrak, terminScheme);

  const materialTotalPreview = useMemo(
    () => allMaterialTotal(materialSuppliers),
    [materialSuppliers],
  );

  const upahTotalPreview = upahTotalNominal === '' ? 0 : Number(upahTotalNominal);

  const legacyCreateTotal = useMemo(
    () =>
      legacyCreateRows.reduce(
        (sum, row) => sum + (row.nominal === '' ? 0 : Number(row.nominal)),
        0,
      ),
    [legacyCreateRows],
  );

  const combinedSubmitTotal = materialTotalPreview + upahTotalPreview;
  const activeCreateTotal =
    kasbonInputMode === 'legacy' ? legacyCreateTotal : combinedSubmitTotal;

  const kasbonLegacyEditTotal =
    kasbonLegacyNominal === '' ? 0 : Number(kasbonLegacyNominal);

  const kasbonCreatePlafonValidation = useMemo(() => {
    if (!pengurangCheck.targetTermin || activeCreateTotal <= 0) {
      return { allowed: true as const };
    }
    return validatePengurangTerminNominal(
      spk.nilaiKontrak,
      pengurangRows,
      pengurangCheck.targetTermin,
      activeCreateTotal,
      undefined,
      terminStatus,
      terminScheme,
      spk.progress,
    );
  }, [
    pengurangCheck.targetTermin,
    activeCreateTotal,
    spk.nilaiKontrak,
    pengurangRows,
    terminStatus,
    terminScheme,
    spk.progress,
  ]);

  const kasbonCreateOverPlafon = !kasbonCreatePlafonValidation.allowed;

  const kasbonEditOverPlafon = useMemo(() => {
    if (!editingKasbon?.mengurangiTermin) return false;
    const total = editingKasbonIsBatch ? materialTotalPreview : kasbonLegacyEditTotal;
    if (total <= 0) return false;
    return !validatePengurangTerminNominal(
      spk.nilaiKontrak,
      pengurangRows,
      editingKasbon.mengurangiTermin,
      total,
      editingKasbon.id,
      terminStatus,
      terminScheme,
      spk.progress,
    ).allowed;
  }, [
    editingKasbon,
    editingKasbonIsBatch,
    materialTotalPreview,
    kasbonLegacyEditTotal,
    pengurangRows,
    spk.nilaiKontrak,
    terminStatus,
  ]);

  const upahEditOverPlafon = useMemo(() => {
    if (!editingUpah?.mengurangiTermin) return false;
    if (upahTotalPreview <= 0) return false;
    return !validatePengurangTerminNominal(
      spk.nilaiKontrak,
      pengurangRows,
      editingUpah.mengurangiTermin,
      upahTotalPreview,
      editingUpah.id,
      terminStatus,
      terminScheme,
      spk.progress,
    ).allowed;
  }, [editingUpah, upahTotalPreview, pengurangRows, spk.nilaiKontrak, terminStatus, spk.progress]);

  const handleAjukanTermin = (jenis: SpkTerminPembayaranJenis) => {
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows, terminScheme);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }
    if (!assertMandorRekeningSelected()) return;
    setTerminInvoiceFile(null);
    setTerminBaFile(null);
    setTerminProgressFile(null);
    setTerminAjukanModal(jenis);
  };

  const closeTerminAjukanModal = () => {
    setTerminAjukanModal(null);
    setTerminInvoiceFile(null);
    setTerminBaFile(null);
    setTerminProgressFile(null);
  };

  const handleConfirmAjukanTermin = async () => {
    if (!terminAjukanModal) return;
    const jenis = terminAjukanModal;
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows, terminScheme);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }
    if (!terminInvoiceFile) {
      alert('Dokumen invoice (PDF) wajib diunggah.');
      return;
    }
    const isRetensi = jenis === 'RETENSI';
    if (!isRetensi) {
      if (!terminBaFile) {
        alert('Dokumen berita acara / BA (PDF) wajib diunggah.');
        return;
      }
      if (!terminProgressFile) {
        alert('Dokumen progress SPK (PDF) wajib diunggah.');
        return;
      }
    }
    if (
      !window.confirm(
        `Ajukan pembayaran ${jenisLabels[jenis]} sebesar ${formatRupiah(check.nominal)}?`,
      )
    ) {
      return;
    }
    const mandorRekeningId = resolveSubmitMandorRekeningId();
    try {
      const dokumenInvoice = await uploadPengajuanPdf(terminInvoiceFile);
      const body: CreateSpkPembayaranBody = isRetensi
        ? { jenis, mandorRekeningId, dokumenInvoice }
        : {
            jenis,
            mandorRekeningId,
            dokumenInvoice,
            dokumenBeritaAcara: await uploadPengajuanPdf(terminBaFile!),
            dokumenProgressSpk: await uploadPengajuanPdf(terminProgressFile!),
          };
      await createMutation.mutateAsync({ spkId: spk.id, body });
      closeTerminAjukanModal();
      alert('Pengajuan pembayaran berhasil dikirim ke pengawas.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const resetKasbonForm = () => {
    setMaterialSuppliers([newMaterialSupplier()]);
    setUpahTanggalDari(todayIso());
    setUpahTanggalSampai(todayIso());
    setUpahBaris([newUpahBaris()]);
    setUpahTotalNominal('');
    setMaterialInvoiceFile(null);
    setMaterialDokumenFile(null);
    setUpahInvoiceFile(null);
    setLegacyKasbonInvoiceFile(null);
    setLegacyKasbonMaterialDocFile(null);
    setKasbonInputMode('detail');
    setLegacyCreateRows([newLegacyKasbonRow()]);
    setDraftAutoSaveStatus('idle');
    hydratedDraftKeyRef.current = null;
  };

  const openKasbonCreateModal = () => {
    clearKasbonDraftCache(queryClient, spk.id);
    resetKasbonForm();
    setKasbonModalOpen(true);
  };

  const closeKasbonCreateModal = () => {
    setKasbonModalOpen(false);
    hydratedDraftKeyRef.current = null;
    clearKasbonDraftCache(queryClient, spk.id);
    if (kasbonOnly) onKasbonModalClose?.();
  };

  const persistKasbonDraft = useCallback(
    async (
      suppliers: MaterialSupplierForm[],
      options?: { silent?: boolean; syncForm?: boolean },
    ): Promise<boolean> => {
      const silent = options?.silent ?? false;
      const syncForm = options?.syncForm ?? true;

      if (!suppliers.some(supplierIsUsed)) {
        if (!silent) {
          alert('Tidak ada bon/material yang diisi untuk disimpan sebagai draft.');
        }
        return false;
      }

      // const usedSuppliers = suppliers.filter(supplierIsUsed);

      try {
        const uploadedSuppliers = await uploadMaterialSupplierFotos(suppliers);
        const baris = flattenMaterialSuppliers(uploadedSuppliers);
        if (!baris) {
          if (!silent) {
            alert(
              'Setiap supplier wajib memiliki nama, tanggal, dan minimal satu item dengan keterangan serta nominal.',
            );
          }
          return false;
        }

        await saveDraftMutation.mutateAsync({
          spkId: spk.id,
          body: { kasbonBaris: baris },
        });
        if (syncForm) {
          setMaterialSuppliers(uploadedSuppliers);
        }
        setDraftAutoSaveStatus('saved');
        return true;
      } catch (err: unknown) {
        setDraftAutoSaveStatus('error');
        if (!silent) {
          alert(handleApiError(err).message);
        }
        return false;
      }
    },
    [saveDraftMutation, spk.id],
  );

  useEffect(() => {
    if (!kasbonOnly) return;
    if (!canAjukan) {
      alert('Anda tidak dapat mengajukan kasbon untuk SPK ini.');
      onKasbonModalClose?.();
      return;
    }
    clearKasbonDraftCache(queryClient, spk.id);
    resetKasbonForm();
    setKasbonModalOpen(true);
  }, [kasbonOnly, canAjukan, spk.id, queryClient]);

  useEffect(() => {
    if (!kasbonCreateModalOpen) {
      hydratedDraftKeyRef.current = null;
      return;
    }
    if (!kasbonDraftFetched || kasbonDraftFetching) return;

    const draftKey = kasbonDraft?.kasbonBaris?.length
      ? `draft-${kasbonDraft!.id}`
      : 'empty';
    if (hydratedDraftKeyRef.current === draftKey) return;

    if (kasbonDraft?.kasbonBaris?.length) {
      setKasbonInputMode('detail');
      setMaterialSuppliers(kasbonBarisToSuppliers(kasbonDraft.kasbonBaris));
    } else if (hydratedDraftKeyRef.current !== 'empty') {
      setMaterialSuppliers([newMaterialSupplier()]);
      setDraftAutoSaveStatus('idle');
    }
    hydratedDraftKeyRef.current = draftKey;
  }, [kasbonCreateModalOpen, kasbonDraft, kasbonDraftFetched, kasbonDraftFetching]);

  const handleAjukanLegacyKasbon = async () => {
    const rows = legacyCreateRows.filter(
      (row) =>
        row.keterangan.trim() !== '' &&
        row.nominal !== '' &&
        Number(row.nominal) > 0,
    );

    if (!rows.length) {
      alert('Isi minimal satu baris dengan keterangan dan nominal.');
      return;
    }

    if (!pengurangCheck.allowed) {
      alert(pengurangCheck.reason ?? 'Tidak dapat mengajukan kasbon.');
      return;
    }

    const grandTotal = rows.reduce((sum, row) => sum + Number(row.nominal), 0);

    if (pengurangCheck.targetTermin) {
      const plafon = validatePengurangTerminNominal(
        spk.nilaiKontrak,
        pengurangRows,
        pengurangCheck.targetTermin,
        grandTotal,
        undefined,
        terminStatus,
        terminScheme,
        spk.progress,
      );
      if (!plafon.allowed) {
        alert(plafon.reason);
        return;
      }
    }

    const targetLabel = pengurangCheck.targetTermin
      ? kasbonTargetLabels[pengurangCheck.targetTermin]
      : '';
    const rowSummary = rows
      .map((row) => `• ${row.keterangan.trim()} — ${formatRupiah(Number(row.nominal))}`)
      .join('\n');

    if (
      !window.confirm(
        `Ajukan ${rows.length} kasbon (total ${formatRupiah(grandTotal)})?\n\n${rowSummary}\n\nMengurangi: ${targetLabel}`,
      )
    ) {
      return;
    }

    if (!assertMandorRekeningSelected()) return;
    if (!legacyKasbonInvoiceFile) {
      alert('Dokumen invoice material (PDF) wajib diunggah.');
      return;
    }
    if (!legacyKasbonMaterialDocFile) {
      alert('Dokumen material (PDF) wajib diunggah.');
      return;
    }
    const mandorRekeningId = resolveSubmitMandorRekeningId();

    try {
      const dokumenInvoice = await uploadPengajuanPdf(legacyKasbonInvoiceFile);
      const dokumenMaterial = await uploadPengajuanPdf(legacyKasbonMaterialDocFile);
      for (const row of rows) {
        await createMutation.mutateAsync({
          spkId: spk.id,
          body: {
            jenis: 'KASBON',
            keterangan: row.keterangan.trim(),
            nominal: Number(row.nominal),
            tanggalPo: row.tanggalPo || todayIso(),
            mandorRekeningId,
            dokumenInvoice,
            dokumenMaterial,
          },
        });
      }
      closeKasbonCreateModal();
      resetKasbonForm();
      alert(
        rows.length === 1
          ? 'Pengajuan kasbon berhasil dikirim ke pengawas.'
          : `${rows.length} pengajuan kasbon berhasil dikirim ke pengawas.`,
      );
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleAjukanKasbon = async () => {
    if (kasbonInputMode === 'legacy') {
      await handleAjukanLegacyKasbon();
      return;
    }

    const materialSectionUsed = materialSuppliers.some(supplierIsUsed);
    const upahSectionUsed =
      upahTotalPreview > 0 || upahBaris.some((r) => r.nik.trim() || r.nama.trim());

    const materialBarisPreview = materialSectionUsed
      ? flattenMaterialSuppliers(materialSuppliers)
      : null;
    const upahBarisParsed = upahSectionUsed ? parseUpahBarisBody(upahBaris) : null;
    const upahBarisBody = upahBarisParsed?.ok ? upahBarisParsed.data : null;
    const upahTotal = upahTotalPreview;

    if (!pengurangCheck.allowed) {
      alert(pengurangCheck.reason ?? 'Tidak dapat mengajukan kasbon.');
      return;
    }

    if (!materialSectionUsed && !upahSectionUsed) {
      alert('Isi minimal bagian material atau upah tukang.');
      return;
    }
    if (materialSectionUsed && !materialBarisPreview) {
      alert(
        'Setiap supplier wajib memiliki nama, tanggal, dan minimal satu item dengan keterangan serta nominal.',
      );
      return;
    }
    if (upahSectionUsed) {
      if (!upahTanggalDari || !upahTanggalSampai) {
        alert('Periode tanggal upah wajib diisi.');
        return;
      }
      if (upahTanggalDari > upahTanggalSampai) {
        alert('Tanggal dari tidak boleh setelah tanggal sampai.');
        return;
      }
      if (!upahBarisBody) {
        alert(
          upahBarisParsed && !upahBarisParsed.ok
            ? upahBarisParsed.message
            : 'Setiap tukang wajib memiliki NIK (16 digit) dan nama.',
        );
        return;
      }
      if (!upahTotal || upahTotal <= 0) {
        alert('Total upah tukang wajib diisi dan harus lebih dari 0.');
        return;
      }
    } else if (upahTotal > 0) {
      alert('Isi daftar tukang jika ada total upah.');
      return;
    }

    if (!pengurangCheck.allowed) {
      alert(pengurangCheck.reason);
      return;
    }

    const targetLabel = pengurangCheck.targetTermin
      ? kasbonTargetLabels[pengurangCheck.targetTermin]
      : '';
    const materialTotal =
      materialBarisPreview?.reduce((sum, b) => sum + b.nominal, 0) ?? 0;
    const grandTotal = materialTotal + (upahSectionUsed ? upahTotal : 0);

    if (grandTotal <= 0) {
      alert('Total pengajuan harus lebih dari 0.');
      return;
    }

    if (pengurangCheck.targetTermin) {
      const plafon = validatePengurangTerminNominal(
        spk.nilaiKontrak,
        pengurangRows,
        pengurangCheck.targetTermin,
        grandTotal,
        undefined,
        terminStatus,
        terminScheme,
        spk.progress,
      );
      if (!plafon.allowed) {
        alert(plafon.reason);
        return;
      }
    }

    const parts: string[] = [];
    if (materialSectionUsed && materialBarisPreview) {
      parts.push(
        `Material ${formatRupiah(materialTotal)} (${materialBarisPreview.length} item)`,
      );
    }
    if (upahSectionUsed && upahBarisBody) {
      parts.push(
        `Upah ${formatRupiah(upahTotal)} (${upahBarisBody.length} tukang, ${upahTanggalDari} s/d ${upahTanggalSampai})`,
      );
    }

    if (
      !window.confirm(
        `Ajukan kasbon total ${formatRupiah(grandTotal)}?\n${parts.join('\n')}\nMengurangi: ${targetLabel}`,
      )
    ) {
      return;
    }

    if (!assertMandorRekeningSelected()) return;
    if (materialSectionUsed) {
      if (!materialInvoiceFile) {
        alert('Dokumen invoice material (PDF) wajib diunggah.');
        return;
      }
      if (!materialDokumenFile) {
        alert('Dokumen material (PDF) wajib diunggah.');
        return;
      }
    }
    if (upahSectionUsed && !upahInvoiceFile) {
      alert('Dokumen invoice upah mandor (PDF) wajib diunggah.');
      return;
    }
    const mandorRekeningId = resolveSubmitMandorRekeningId();

    try {
      const materialDokumen =
        materialSectionUsed && materialInvoiceFile && materialDokumenFile
          ? {
              dokumenInvoice: await uploadPengajuanPdf(materialInvoiceFile),
              dokumenMaterial: await uploadPengajuanPdf(materialDokumenFile),
            }
          : null;
      const upahDokumenInvoice =
        upahSectionUsed && upahInvoiceFile
          ? await uploadPengajuanPdf(upahInvoiceFile)
          : null;

      if (materialSectionUsed) {
        const uploadedSuppliers = await uploadMaterialSupplierFotos(materialSuppliers);
        const materialBaris = flattenMaterialSuppliers(uploadedSuppliers);
        if (!materialBaris) {
          alert(
            'Setiap supplier wajib memiliki nama, tanggal, dan minimal satu item dengan keterangan serta nominal.',
          );
          return;
        }
        if (!materialDokumen) {
          alert('Dokumen invoice dan material wajib diunggah.');
          return;
        }
        if (kasbonDraft?.status === 'DRAFT') {
          await saveDraftMutation.mutateAsync({
            spkId: spk.id,
            body: { kasbonBaris: materialBaris },
          });
          await submitDraftMutation.mutateAsync({
            spkId: spk.id,
            mandorRekeningId,
            dokumenInvoice: materialDokumen.dokumenInvoice,
            dokumenMaterial: materialDokumen.dokumenMaterial,
          });
        } else {
          await createMutation.mutateAsync({
            spkId: spk.id,
            body: {
              jenis: 'KASBON',
              kasbonBaris: materialBaris,
              mandorRekeningId,
              dokumenInvoice: materialDokumen.dokumenInvoice,
              dokumenMaterial: materialDokumen.dokumenMaterial,
            },
          });
        }
      } else if (kasbonDraft?.status === 'DRAFT') {
        await deleteMutation.mutateAsync({ id: kasbonDraft.id, spkId: spk.id });
      }
      if (upahSectionUsed && upahBarisBody) {
        if (!upahDokumenInvoice) {
          alert('Dokumen invoice upah mandor wajib diunggah.');
          return;
        }
        await createMutation.mutateAsync({
          spkId: spk.id,
          body: {
            jenis: 'UPAH',
            tanggalDari: upahTanggalDari,
            tanggalSampai: upahTanggalSampai,
            baris: upahBarisBody,
            upahNominal: upahTotal,
            mandorRekeningId,
            dokumenInvoice: upahDokumenInvoice,
          },
        });
      }
      clearKasbonDraftCache(queryClient, spk.id);
      closeKasbonCreateModal();
      resetKasbonForm();
      alert('Pengajuan kasbon berhasil dikirim ke pengawas.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const isSavingDraft =
    draftAutoSaveStatus === 'saving' || saveDraftMutation.isPending;

  const handleSimpanDraftKasbon = async () => {
    if (isSavingDraft) return;
    setDraftAutoSaveStatus('saving');
    const ok = await persistKasbonDraft(materialSuppliers, { silent: false, syncForm: true });
    if (ok) {
      alert('Draft kasbon berhasil disimpan. Anda bisa lanjut kumpulkan bon lain lalu ajukan.');
    } else {
      setDraftAutoSaveStatus((status) => (status === 'saving' ? 'idle' : status));
    }
  };

  const handleSelectTukang = (key: string, tukangId: number | '') => {
    const selected = tukangList.find((t) => t.id === Number(tukangId));
    setUpahBaris((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              tukangId,
              nik: selected?.nik ?? row.nik,
              nama: selected?.nama ?? row.nama,
            }
          : row,
      ),
    );
  };

  const kasbonCreateModalBody = (
    <div className="space-y-5">
      {hasActiveDraft ? (
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">D</div>
          <p className="text-xs text-blue-800 leading-relaxed">
            Ada <strong>draft kasbon</strong> tersimpan. Isi form sudah dimuat — klik <strong>Simpan Draft</strong> setelah ubah data, atau <strong>Ajukan</strong> jika sudah lengkap.
          </p>
        </div>
      ) : (
        <>
        </>
      )}
      {draftAutoSaveStatus === 'saving' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Loader2 size={13} className="animate-spin shrink-0 text-slate-500" />
          <p className="text-xs text-slate-500">Menyimpan draft...</p>
        </div>
      )}
      {draftAutoSaveStatus === 'saved' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-semibold">Draft berhasil disimpan.</p>
        </div>
      )}
      {draftAutoSaveStatus === 'error' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          <p className="text-xs text-red-700 font-semibold">Gagal simpan draft. Periksa isian bon lalu coba lagi.</p>
        </div>
      )}
      {!pengurangCheck.allowed && pengurangCheck.reason && (
        <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {pengurangCheck.reason}
        </p>
      )}

      {mandorRekeningSelect}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
        <button
          type="button"
          disabled={hasActiveDraft}
          onClick={() => setKasbonInputMode('detail')}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
            kasbonInputMode === 'detail'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          } disabled:opacity-50`}
        >
          Bon &amp; supplier (normal)
        </button>
        <button
          type="button"
          disabled={hasActiveDraft}
          onClick={() => setKasbonInputMode('legacy')}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
            kasbonInputMode === 'legacy'
              ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-200'
              : 'text-slate-500 hover:text-slate-700'
          } disabled:opacity-50`}
          title={
            hasActiveDraft
              ? 'Selesaikan atau hapus draft material terlebih dahulu'
              : undefined
          }
        >
          Input data lama (sementara)
        </button>
      </div>
      

      {spk.kavlingItems.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            Kavling SPK
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[...spk.kavlingItems]
              .sort(compareKavlingBlokUnit)
              .map((k) => (
                <span
                  key={k.kavlingId}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-sm"
                >
                  {k.blok}-{k.nomorUnit}
                </span>
              ))}
          </div>
        </div>
      )}

      {kasbonInputMode === 'legacy' ? (
        <LegacyKasbonCreateEditor
          rows={legacyCreateRows}
          setRows={setLegacyCreateRows}
          idPrefix={kasbonOnly ? 'kasbon-quick-legacy' : 'kasbon-create-legacy'}
        />
      ) : (
        <>
      <CollapsibleDetailSection
        title="Material"
        className="border-orange-200"
        badge={
          materialTotalPreview > 0 ? (
            <span className="text-[10px] font-bold text-orange-800 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full tabular-nums">
              {formatRupiah(materialTotalPreview)}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-400">-</span>
          )
        }
      >
        <MaterialSuppliersEditor
          suppliers={materialSuppliers}
          setSuppliers={setMaterialSuppliers}
          idPrefix={kasbonOnly ? 'kasbon-quick' : 'kasbon-create'}
        />
      </CollapsibleDetailSection>

      <CollapsibleDetailSection
        title="Upah Tukang"
        className="border-teal-200"
        badge={
          upahTotalPreview > 0 ? (
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full tabular-nums">
              {formatRupiah(upahTotalPreview)}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-400">-</span>
          )
        }
      >
        <UpahTukangEditor
          upahTanggalDari={upahTanggalDari}
          setUpahTanggalDari={setUpahTanggalDari}
          upahTanggalSampai={upahTanggalSampai}
          setUpahTanggalSampai={setUpahTanggalSampai}
          upahBaris={upahBaris}
          setUpahBaris={setUpahBaris}
          upahTotalNominal={upahTotalNominal}
          setUpahTotalNominal={setUpahTotalNominal}
          tukangList={tukangList}
          onSelectTukang={handleSelectTukang}
          idPrefix={kasbonOnly ? 'kasbon-quick' : 'kasbon-create'}
        />
      </CollapsibleDetailSection>
        </>
      )}

      {kasbonInputMode === 'legacy' ? (
        <div className="space-y-1 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <FileInput
            label="Invoice material (PDF)"
            accept="application/pdf,.pdf"
            onChange={(e) => setLegacyKasbonInvoiceFile(e.target.files?.[0] ?? null)}
          />
          <FileInput
            label="Dokumen material (PDF)"
            accept="application/pdf,.pdf"
            onChange={(e) => setLegacyKasbonMaterialDocFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-[11px] text-amber-800/90 leading-relaxed px-1">
            Dokumen material wajib diunggah pada setiap pengajuan material. Material yang sudah
            dibayar tidak dapat diajukan kembali untuk reimburs.
          </p>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          {(materialSuppliers.some(supplierIsUsed) || materialTotalPreview > 0) && (
            <>
              <FileInput
                label="Invoice material (PDF)"
                accept="application/pdf,.pdf"
                onChange={(e) => setMaterialInvoiceFile(e.target.files?.[0] ?? null)}
              />
              <FileInput
                label="Dokumen material (PDF)"
                accept="application/pdf,.pdf"
                onChange={(e) => setMaterialDokumenFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-[11px] text-slate-600 leading-relaxed px-1 -mt-2">
                Dokumen material wajib diunggah pada setiap pengajuan material. Material yang sudah
                dibayar tidak dapat diajukan kembali untuk reimburs.
              </p>
            </>
          )}
          {(upahTotalPreview > 0 ||
            upahBaris.some((r) => r.nik.trim() || r.nama.trim())) && (
            <FileInput
              label="Invoice upah mandor (PDF)"
              accept="application/pdf,.pdf"
              onChange={(e) => setUpahInvoiceFile(e.target.files?.[0] ?? null)}
            />
          )}
        </div>
      )}

      {pengurangCheck.targetTermin && activeCreateTotal > 0 && (
        <PengurangPlafonBanner
          nilaiKontrak={spk.nilaiKontrak}
          rows={pengurangRows}
          termin={pengurangCheck.targetTermin}
          additionalNominal={activeCreateTotal}
          terminStatus={terminStatus}
          terminScheme={terminScheme}
          spkProgress={spk.progress}
        />
      )}

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total diajukan</p>
            <p className="text-base font-black text-slate-900 mt-0.5">{formatRupiah(activeCreateTotal)}</p>
            {kasbonInputMode === 'detail' && materialTotalPreview > 0 && upahTotalPreview > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Material {formatRupiah(materialTotalPreview)} + Upah {formatRupiah(upahTotalPreview)}
              </p>
            )}
            {kasbonInputMode === 'legacy' && legacyCreateTotal > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                {legacyCreateRows.filter((r) => r.keterangan.trim() && r.nominal !== '').length} baris kasbon
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeKasbonCreateModal}
            className="px-4 py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          {kasbonInputMode === 'detail' && (
          <button
            type="button"
            disabled={
              isSavingDraft ||
              submitDraftMutation.isPending ||
              createMutation.isPending ||
              deleteMutation.isPending
            }
            onClick={() => void handleSimpanDraftKasbon()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-slate-800 text-white rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {isSavingDraft ? (
              <>
                <Loader2 size={15} className="animate-spin shrink-0" />
                Menyimpan...
              </>
            ) : (
              'Simpan Draft'
            )}
          </button>
          )}
          <button
            type="button"
            disabled={
              createMutation.isPending ||
              isSavingDraft ||
              submitDraftMutation.isPending ||
              deleteMutation.isPending ||
              kasbonCreateOverPlafon ||
              !pengurangCheck.allowed
            }
            onClick={handleAjukanKasbon}
            title={
              kasbonCreateOverPlafon
                ? kasbonCreatePlafonValidation.reason ?? 'Total kasbon melebihi sisa plafon termin'
                : !pengurangCheck.allowed
                  ? pengurangCheck.reason
                  : undefined
            }
            className="px-5 py-2.5 text-sm font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm hover:shadow-orange-200 hover:shadow-md active:scale-95"
          >
            Ajukan
          </button>
        </div>
      </div>
    </div>
  );

  const rowHasBukti = (row: SpkPembayaranData) =>
    !!row.buktiPembayaran || (row.buktiPembayaranList?.length ?? 0) > 0;

  const isPaidPengurangan = (row: SpkPembayaranData) => row.status === 'SUDAH_DIBAYAR';

  const isDraftPengurangan = (row: SpkPembayaranData) => row.status === 'DRAFT';

  const getPenguranganStatusLabel = (row: SpkPembayaranData) => {
    if (row.status === 'DRAFT') return 'Draft';
    if (row.status === 'SUDAH_DIBAYAR') return 'Terbayar';
    if (row.status === 'MENUNGGU_PERSETUJUAN') return 'Menunggu Pengawas';
    return 'Menunggu Finance';
  };

  /** Selaras dengan badge UI: bukan Draft/Terbayar = tampil "Menunggu". */
  const isMenungguPengurangan = (row: SpkPembayaranData) =>
    !isPaidPengurangan(row) && !isDraftPengurangan(row);

  const getPenguranganRowBlockReason = (row: SpkPembayaranData): string | null => {
    if (!canManagePengurangan) return 'Anda tidak memiliki akses mengubah pengajuan ini.';
    if (isPaidPengurangan(row)) return 'Pengajuan sudah terbayar.';
    if (rowHasBukti(row)) return 'Sudah ada bukti transfer — tidak dapat diubah/dihapus.';
    if (isDraftPengurangan(row)) return 'Draft hanya dapat dihapus, tidak diedit.';
    return null;
  };

  const getPenguranganRowActions = (row: SpkPembayaranData) => {
    if (!canManagePengurangan || rowHasBukti(row) || isPaidPengurangan(row)) {
      return { editable: false, deletable: false };
    }
    if (isMenungguPengurangan(row)) {
      return { editable: true, deletable: true };
    }
    if (isDraftPengurangan(row)) {
      const isOwnDraft = Number(row.diajukanOlehId) === Number(user?.id);
      return {
        editable: false,
        deletable: isAssignedMandor ? isOwnDraft : canUpdateSpk,
      };
    }
    return { editable: false, deletable: false };
  };

  const handleHapusPengurangan = async (
    row: SpkPembayaranData,
    label: 'kasbon' | 'upah',
  ) => {
    if (
      !window.confirm(
        `Hapus pengajuan ${label} ${formatRupiah(row.nominal)}?\nHanya dapat dihapus jika belum terbayar dan belum ada bukti transfer.`,
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id: row.id, spkId: spk.id });
      alert(`Pengajuan ${label} berhasil dihapus.`);
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const openEditKasbon = (row: SpkPembayaranData) => {
    setEditingKasbon(row);
    const batch = isBatchKasbon(row);
    setEditingKasbonIsBatch(batch);
    if (batch) {
      setMaterialSuppliers(kasbonBarisToSuppliers(row.kasbonBaris));
    } else {
      setKasbonLegacyKeterangan(row.keterangan ?? '');
      setKasbonLegacyNominal(row.nominal);
      setKasbonLegacyTanggalPo(toDateInputValue(row.tanggalPo ?? row.createdAt));
    }
    setKasbonEditModalOpen(true);
  };

  const closeEditKasbonModal = () => {
    setKasbonEditModalOpen(false);
    setEditingKasbon(null);
    setEditingKasbonIsBatch(false);
    setMaterialSuppliers([newMaterialSupplier()]);
  };

  const openEditUpah = (row: SpkPembayaranData) => {
    setEditingUpah(row);
    setUpahTanggalDari(toDateInputValue(row.tanggalDari ?? row.createdAt));
    setUpahTanggalSampai(toDateInputValue(row.tanggalSampai ?? row.createdAt));
    const rows = upahBarisFromPembayaran(row);
    setUpahBaris(rows.length ? rows : [newUpahBaris()]);
    setUpahTotalNominal(row.nominal);
    setUpahEditModalOpen(true);
  };

  const closeEditUpahModal = () => {
    setUpahEditModalOpen(false);
    setEditingUpah(null);
  };

  const handleSimpanEditUpah = async () => {
    if (!editingUpah) return;
    const barisParsed = parseUpahBarisBody(upahBaris);
    if (!barisParsed.ok) {
      alert(barisParsed.message);
      return;
    }
    const baris = barisParsed.data;
    if (!upahTanggalDari || !upahTanggalSampai) {
      alert('Periode tanggal wajib diisi.');
      return;
    }
    if (upahTanggalDari > upahTanggalSampai) {
      alert('Tanggal dari tidak boleh setelah tanggal sampai.');
      return;
    }
    const total = upahTotalNominal === '' ? 0 : Number(upahTotalNominal);
    if (!total || total <= 0) {
      alert('Total upah tukang wajib diisi dan harus lebih dari 0.');
      return;
    }
    if (editingUpah.mengurangiTermin) {
      const plafon = validatePengurangTerminNominal(
        spk.nilaiKontrak,
        pengurangRows,
        editingUpah.mengurangiTermin,
        total,
        editingUpah.id,
        terminStatus,
        terminScheme,
        spk.progress,
      );
      if (!plafon.allowed) {
        alert(plafon.reason);
        return;
      }
    }
    if (
      !window.confirm(
        `Simpan perubahan upah?\nPeriode: ${upahTanggalDari} s/d ${upahTanggalSampai}\nTotal: ${formatRupiah(total)} (${baris.length} tukang)`,
      )
    ) {
      return;
    }
    try {
      await updateUpahMutation.mutateAsync({
        id: editingUpah.id,
        body: {
          tanggalDari: upahTanggalDari,
          tanggalSampai: upahTanggalSampai,
          baris,
          upahNominal: total,
        },
      });
      closeEditUpahModal();
      alert('Data upah berhasil diperbarui.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleSimpanEditKasbon = async () => {
    if (!editingKasbon) return;

    if (editingKasbonIsBatch) {
      const barisPreview = flattenMaterialSuppliers(materialSuppliers);
      if (!barisPreview) {
        alert(
          'Setiap supplier wajib memiliki nama, tanggal, dan minimal satu item dengan keterangan serta nominal.',
        );
        return;
      }
      const total = barisPreview.reduce((sum, b) => sum + b.nominal, 0);
      if (editingKasbon.mengurangiTermin) {
        const plafon = validatePengurangTerminNominal(
          spk.nilaiKontrak,
          pengurangRows,
          editingKasbon.mengurangiTermin,
          total,
          editingKasbon.id,
          terminStatus,
          terminScheme,
          spk.progress,
        );
        if (!plafon.allowed) {
          alert(plafon.reason);
          return;
        }
      }
      if (
        !window.confirm(
          `Simpan perubahan kasbon?\nTotal: ${formatRupiah(total)} (${barisPreview.length} item)`,
        )
      ) {
        return;
      }
      try {
        const uploadedSuppliers = await uploadMaterialSupplierFotos(materialSuppliers);
        const baris = flattenMaterialSuppliers(uploadedSuppliers);
        if (!baris) {
          alert(
            'Setiap supplier wajib memiliki nama, tanggal, dan minimal satu item dengan keterangan serta nominal.',
          );
          return;
        }
        await updateKasbonMutation.mutateAsync({
          id: editingKasbon.id,
          body: { kasbonBaris: baris },
        });
        closeEditKasbonModal();
        alert('Data kasbon berhasil diperbarui.');
      } catch (err: unknown) {
        alert(handleApiError(err).message);
      }
      return;
    }

    const nominal =
      kasbonLegacyNominal === '' ? 0 : Number(kasbonLegacyNominal);
    if (!kasbonLegacyKeterangan.trim()) {
      alert('Keterangan kasbon wajib diisi.');
      return;
    }
    if (!nominal || nominal <= 0) {
      alert('Nominal kasbon harus lebih dari 0.');
      return;
    }
    if (!kasbonLegacyTanggalPo) {
      alert('Tanggal PO wajib diisi.');
      return;
    }
    if (editingKasbon.mengurangiTermin) {
      const plafon = validatePengurangTerminNominal(
        spk.nilaiKontrak,
        pengurangRows,
        editingKasbon.mengurangiTermin,
        nominal,
        editingKasbon.id,
        terminStatus,
        terminScheme,
        spk.progress,
      );
      if (!plafon.allowed) {
        alert(plafon.reason);
        return;
      }
    }
    if (
      !window.confirm(
        `Simpan perubahan kasbon?\nKeterangan: ${kasbonLegacyKeterangan.trim()}\nTanggal PO: ${kasbonLegacyTanggalPo}\nNominal: ${formatRupiah(nominal)}`,
      )
    ) {
      return;
    }
    try {
      await updateKasbonMutation.mutateAsync({
        id: editingKasbon.id,
        body: {
          keterangan: kasbonLegacyKeterangan.trim(),
          nominal,
          tanggalPo: kasbonLegacyTanggalPo,
        },
      });
      closeEditKasbonModal();
      alert('Data kasbon berhasil diperbarui.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const renderStatus = (
    existing: SpkPembayaranData | undefined,
    jenis: SpkTerminPembayaranJenis,
    nominal: number,
  ) => {
    if (existing) {
      const paid = existing.status === 'SUDAH_DIBAYAR';
      return (
        <span
          className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
            paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {paid ? 'Terbayar' : 'Menunggu'}
        </span>
      );
    }
    if (nominal <= 0) {
      return (
        <span
          className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-700"
          title="Termin sudah lunas melalui pengurangan kasbon"
        >
          Lunas (by kasbon)
        </span>
      );
    }
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows, terminScheme);
    if (!canAjukan) {
      return <span className="text-slate-400 text-[10px]">Belum diajukan</span>;
    }
    if (!check.allowed) {
      return (
        <span className="text-[10px] text-amber-700" title={check.reason}>
          Belum bisa
        </span>
      );
    }
    return <span className="text-[10px] text-slate-500">Siap diajukan</span>;
  };

  const renderTerminAksi = (
    existing: SpkPembayaranData | undefined,
    jenis: SpkTerminPembayaranJenis,
    nominal: number,
  ) => {
    if (existing || !canAjukan || nominal <= 0) return null;
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows, terminScheme);
    if (!check.allowed) {
      return check.reason ? (
        <span className="text-[9px] text-amber-700 max-w-[140px] leading-tight">{check.reason}</span>
      ) : null;
    }
    return (
      <button
        type="button"
        disabled={createMutation.isPending}
        onClick={() => handleAjukanTermin(jenis)}
        className="px-2.5 py-1 text-[10px] font-bold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
      >
        Ajukan
      </button>
    );
  };

  const renderJenisBadge = (jenis: SpkPembayaranJenis, extra?: string) => (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getJenisUiColor(jenis, terminScheme).badge}`}
    >
      {jenis === 'KASBON'
        ? 'Kasbon'
        : jenis === 'UPAH'
          ? 'Upah'
          : jenisLabels[jenis as SpkTerminPembayaranJenis]?.split('(')[0]?.trim()}
      {extra ? ` · ${extra}` : ''}
    </span>
  );

  if (kasbonOnly) {
    return (
      <Modal
        isOpen={kasbonModalOpen}
        onClose={closeKasbonCreateModal}
        title={`Ajukan Kasbon — ${spk.noSpk}`}
        size="lg"
      >
        {isLoading || isKasbonDraftLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            {isKasbonDraftLoading ? 'Memuat draft kasbon...' : 'Memuat data pembayaran...'}
          </div>
        ) : (
          kasbonCreateModalBody
        )}
      </Modal>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        Memuat pembayaran...
      </div>
    );
  }

  return (
    <>
      {!historiOnly && (
        <>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                Termin &amp; Retensi
              </p>
            </div>
            {canAjukan && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={!pengurangCheck.allowed || createMutation.isPending}
                  title={pengurangCheck.reason}
                  onClick={openKasbonCreateModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 shadow-sm transition-all active:scale-95"
                >
                  <Plus size={11} />
                  Ajukan Kasbon
                </button>
              </div>
            )}
          </div>

          {mandorRekeningSelect}

          <div className="overflow-x-auto rounded-lg border border-slate-200 mb-3">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className={thClass}>Jenis</th>
                  <th className={thClass}>Nominal</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} w-16`}>Bukti</th>
                  <th className={`${thClass} w-24`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {terminJenisOrder.map((jenis) => {
                  const existing = pembayaranList.find((p) => p.jenis === jenis);
                  const nominal = calcSpkPembayaranNominal(jenis, spkInput, calcRows, terminScheme);
                  const colors = getJenisUiColor(jenis, terminScheme);
                  return (
                    <tr key={jenis} className={`hover:bg-slate-50/80 ${colors.row}`}>
                      <td className={tdClass}>
                        {renderJenisBadge(jenis)}
                      </td>
                      <td className={tdClass}>
                        <p className={`font-bold whitespace-nowrap ${colors.text}`}>
                          {formatRupiah(existing?.nominal ?? nominal)}
                        </p>
                        <KalkulasiSingkat jenis={jenis} spk={spk} pembayaranList={pembayaranList} />
                      </td>
                      <td className={tdClass}>{renderStatus(existing, jenis, nominal)}</td>
                      <td className={tdClass}>
                        {existing?.buktiPembayaran ? (
                          <BuktiFileThumbnail
                            url={existing.buktiPembayaran}
                            onClick={() => setPreviewUrl(existing.buktiPembayaran!)}
                            className="w-10 h-7"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className={tdClass}>{renderTerminAksi(existing, jenis, nominal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {historiOnly && kasbonItems.length === 0 && upahItems.length === 0 && (
        <p className="text-xs text-slate-500 italic py-2">Belum ada pengajuan kasbon.</p>
      )}

      {kasbonItems.length > 0 && (
        <div className="rounded-2xl border border-orange-200 overflow-hidden bg-white">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <p className="text-[11px] font-black text-orange-900 uppercase tracking-widest">
                Kasbon ({kasbonItems.length})
              </p>
            </div>
            <p className="text-[10px] text-orange-600 font-medium bg-orange-100 px-2 py-0.5 rounded-full">
              Per supplier &amp; bon
            </p>
          </div>
      
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[680px]">
              <thead>
                <tr>
                  <th className={thClass}>Rincian belanja</th>
                  <th className={thClass}>Tanggal PO</th>
                  <th className={thClass}>Mengurangi</th>
                  <th className={thClass}>Nominal</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} w-16`}>Bukti</th>
                  {canManagePengurangan && <th className={`${thClass} w-20`}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {kasbonItems.map((row) => {
                  const paid = isPaidPengurangan(row);
                  const isDraft = isDraftPengurangan(row);
                  const { editable, deletable } = getPenguranganRowActions(row);
                  const blockReason = getPenguranganRowBlockReason(row);
                  const batch = isBatchKasbon(row);
                  const buktiCount =
                    (row.buktiPembayaranList?.length ?? 0) || (row.buktiPembayaran ? 1 : 0);
                  const tanggalSummary = batch
                    ? kasbonTanggalPoSummary(row.kasbonBaris!)
                    : {
                        label: formatDate(row.tanggalPo ?? row.createdAt),
                        title: undefined as string | undefined,
                      };
                  return (
                    <tr key={row.id} className={JENIS_UI_COLOR.KASBON.row}>
                      <td className={`${tdClass} align-top`}>
                        {batch && row.kasbonBaris?.length ? (
                          <KasbonBatchDetailView baris={row.kasbonBaris} />
                        ) : (
                          <span className="font-medium text-slate-800">{row.keterangan}</span>
                        )}
                        {buktiCount > 0 && paid && batch && (
                          <p className="text-[9px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                            {buktiCount} bukti transfer 
                          </p>
                        )}
                      </td>
                      <td
                        className={`${tdClass} whitespace-nowrap text-slate-600`}
                        title={tanggalSummary.title}
                      >
                        {tanggalSummary.label}
                        
                      </td>
                      <td className={tdClass}>
                        <PengurangMengurangiCell
                          rowId={row.id}
                          nilaiKontrak={spk.nilaiKontrak}
                          pengurangRows={pengurangRows}
                          terminStatus={terminStatus}
                          fallbackTermin={row.mengurangiTermin}
                          terminScheme={terminScheme}
                        />
                      </td>
                      <td className={`${tdClass} font-bold ${JENIS_UI_COLOR.KASBON.text}`}>
                        {formatRupiah(row.nominal)}
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            isDraft
                              ? 'bg-slate-100 text-slate-700'
                              : paid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {getPenguranganStatusLabel(row)}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {row.buktiPembayaran ? (
                          <BuktiFileThumbnail
                            url={row.buktiPembayaran}
                            onClick={() => setPreviewUrl(row.buktiPembayaran!)}
                            className="w-10 h-7"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      {canManagePengurangan && (
                        <td className={tdClass}>
                          {editable || deletable ? (
                            <div className="flex items-center gap-0.5">
                              {editable && (
                                <button
                                  type="button"
                                  title="Edit kasbon"
                                  onClick={() => openEditKasbon(row)}
                                  className="p-1 rounded text-blue-600 hover:bg-blue-50"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {deletable && (
                                <button
                                  type="button"
                                  title="Hapus kasbon"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => handleHapusPengurangan(row, 'kasbon')}
                                  className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span
                              className="text-[9px] text-slate-500 leading-tight max-w-[72px] inline-block"
                              title={blockReason ?? undefined}
                            >
                              {isMenungguPengurangan(row) && blockReason
                                ? blockReason.includes('bukti')
                                  ? 'Ada bukti'
                                  : 'Terkunci'
                                : '—'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {upahItems.length > 0 && (
        <div className="rounded-2xl border border-teal-200 overflow-hidden bg-white mt-4">
          <div className="px-4 py-3 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <p className="text-[11px] font-black text-teal-900 uppercase tracking-widest">
              Upah Tukang ({upahItems.length})
            </p>
          </div>
      
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[860px]">
              <thead>
                <tr>
                  <th className={thClass}>Periode</th>
                  <th className={thClass}>Tukang</th>
                  <th className={thClass}>Mengurangi</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} w-16`}>Bukti</th>
                  {canManagePengurangan && <th className={`${thClass} w-20`}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {upahItems.map((row) => {
                  const paid = isPaidPengurangan(row);
                  const isDraft = isDraftPengurangan(row);
                  const { editable, deletable } = getPenguranganRowActions(row);
                  const blockReason = getPenguranganRowBlockReason(row);
                  const buktiCount =
                    (row.buktiPembayaranList?.length ?? 0) || (row.buktiPembayaran ? 1 : 0);
                  return (
                    <tr key={row.id} className={JENIS_UI_COLOR.UPAH.row}>
                      <td className={`${tdClass} whitespace-nowrap text-slate-600`}>
                        {formatDate(row.tanggalDari ?? row.createdAt)} –{' '}
                        {formatDate(row.tanggalSampai ?? row.createdAt)}
                      </td>
                      <td className={`${tdClass} max-w-[280px]`}>
                        <ul className="space-y-0.5">
                          {(row.upahBaris ?? []).map((b) => (
                            <li key={b.id} className="text-[10px] leading-tight">
                              <span className="font-semibold text-slate-800">{b.nama}</span>
                              <span className="text-slate-500"> · {b.nik}</span>
                            </li>
                          ))}
                        </ul>
                        {buktiCount > 0 && paid && (
                          <p className="text-[9px] text-slate-500 mt-1">
                            {buktiCount} bukti transfer 
                          </p>
                        )}
                      </td>
                      <td className={tdClass}>
                        <PengurangMengurangiCell
                          rowId={row.id}
                          nilaiKontrak={spk.nilaiKontrak}
                          pengurangRows={pengurangRows}
                          terminStatus={terminStatus}
                          fallbackTermin={row.mengurangiTermin}
                          terminScheme={terminScheme}
                        />
                      </td>
                      <td className={`${tdClass} font-bold ${JENIS_UI_COLOR.UPAH.text}`}>
                        {formatRupiah(row.nominal)}
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            isDraft
                              ? 'bg-slate-100 text-slate-700'
                              : paid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {getPenguranganStatusLabel(row)}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {row.buktiPembayaran ? (
                          <BuktiFileThumbnail
                            url={row.buktiPembayaran}
                            onClick={() => setPreviewUrl(row.buktiPembayaran!)}
                            className="w-10 h-7"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      {canManagePengurangan && (
                        <td className={tdClass}>
                          {editable || deletable ? (
                            <div className="flex items-center gap-0.5">
                              {editable && (
                                <button
                                  type="button"
                                  title="Edit upah"
                                  onClick={() => openEditUpah(row)}
                                  className="p-1 rounded text-blue-600 hover:bg-blue-50"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {deletable && (
                                <button
                                  type="button"
                                  title="Hapus upah"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => handleHapusPengurangan(row, 'upah')}
                                  className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span
                              className="text-[9px] text-slate-500 leading-tight max-w-[72px] inline-block"
                              title={blockReason ?? undefined}
                            >
                              {isMenungguPengurangan(row) && blockReason
                                ? blockReason.includes('bukti')
                                  ? 'Ada bukti'
                                  : 'Terkunci'
                                : '—'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!historiOnly && pengurangCheck.targetTermin && canAjukan && (() => {
        const targets = getKasbonTargetSteps(getSpkTerminScheme(terminScheme));
        const targetIndex = targets.findIndex((step) => step.jenis === pengurangCheck.targetTermin);
        const spillLabel =
          targetIndex >= 0 && targetIndex < targets.length - 1
            ? kasbonTargetLabels[targets[targetIndex + 1]!.jenis]
            : null;
        const firstTargetPaid = pengurangCheck.targetTermin
          ? terminStatus[targets[0]!.jenis]
          : false;

        return (
        <p className="text-[10px] text-slate-500 mt-2">
          Kasbon/upah berikutnya mengurangi{' '}
          <span className="font-semibold text-orange-700">
            {kasbonTargetLabels[pengurangCheck.targetTermin]}
          </span>
          {spillLabel && targetIndex === 0 && (
            <span className="text-slate-400"> (kelebihan otomatis mengurangi {spillLabel})</span>
          )}
          {targetIndex > 0 && !firstTargetPaid && (
              <span className="text-slate-400">
                {' '}
                (plafon {kasbonTargetLabels[targets[0]!.jenis]} sudah habis)
              </span>
            )}
          {pengurangCheck.sisaPengurang != null && (
            <>
              {' '}
              · Sisa plafon:{' '}
              <span className="font-semibold text-slate-700">
                {formatRupiah(pengurangCheck.sisaPengurang)}
              </span>
            </>
          )}
          .
        </p>
        );
      })()}

      <Modal
        isOpen={kasbonModalOpen}
        onClose={closeKasbonCreateModal}
        title="Ajukan Kasbon"
        size="lg"
      >
        {isKasbonDraftLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Memuat draft kasbon...
          </div>
        ) : (
          kasbonCreateModalBody
        )}
      </Modal>

      <Modal
        isOpen={kasbonEditModalOpen}
        onClose={closeEditKasbonModal}
        title={editingKasbonIsBatch ? 'Edit Kasbon (batch)' : 'Edit Kasbon'}
        size={editingKasbonIsBatch ? 'lg' : 'md'}
      >
        <div className="space-y-4">
          {editingKasbon?.mengurangiTermin && (
            <>
              <p className="text-xs text-orange-800 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                Kasbon ini mengurangi nominal{' '}
                <strong>{kasbonTargetLabels[editingKasbon.mengurangiTermin]}</strong>.
                Mengurangi termin tidak dapat diubah dari sini.
              </p>
              <PengurangPlafonBanner
                nilaiKontrak={spk.nilaiKontrak}
                rows={pengurangRows}
                termin={editingKasbon.mengurangiTermin}
                additionalNominal={
                  editingKasbonIsBatch ? materialTotalPreview : kasbonLegacyEditTotal
                }
                excludeId={editingKasbon.id}
                terminStatus={terminStatus}
                terminScheme={terminScheme}
              />
            </>
          )}
          {editingKasbonIsBatch ? (
            <MaterialSuppliersEditor
              suppliers={materialSuppliers}
              setSuppliers={setMaterialSuppliers}
              idPrefix="kasbon-edit"
            />
          ) : (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal PO</label>
                <input
                  type="date"
                  value={kasbonLegacyTanggalPo}
                  onChange={(e) => setKasbonLegacyTanggalPo(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan</label>
                <textarea
                  value={kasbonLegacyKeterangan}
                  onChange={(e) => setKasbonLegacyKeterangan(e.target.value)}
                  className="text-black mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[72px]"
                />
              </div>
              <div>
                <CurrencyInput
                  label="Nominal"
                  name="kasbonLegacyNominal"
                  value={kasbonLegacyNominal === '' ? 0 : kasbonLegacyNominal}
                  onValueChange={(_, value) =>
                    setKasbonLegacyNominal(value > 0 ? value : '')
                  }
                  placeholder="0"
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeEditKasbonModal}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={updateKasbonMutation.isPending || kasbonEditOverPlafon}
              onClick={handleSimpanEditKasbon}
              title={
                kasbonEditOverPlafon
                  ? 'Total kasbon melebihi sisa plafon termin'
                  : undefined
              }
              className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={upahEditModalOpen}
        onClose={closeEditUpahModal}
        title="Edit Upah Tukang"
        size="lg"
      >
        <div className="space-y-4">
          {editingUpah?.mengurangiTermin && (
            <>
              <p className="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                Upah ini mengurangi nominal{' '}
                <strong>{kasbonTargetLabels[editingUpah.mengurangiTermin]}</strong>.
              </p>
              <PengurangPlafonBanner
                nilaiKontrak={spk.nilaiKontrak}
                rows={pengurangRows}
                termin={editingUpah.mengurangiTermin}
                additionalNominal={upahTotalPreview}
                excludeId={editingUpah.id}
                terminStatus={terminStatus}
                terminScheme={terminScheme}
              />
            </>
          )}
          <UpahTukangEditor
            upahTanggalDari={upahTanggalDari}
            setUpahTanggalDari={setUpahTanggalDari}
            upahTanggalSampai={upahTanggalSampai}
            setUpahTanggalSampai={setUpahTanggalSampai}
            upahBaris={upahBaris}
            setUpahBaris={setUpahBaris}
            upahTotalNominal={upahTotalNominal}
            setUpahTotalNominal={setUpahTotalNominal}
            tukangList={tukangList}
            onSelectTukang={handleSelectTukang}
            idPrefix="upah-edit"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeEditUpahModal}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={updateUpahMutation.isPending || upahEditOverPlafon}
              onClick={handleSimpanEditUpah}
              title={
                upahEditOverPlafon ? 'Total upah melebihi sisa plafon termin' : undefined
              }
              className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!terminAjukanModal}
        onClose={closeTerminAjukanModal}
        title={
          terminAjukanModal
            ? `Ajukan ${jenisLabels[terminAjukanModal]}`
            : 'Ajukan Termin'
        }
        size="md"
      >
        {terminAjukanModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Nominal diajukan:{' '}
              <strong className="text-slate-900">
                {formatRupiah(
                  canRequestSpkPembayaran(
                    terminAjukanModal,
                    spkInput,
                    statusRows,
                    terminScheme,
                  ).nominal,
                )}
              </strong>
            </p>
            <FileInput
              label="Invoice (PDF)"
              accept="application/pdf,.pdf"
              onChange={(e) => setTerminInvoiceFile(e.target.files?.[0] ?? null)}
            />
            {terminAjukanModal !== 'RETENSI' && (
              <>
                <FileInput
                  label="Berita Acara / BA (PDF)"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setTerminBaFile(e.target.files?.[0] ?? null)}
                />
                <FileInput
                  label={`Progress SPK — ${jenisLabels[terminAjukanModal]} (PDF)`}
                  accept="application/pdf,.pdf"
                  onChange={(e) => setTerminProgressFile(e.target.files?.[0] ?? null)}
                />
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeTerminAjukanModal}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => void handleConfirmAjukanTermin()}
                className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Ajukan
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Bukti Pembayaran"
        size="lg"
      >
        {previewUrl && (
          <div className="flex justify-center">
            {isBuktiPdfUrl(previewUrl) ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 text-red-600 font-bold"
              >
                <FileText size={48} />
                Buka PDF
              </a>
            ) : (
              <img src={previewUrl} alt="Bukti pembayaran" className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default SpkPembayaranPanel;
