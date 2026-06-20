import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import PageLoader from '../PageLoader';
import Select from '../../components/shared/Select';
import ReportPageLayout, { ReportSectionLabel } from '../../components/laporan/ReportPageLayout';
import ReportMetricCard from '../../components/laporan/ReportMetricCard';
import { ProgressBreakdownChart } from '../../components/dashboard/DashboardCharts';
import { useGetProgressProyekReport } from '../../hooks/queries/useProgressProyekReport';
import type { ProgressProyekReportParams } from '../../services/report.service';
import { useGetSpk } from '../../hooks/queries/useSpk';
import { useDefaultPerumahanId } from '../../hooks/useDefaultPerumahanId';
import { DEFAULT_PERUMAHAN_NAME } from '../../constants/perumahan';
import { formatDate } from '../../utils/formatters';
import {
  groupByKategori,
  type PekerjaanInfraKategori,
} from '../../constants/pekerjaanInfra';

function progressToRange(progress: number): string {
  if (progress >= 100) return '100%';
  if (progress >= 75) return '75–99%';
  if (progress >= 50) return '50–74%';
  if (progress >= 25) return '25–49%';
  return '0–24%';
}

const LaporanProgressProyek = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProgressProyekReportParams>({});
  const [appliedFilters, setAppliedFilters] = useState<ProgressProyekReportParams>({});
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
  const [expandedInfraSpk, setExpandedInfraSpk] = useState<number | null>(null);
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
  const { data: report, isLoading, isFetching } = useGetProgressProyekReport(
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

  const progressBreakdown = useMemo(() => {
    if (!report?.items.length) return [];
    const order = ['0–24%', '25–49%', '50–74%', '75–99%', '100%'];
    const map = new Map<string, number>();
    for (const item of report.items) {
      const range = progressToRange(item.progress);
      map.set(range, (map.get(range) ?? 0) + 1);
    }
    return order
      .filter((r) => map.has(r))
      .map((range) => ({ range, count: map.get(range)! }));
  }, [report?.items]);

  if (loadingPerumahan || (isLoading && !report)) return <PageLoader />;

  const summary = report?.summary;

  return (
    <ReportPageLayout
      title="Laporan Progress Proyek"
      subtitle="Monitoring penyelesaian pembangunan per unit, blok, SPK, dan tahapan pekerjaan"
      icon={HardHat}
      actions={
        <button
          type="button"
          onClick={() => navigate('/proyek/progress')}
          className="px-4 py-2 text-[12px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
        >
          Buka Progress Lapangan
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
                    mandorId: undefined,
                  }))
                }
                options={[{ value: '', label: 'Semua SPK' }, ...spkOptions]}
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
                  Laporan Dari
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
                  Laporan Sampai
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
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Filter tanggal menampilkan unit yang memiliki laporan tahapan dalam periode tersebut.
            </p>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  const { mandorId: _, ...next } = filters;
                  setAppliedFilters(next);
                }}
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
          <ReportSectionLabel>Ringkasan Proyek</ReportSectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <ReportMetricCard
              label="Total Unit"
              value={summary.totalUnit}
              hint="Unit dengan data progress"
              valueClassName="text-slate-900 text-xl"
            />
            <ReportMetricCard
              label="Rata-rata"
              value={`${summary.rataRataProgress}%`}
              hint="Rata-rata % progress semua unit"
              valueClassName="text-blue-600 text-xl"
            />
            <ReportMetricCard
              label="Selesai"
              value={summary.unitSelesai}
              hint="Progress 100%"
              valueClassName="text-emerald-600 text-xl"
            />
            <ReportMetricCard
              label="Proses"
              value={summary.unitProses}
              hint="Progress 1–99%"
              valueClassName="text-blue-600 text-xl"
            />
            <ReportMetricCard
              label="Belum Mulai"
              value={summary.unitBelumMulai}
              hint="Progress 0%"
              valueClassName="text-slate-500 text-xl"
            />
            <ReportMetricCard
              label="Terlambat"
              value={summary.unitTerlambat}
              hint="Progress di bawah target"
              valueClassName="text-amber-600 text-xl"
            />
          </div>
        </section>
      )}

      {progressBreakdown.length > 0 && (
        <section>
          <ReportSectionLabel>Distribusi Progress</ReportSectionLabel>
          <ProgressBreakdownChart data={progressBreakdown} />
        </section>
      )}

      {report && report.byBlok.length > 0 && (
        <section>
          <ReportSectionLabel>Progress per Blok</ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Blok
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Rata-rata
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Selesai
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Proses
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Belum
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.byBlok.map((row) => (
                  <tr key={row.blok} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="py-3 px-5 font-bold text-slate-800">Blok {row.blok}</td>
                    <td className="py-3 px-5 text-right text-slate-600">{row.totalUnit}</td>
                    <td className="py-3 px-5 text-right font-bold text-blue-600">
                      {row.rataRataProgress}%
                    </td>
                    <td className="py-3 px-5 text-right text-emerald-600">{row.selesai}</td>
                    <td className="py-3 px-5 text-right text-blue-600">{row.proses}</td>
                    <td className="py-3 px-5 text-right text-slate-400">{row.belumMulai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report && report.bySpk.length > 0 && (
        <section>
          <ReportSectionLabel>Progress per SPK</ReportSectionLabel>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    SPK
                  </th>
                  <th className="text-left py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Mandor
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Rata-rata
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Selesai
                  </th>
                  <th className="text-right py-3 px-5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Proses
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.bySpk.map((row) => (
                  <tr key={row.spkId} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="py-3 px-5">
                      <p className="font-bold text-slate-800">{row.noSpk}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {row.judulPekerjaan}
                      </p>
                    </td>
                    <td className="py-3 px-5 text-slate-600">{row.mandor.username}</td>
                    <td className="py-3 px-5 text-right text-slate-600">{row.totalUnit}</td>
                    <td className="py-3 px-5 text-right font-bold text-blue-600">
                      {row.rataRataProgress}%
                    </td>
                    <td className="py-3 px-5 text-right text-emerald-600">{row.selesai}</td>
                    <td className="py-3 px-5 text-right text-blue-600">{row.proses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <ReportSectionLabel>Detail per Unit</ReportSectionLabel>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          {!report || report.items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Tidak ada data progress untuk filter yang dipilih.
            </p>
          ) : (
            <table className="w-full text-[12px] min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="w-8 py-2.5 px-3" />
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Perumahan
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    SPK
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Mandor
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Tahap Terakhir
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Tahapan
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.items.map((unit) => {
                  const isExpanded = expandedUnit === unit.kavlingId;
                  const kavlingLabel = `Blok ${unit.blok} No. ${unit.nomorUnit}`;

                  return (
                    <Fragment key={unit.kavlingId}>
                      <tr
                        className={`border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer ${
                          unit.isLate ? 'bg-amber-50/20' : ''
                        }`}
                        onClick={() =>
                          setExpandedUnit(isExpanded ? null : unit.kavlingId)
                        }
                      >
                        <td className="py-2 px-3 text-slate-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{kavlingLabel}</td>
                        <td className="py-2 px-3 text-slate-600">{unit.customerNama}</td>
                        <td className="py-2 px-3 text-slate-500">{unit.perumahanNama}</td>
                        <td className="py-2 px-3 text-slate-500">{unit.noSpk ?? '—'}</td>
                        <td className="py-2 px-3 text-slate-500">
                          {unit.mandor?.username ?? '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{unit.tahapTerakhir}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            unit.isLate ? 'text-amber-600' : 'text-blue-600'
                          }`}
                        >
                          {unit.progress}%
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {unit.jumlahTahapan}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${unit.kavlingId}-detail`} className="bg-slate-50/40">
                          <td colSpan={9} className="py-2 px-4">
                            {unit.tahapan.length === 0 ? (
                              <p className="text-[11px] text-slate-400 py-1">
                                Belum ada laporan tahapan.
                              </p>
                            ) : (
                              <table className="w-full text-[11px] border border-slate-100 rounded-lg overflow-hidden bg-white">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-400">
                                    <th className="text-left py-1.5 px-3 font-semibold">Tahapan</th>
                                    <th className="text-right py-1.5 px-3 font-semibold">%</th>
                                    <th className="text-left py-1.5 px-3 font-semibold">Tanggal</th>
                                    <th className="text-left py-1.5 px-3 font-semibold">Pelapor</th>
                                    <th className="text-left py-1.5 px-3 font-semibold">Deskripsi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {unit.tahapan.map((t) => (
                                    <tr key={t.id} className="border-t border-slate-50">
                                      <td className="py-1.5 px-3 font-semibold text-slate-800">
                                        {t.namaTahapan}
                                      </td>
                                      <td className="py-1.5 px-3 text-right text-blue-600">
                                        {t.persentase}%
                                      </td>
                                      <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                                        {formatDate(t.tanggal)}
                                      </td>
                                      <td className="py-1.5 px-3 text-slate-500">
                                        {t.reportedBy ?? '—'}
                                      </td>
                                      <td className="py-1.5 px-3 text-slate-500">
                                        {t.deskripsi ?? '—'}
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

      {report?.infraSummary && report.infraItems && report.infraItems.length > 0 && (
        <section>
          <ReportSectionLabel>Progress Infrastruktur (SPK)</ReportSectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <ReportMetricCard
              label="Total SPK Infra"
              value={report.infraSummary.totalSpk}
              hint="SPK infrastruktur aktif"
              valueClassName="text-slate-900 text-xl"
            />
            <ReportMetricCard
              label="Rata-rata"
              value={`${report.infraSummary.rataRataProgress}%`}
              hint="Rata-rata progress SPK infra"
              valueClassName="text-violet-600 text-xl"
            />
            <ReportMetricCard
              label="Selesai"
              value={report.infraSummary.spkSelesai}
              hint="Progress 100%"
              valueClassName="text-emerald-600 text-xl"
            />
            <ReportMetricCard
              label="Proses"
              value={report.infraSummary.spkProses}
              valueClassName="text-blue-600 text-xl"
            />
            <ReportMetricCard
              label="Belum Mulai"
              value={report.infraSummary.spkBelumMulai}
              valueClassName="text-slate-500 text-xl"
            />
            <ReportMetricCard
              label="Terlambat"
              value={report.infraSummary.spkTerlambat}
              valueClassName="text-amber-600 text-xl"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="w-8" />
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    SPK
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Zona
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Mandor
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Item Selesai
                  </th>
                  <th className="text-right py-2.5 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.infraItems.map((item) => {
                  const isExpanded = expandedInfraSpk === item.spkId;
                  return (
                    <Fragment key={item.spkId}>
                      <tr
                        className={`border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer ${
                          item.isLate ? 'bg-amber-50/20' : ''
                        }`}
                        onClick={() =>
                          setExpandedInfraSpk(isExpanded ? null : item.spkId)
                        }
                      >
                        <td className="py-2 px-3 text-slate-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-800 block">{item.noSpk}</span>
                          <span className="text-[11px] text-slate-500">{item.judulPekerjaan}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">{item.zonaNama ?? '—'}</td>
                        <td className="py-2 px-3 text-slate-500">{item.mandor.username}</td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {item.pekerjaanSelesai}/{item.jumlahPekerjaan}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            item.isLate ? 'text-amber-600' : 'text-violet-600'
                          }`}
                        >
                          {item.progress}%
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={6} className="py-2 px-4">
                            {item.tahapan.length === 0 ? (
                              <p className="text-[11px] text-slate-400 py-1">
                                Belum ada laporan pekerjaan.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {groupByKategori(
                                  item.tahapan,
                                  (t) => (t.kategori as PekerjaanInfraKategori) ?? 'LAINNYA',
                                  (a, b) => a.namaTahapan.localeCompare(b.namaTahapan),
                                ).map((group) => (
                                  <div
                                    key={group.kategori}
                                    className="border border-slate-100 rounded-lg overflow-hidden bg-white"
                                  >
                                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {group.label}
                                      </p>
                                    </div>
                                    <table className="w-full text-[11px]">
                                      <thead>
                                        <tr className="bg-slate-50/80 text-slate-400">
                                          <th className="text-left py-1.5 px-3 font-semibold">
                                            Pekerjaan
                                          </th>
                                          <th className="text-right py-1.5 px-3 font-semibold">
                                            %
                                          </th>
                                          <th className="text-left py-1.5 px-3 font-semibold">
                                            Tanggal
                                          </th>
                                          <th className="text-left py-1.5 px-3 font-semibold">
                                            Pelapor
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.items.map((t) => (
                                          <tr key={t.id} className="border-t border-slate-50">
                                            <td className="py-1.5 px-3 font-semibold text-slate-800">
                                              {t.namaTahapan}
                                            </td>
                                            <td className="py-1.5 px-3 text-right text-violet-600">
                                              {t.persentase}%
                                            </td>
                                            <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                                              {formatDate(t.tanggal)}
                                            </td>
                                            <td className="py-1.5 px-3 text-slate-500">
                                              {t.reportedBy ?? '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </ReportPageLayout>
  );
};

export default LaporanProgressProyek;
