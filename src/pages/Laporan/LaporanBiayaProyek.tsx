import { Fragment, useMemo, useState } from 'react';
import {
  Receipt,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import { useGetBiayaProyekReport } from '../../hooks/queries/useBiayaProyekReport';
import type { BiayaProyekReportParams } from '../../services/report.service';
import { useGetSpk } from '../../hooks/queries/useSpk';
import { useDefaultPerumahanId } from '../../hooks/useDefaultPerumahanId';
import { DEFAULT_PERUMAHAN_NAME } from '../../constants/perumahan';
import { kavlingService } from '../../services/kavling.service';
import { handleApiError } from '../../utils/errorHandler';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { SPK_PEMBAYARAN_JENIS_LABEL } from '../../utils/spkPembayaran';

function jenisLabel(jenis: string): string {
  return SPK_PEMBAYARAN_JENIS_LABEL[jenis as keyof typeof SPK_PEMBAYARAN_JENIS_LABEL] ?? jenis;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status (non draft)' },
  { value: 'SUDAH_DIBAYAR', label: 'Sudah Dibayar' },
  { value: 'MENUNGGU_PEMBAYARAN', label: 'Menunggu Pembayaran' },
  { value: 'MENUNGGU_PERSETUJUAN', label: 'Menunggu Persetujuan Pengawas' },
  { value: 'MENUNGGU_APPROVAL_ADMIN', label: 'Menunggu Persetujuan Admin' },
];

const LaporanBiayaProyek = () => {
  const [filters, setFilters] = useState<BiayaProyekReportParams>({
    pembayaranStatus: 'ALL',
  });
  const [appliedFilters, setAppliedFilters] = useState<BiayaProyekReportParams>({
    pembayaranStatus: 'ALL',
  });
  const [expandedSpk, setExpandedSpk] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const { perumahanId: defaultPerumahanId, isLoading: loadingPerumahan } =
    useDefaultPerumahanId();
  const effectiveFilters = useMemo(
    () =>
      defaultPerumahanId
        ? { ...appliedFilters, perumahanId: defaultPerumahanId }
        : appliedFilters,
    [appliedFilters, defaultPerumahanId],
  );

  const { data: spkList = [] } = useGetSpk({ limit: 500 });
  const { data: report, isLoading, isFetching } = useGetBiayaProyekReport(
    effectiveFilters,
    !!defaultPerumahanId,
  );

  const spkOptions = useMemo(
    () =>
      spkList.map((s) => ({
        value: String(s.id),
        label: `${s.noSpk} — ${s.judulPekerjaan}`,
      })),
    [spkList],
  );

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filters });
  };

  const handleExportPengeluaran = async () => {
    setIsExporting(true);
    try {
      await kavlingService.exportPengeluaranExcel({
        perumahanId: defaultPerumahanId,
        search: appliedFilters.blok ? appliedFilters.blok : undefined,
      });
    } catch (error: unknown) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      setIsExporting(false);
    }
  };

  if (loadingPerumahan || (isLoading && !report)) return <PageLoader />;

  const summary = report?.summary;

  return (
    <ReportPageLayout
      title="Laporan Biaya Proyek"
      subtitle="Pengeluaran material (kasbon), upah tukang, dan pembayaran SPK per unit"
      icon={Receipt}
      actions={
        <button
          type="button"
          onClick={handleExportPengeluaran}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors"
        >
          {isExporting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          Export Pengeluaran Kavling
        </button>
      }
    >
      <section>
        <button
          type="button"
          onClick={() => setIsFilterOpen((v) => !v)}
          className="flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-700 mb-3"
        >
          <Filter size={14} />
          Filter Laporan
          {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {isFilterOpen && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
            <p className="text-[11px] text-slate-500 mb-3">
              Perumahan: <span className="font-bold text-slate-700">{DEFAULT_PERUMAHAN_NAME}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="SPK"
                value={filters.spkId ? String(filters.spkId) : ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    spkId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                options={spkOptions}
              />
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Blok
                </label>
                <input
                  type="text"
                  value={filters.blok ?? ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      blok: e.target.value || undefined,
                    }))
                  }
                  placeholder="Contoh: A"
                  className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filters.startDate ?? ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filters.endDate ?? ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value || undefined,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <Select
                label="Status Pembayaran"
                value={filters.pembayaranStatus ?? 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    pembayaranStatus: e.target.value as BiayaProyekReportParams['pembayaranStatus'],
                  }))
                }
                options={STATUS_OPTIONS}
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={isFetching}
                className="px-5 py-2.5 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors"
              >
                {isFetching ? 'Memuat...' : 'Terapkan Filter'}
              </button>
            </div>
          </div>
        )}
      </section>

      {summary && (
        <section>
          <ReportSectionLabel>Ringkasan</ReportSectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportMetricCard
              label="Jumlah SPK"
              value={summary.jumlahSpk}
              hint="SPK sesuai filter"
              valueClassName="text-slate-900 text-2xl"
            />
            <ReportMetricCard
              label="Nilai Kontrak"
              value={formatRupiah(summary.totalNilaiKontrak)}
              hint="Total nilai kontrak semua SPK"
              valueClassName="text-slate-900 text-xl"
            />
            <ReportMetricCard
              label="Sudah Dibayar"
              value={formatRupiah(summary.totalSudahDibayar)}
              hint="Pembayaran SPK status sudah dibayar"
              valueClassName="text-emerald-600 text-xl"
            />
            <ReportMetricCard
              label="Sisa Kontrak"
              value={formatRupiah(summary.totalSisa)}
              hint="Kontrak dikurangi yang sudah dibayar"
              valueClassName="text-amber-600 text-xl"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            {Object.entries(summary.byJenis).map(([jenis, nominal]) => (
              <ReportMetricCard
                key={jenis}
                compact
                className="bg-white"
                label={jenisLabel(jenis)}
                value={formatRupiah(nominal)}
                hint="Total per jenis pembayaran"
              />
            ))}
          </div>
        </section>
      )}

      {report && report.bySupplier.length > 0 && (
        <section>
          <ReportSectionLabel>Kasbon per Supplier</ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Transaksi
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.bySupplier.map((row) => (
                  <tr key={row.namaSupplier} className="border-b border-slate-50">
                    <td className="py-3 px-5 font-semibold text-slate-800">{row.namaSupplier}</td>
                    <td className="py-3 px-5 text-right text-slate-500">{row.jumlahTransaksi}</td>
                    <td className="py-3 px-5 text-right font-bold text-blue-600">
                      {formatRupiah(row.totalNominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report && report.byTukang.length > 0 && (
        <section>
          <ReportSectionLabel>Upah per Tukang</ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    NIK
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Transaksi
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Total Upah
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.byTukang.map((row) => (
                  <tr key={`${row.nik}-${row.nama}`} className="border-b border-slate-50">
                    <td className="py-3 px-5 font-semibold text-slate-800">{row.nama}</td>
                    <td className="py-3 px-5 text-slate-500">{row.nik}</td>
                    <td className="py-3 px-5 text-right text-slate-500">{row.jumlahTransaksi}</td>
                    <td className="py-3 px-5 text-right font-bold text-emerald-600">
                      {formatRupiah(row.totalNominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <ReportSectionLabel>Detail per SPK</ReportSectionLabel>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          {!report || report.items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Tidak ada data SPK untuk filter yang dipilih.
            </p>
          ) : (
            <table className="w-full text-[12px] min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="w-8 py-2.5 px-3" />
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    No. SPK
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Pekerjaan
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Mandor
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Kontrak
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Dibayar
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Sisa
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Kasbon
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Upah
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.items.map((spk) => {
                  const isExpanded = expandedSpk === spk.spkId;
                  const unitsLabel = spk.kavlingUnits
                    .map((u) => `${u.blok}-${u.nomorUnit}`)
                    .join(', ');

                  return (
                    <Fragment key={spk.spkId}>
                      <tr
                        className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer"
                        onClick={() => setExpandedSpk(isExpanded ? null : spk.spkId)}
                      >
                        <td className="py-2 px-3 text-slate-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {spk.noSpk}
                        </td>
                        <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate">
                          {spk.judulPekerjaan}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{spk.mandor.username}</td>
                        <td className="py-2 px-3 text-slate-500 max-w-[140px] truncate">
                          {unitsLabel || '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">
                          {formatRupiah(spk.nilaiKontrak)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600">
                          {formatRupiah(spk.nilaiSudahDibayarkan)}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-600">
                          {formatRupiah(spk.sisaNilaiKontrak)}
                        </td>
                        <td className="py-2 px-3 text-right text-blue-600">
                          {formatRupiah(spk.totalKasbon)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {formatRupiah(spk.totalUpah)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${spk.spkId}-detail`} className="bg-slate-50/40">
                          <td colSpan={10} className="py-2 px-4">
                            {spk.pembayaran.length === 0 ? (
                              <p className="text-[11px] text-slate-400 py-1">Belum ada pembayaran.</p>
                            ) : (
                              <table className="w-full text-[11px] border border-slate-100 rounded-lg overflow-hidden bg-white">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-400">
                                    <th className="text-left py-1.5 px-3 font-semibold">Jenis</th>
                                    <th className="text-left py-1.5 px-3 font-semibold">Status</th>
                                    <th className="text-left py-1.5 px-3 font-semibold">Tgl Bayar</th>
                                    <th className="text-right py-1.5 px-3 font-semibold">Nominal</th>
                                    <th className="text-left py-1.5 px-3 font-semibold">Rincian</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {spk.pembayaran.map((p) => (
                                    <tr key={p.id} className="border-t border-slate-50 align-top">
                                      <td className="py-1.5 px-3 font-semibold text-slate-800">
                                        {p.jenisLabel}
                                      </td>
                                      <td className="py-1.5 px-3 text-slate-500">
                                        {p.status.replace(/_/g, ' ')}
                                      </td>
                                      <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                                        {p.tanggalPembayaran ? formatDate(p.tanggalPembayaran) : '—'}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-semibold">
                                        {formatRupiah(p.nominal)}
                                      </td>
                                      <td className="py-1.5 px-3 text-slate-500">
                                        {p.kasbonBaris.length > 0 &&
                                          p.kasbonBaris.map((b) => (
                                            <div key={b.id} className="leading-snug">
                                              {b.namaSupplier} · {formatRupiah(b.nominal)}
                                              {b.keterangan ? ` · ${b.keterangan}` : ''}
                                            </div>
                                          ))}
                                        {p.upahBaris.length > 0 &&
                                          p.upahBaris.map((b) => (
                                            <div key={b.id} className="leading-snug">
                                              {b.nama} ({b.nik}) ·{' '}
                                              {b.nominal > 0 ? formatRupiah(b.nominal) : '—'}
                                            </div>
                                          ))}
                                        {p.kasbonBaris.length === 0 && p.upahBaris.length === 0 && '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </ReportPageLayout>
  );
};

export default LaporanBiayaProyek;
