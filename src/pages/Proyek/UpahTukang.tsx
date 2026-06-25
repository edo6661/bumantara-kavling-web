import { Fragment, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLoader from '../PageLoader';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Filter,
  HardHat,
  Users,
} from 'lucide-react';
import { formatDate, formatRupiah, formatTanpaDesimal } from '../../utils/formatters';
import { useGetSpkPembayaranList } from '../../hooks/queries/useSpkPembayaran';
import { useGetBankRekening } from '../../hooks/queries/useBankRekening';
import { formatShortNoSpk } from '../../utils/spk';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';

interface SpkUpahGroup {
  spkId: number;
  noSpk: string;
  judulPekerjaan: string;
  ksoLabel: string | null;
  nilaiKontrak: number;
  totalUpah: number;
  jumlahPengajuan: number;
  items: SpkPembayaranData[];
}

interface MandorUpahGroup {
  mandorId: number;
  mandorUsername: string;
  jumlahSpk: number;
  jumlahPengajuan: number;
  totalUpah: number;
  spkGroups: SpkUpahGroup[];
}

const thClass =
  'px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 whitespace-nowrap';
const tdClass = 'px-4 py-3 text-sm text-slate-800 align-middle border-b border-slate-100';

const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const formatKsoShortLabel = (atasNama: string): string => {
  const n = atasNama.trim().toLowerCase();
  if (n.includes('mahligai')) return 'BMS';
  if (n.includes('gajah')) return 'SGMP';
  return atasNama;
};

const formatPeriode = (row: SpkPembayaranData) => {
  if (row.tanggalDari && row.tanggalSampai) {
    return `${formatDate(row.tanggalDari)} – ${formatDate(row.tanggalSampai)}`;
  }
  return formatDate(row.createdAt);
};

const UpahTukang = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [expandedMandorIds, setExpandedMandorIds] = useState<Set<number>>(new Set());
  const [expandedSpkKeys, setExpandedSpkKeys] = useState<Set<string>>(new Set());
  const [expandedUpahIds, setExpandedUpahIds] = useState<Set<number>>(new Set());

  const now = new Date();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const ksoFilter = searchParams.get('kso') || '';
  const bulan = Number(searchParams.get('bulan')) || now.getMonth() + 1;
  const tahun = Number(searchParams.get('tahun')) || now.getFullYear();
  const limit = 500;

  const { data: bankList } = useGetBankRekening();
  const { data: response, isLoading } = useGetSpkPembayaranList({
    page,
    limit,
    jenis: 'UPAH',
    search: search || undefined,
    bankRekeningPtId: ksoFilter ? Number(ksoFilter) : undefined,
    bulan,
    tahun,
    status: 'SUDAH_DIBAYAR',
  });

  const items = useMemo(
    () =>
      (response?.items ?? []).filter(
        (row) => row.jenis === 'UPAH' && row.status === 'SUDAH_DIBAYAR',
      ),
    [response?.items],
  );
  const meta = response?.meta;

  const mandorGroups = useMemo((): MandorUpahGroup[] => {
    const mandorMap = new Map<number, MandorUpahGroup>();

    for (const row of items) {
      const mandorId = row.spk?.mandor?.id ?? 0;
      const mandorUsername = row.spk?.mandor?.username ?? '-';

      if (!mandorMap.has(mandorId)) {
        mandorMap.set(mandorId, {
          mandorId,
          mandorUsername,
          jumlahSpk: 0,
          jumlahPengajuan: 0,
          totalUpah: 0,
          spkGroups: [],
        });
      }

      const mandorGroup = mandorMap.get(mandorId)!;
      let spkGroup = mandorGroup.spkGroups.find((g) => g.spkId === row.spkId);

      if (!spkGroup) {
        spkGroup = {
          spkId: row.spkId,
          noSpk: row.spk?.noSpk ?? `#${row.spkId}`,
          judulPekerjaan: row.spk?.judulPekerjaan ?? '-',
          ksoLabel: row.spk?.bankRekeningPt?.atasNama
            ? formatKsoShortLabel(row.spk.bankRekeningPt.atasNama)
            : null,
          nilaiKontrak: row.spk?.nilaiKontrak ?? 0,
          totalUpah: 0,
          jumlahPengajuan: 0,
          items: [],
        };
        mandorGroup.spkGroups.push(spkGroup);
      }

      spkGroup.items.push(row);
      spkGroup.jumlahPengajuan += 1;
      spkGroup.totalUpah += row.nominal;
      mandorGroup.jumlahPengajuan += 1;
      mandorGroup.totalUpah += row.nominal;
    }

    return Array.from(mandorMap.values())
      .map((group) => ({
        ...group,
        jumlahSpk: group.spkGroups.length,
        spkGroups: group.spkGroups
          .map((spk) => ({
            ...spk,
            items: [...spk.items].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            ),
          }))
          .sort((a, b) => a.noSpk.localeCompare(b.noSpk, undefined, { numeric: true })),
      }))
      .sort((a, b) => a.mandorUsername.localeCompare(b.mandorUsername, 'id'));
  }, [items]);

  const summaryTotal = useMemo(
    () => items.reduce((sum, row) => sum + row.nominal, 0),
    [items],
  );

  const toggleMandor = (mandorId: number) => {
    setExpandedMandorIds((prev) => {
      const next = new Set(prev);
      if (next.has(mandorId)) next.delete(mandorId);
      else next.add(mandorId);
      return next;
    });
  };

  const toggleSpk = (key: string) => {
    setExpandedSpkKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleUpah = (id: number) => {
    setExpandedUpahIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') prev.delete(key);
        else prev.set(key, value);
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
    });
  };

  if (isLoading) return <PageLoader />;

  const bulanLabel = MONTH_OPTIONS.find((m) => m.value === bulan)?.label ?? String(bulan);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <HardHat size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Upah Tukang</h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                Rekap upah tukang yang sudah dibayar per SPK, dikelompokkan per mandor. Filter
                berdasarkan KSO (rekening PT), nomor SPK, dan periode bulan.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-teal-50/50 border-b border-teal-100 flex flex-wrap gap-4 text-xs">
          <div>
            <span className="text-slate-500">Periode: </span>
            <span className="font-bold text-teal-900">
              {bulanLabel} {tahun}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Sudah dibayar: </span>
            <span className="font-bold text-slate-800 tabular-nums">{items.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Total Upah: </span>
            <span className="font-bold text-teal-800 tabular-nums">
              {formatTanpaDesimal(summaryTotal)}
            </span>
          </div>
        </div>

        <div className="border-b border-slate-100">
          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between px-5 py-3 bg-slate-50"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Filter size={16} /> Filter
            </span>
            {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {isFilterExpanded && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">KSO</label>
                <select
                  value={ksoFilter}
                  onChange={(e) => updateParams({ kso: e.target.value || null })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Semua KSO</option>
                  {(bankList ?? []).map((bank) => (
                    <option key={bank.id} value={String(bank.id)}>
                      {formatKsoShortLabel(bank.atasNama)} — {bank.atasNama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan</label>
                <select
                  value={bulan}
                  onChange={(e) => updateParams({ bulan: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tahun</label>
                <input
                  type="number"
                  value={tahun}
                  min={2020}
                  max={2100}
                  onChange={(e) => updateParams({ tahun: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Cari No. SPK / Mandor
                </label>
                <input
                  type="text"
                  defaultValue={search}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateParams({ search: (e.target as HTMLInputElement).value || null });
                    }
                  }}
                  placeholder="Tekan Enter untuk cari..."
                  className="mt-1 w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {mandorGroups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Tidak ada upah tukang yang sudah dibayar pada periode {bulanLabel} {tahun}
            {ksoFilter ? ' untuk KSO yang dipilih' : ''}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse">
              <thead>
                <tr>
                  <th className={`${thClass} w-10`} aria-label="Buka detail" />
                  <th className={thClass}>Mandor</th>
                  <th className={`${thClass} text-center`}>SPK</th>
                  <th className={`${thClass} text-center`}>Pengajuan</th>
                  <th className={thClass}>Total Upah</th>
                </tr>
              </thead>
              <tbody>
                {mandorGroups.map((mandor) => {
                  const mandorExpanded = expandedMandorIds.has(mandor.mandorId);
                  return (
                    <Fragment key={mandor.mandorId}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          mandorExpanded ? 'bg-teal-50/80' : 'bg-white hover:bg-slate-50'
                        }`}
                        onClick={() => toggleMandor(mandor.mandorId)}
                      >
                        <td className={tdClass}>
                          {mandorExpanded ? (
                            <ChevronDown size={16} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={16} className="text-slate-400" />
                          )}
                        </td>
                        <td className={`${tdClass} font-bold text-slate-900`}>
                          {mandor.mandorUsername}
                        </td>
                        <td className={`${tdClass} text-center`}>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold tabular-nums">
                            {mandor.jumlahSpk}x
                          </span>
                        </td>
                        <td className={`${tdClass} text-center tabular-nums font-semibold`}>
                          {mandor.jumlahPengajuan}
                        </td>
                        <td className={`${tdClass} font-bold text-teal-800 tabular-nums`}>
                          {formatTanpaDesimal(mandor.totalUpah)}
                        </td>
                      </tr>

                      {mandorExpanded &&
                        mandor.spkGroups.map((spk) => {
                          const spkKey = `${mandor.mandorId}-${spk.spkId}`;
                          const spkExpanded = expandedSpkKeys.has(spkKey);
                          return (
                            <Fragment key={spkKey}>
                              <tr
                                className={`cursor-pointer transition-colors ${
                                  spkExpanded ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/80'
                                }`}
                                onClick={() => toggleSpk(spkKey)}
                              >
                                <td className="px-4 py-2 border-b border-slate-100" />
                                <td className="px-4 py-2 border-b border-slate-100" colSpan={4}>
                                  <div className="flex items-center gap-3 pl-4 border-l-2 border-teal-200">
                                    {spkExpanded ? (
                                      <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                    ) : (
                                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className="font-bold text-slate-900 text-sm"
                                          title={spk.noSpk}
                                        >
                                          SPK {formatShortNoSpk(spk.noSpk)}
                                        </span>
                                        {spk.ksoLabel && (
                                          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 rounded">
                                            {spk.ksoLabel}
                                          </span>
                                        )}
                                        <span className="text-xs text-slate-500 truncate">
                                          {spk.judulPekerjaan}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        {spk.jumlahPengajuan} pengajuan ·{' '}
                                        {formatTanpaDesimal(spk.totalUpah)} · Kontrak{' '}
                                        {formatTanpaDesimal(spk.nilaiKontrak)}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>

                              {spkExpanded &&
                                spk.items.map((row, idx) => {
                                  const upahExpanded = expandedUpahIds.has(row.id);
                                  const tukangList = row.upahBaris ?? [];
                                  return (
                                    <Fragment key={row.id}>
                                      <tr
                                        className="bg-teal-50/30 hover:bg-teal-50/50 cursor-pointer"
                                        onClick={() => toggleUpah(row.id)}
                                      >
                                        <td className="px-4 py-2 border-b border-teal-100/60" />
                                        <td className="px-4 py-2 border-b border-teal-100/60" colSpan={2}>
                                          <div className="flex items-center gap-2 pl-8">
                                            {upahExpanded ? (
                                              <ChevronDown size={12} className="text-teal-600" />
                                            ) : (
                                              <ChevronRight size={12} className="text-teal-600" />
                                            )}
                                            <span className="text-xs font-bold text-teal-900">
                                              #{idx + 1}
                                            </span>
                                            <span className="text-xs text-slate-600">
                                              {formatPeriode(row)}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                              · {tukangList.length} tukang
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-2 border-b border-teal-100/60 text-xs text-slate-600 whitespace-nowrap">
                                          {row.tanggalPembayaran
                                            ? formatDate(row.tanggalPembayaran)
                                            : '—'}
                                        </td>
                                        <td className="px-4 py-2 border-b border-teal-100/60 font-bold text-teal-800 text-sm tabular-nums">
                                          {formatRupiah(row.nominal)}
                                        </td>
                                      </tr>

                                      {upahExpanded && (
                                        <tr className="bg-white">
                                          <td colSpan={5} className="px-4 py-3 border-b border-slate-100">
                                            <div className="ml-12 rounded-xl border border-teal-200 overflow-hidden">
                                              <div className="px-3 py-2 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
                                                <Users size={14} className="text-teal-700" />
                                                <p className="text-[10px] font-bold text-teal-900 uppercase tracking-wide">
                                                  Detail Tukang
                                                </p>
                                                <p className="text-[10px] text-teal-700/80 ml-auto">
                                                  Diajukan {formatDate(row.createdAt)} oleh{' '}
                                                  {row.diajukanOleh.username}
                                                </p>
                                              </div>
                                              {tukangList.length === 0 ? (
                                                <p className="px-3 py-4 text-xs text-slate-400 italic">
                                                  Tidak ada data tukang.
                                                </p>
                                              ) : (
                                                <table className="w-full text-xs">
                                                  <thead>
                                                    <tr className="bg-teal-50/40 text-[10px] uppercase font-bold text-slate-500">
                                                      <th className="px-3 py-2 text-left">No</th>
                                                      <th className="px-3 py-2 text-left">Nama</th>
                                                      <th className="px-3 py-2 text-left">NIK</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {tukangList.map((tukang, tIdx) => (
                                                      <tr
                                                        key={tukang.id}
                                                        className="border-t border-teal-50 hover:bg-teal-50/20"
                                                      >
                                                        <td className="px-3 py-2 text-slate-400 tabular-nums">
                                                          {tIdx + 1}
                                                        </td>
                                                        <td className="px-3 py-2 font-medium text-slate-800">
                                                          {tukang.nama}
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-slate-600">
                                                          {tukang.nik}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  );
                                })}
                            </Fragment>
                          );
                        })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Halaman {meta.page} dari {meta.totalPages} · {meta.totalItems} pengajuan
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!meta.hasPrevPage}
                onClick={() => handlePageChange(page - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={!meta.hasNextPage}
                onClick={() => handlePageChange(page + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpahTukang;
