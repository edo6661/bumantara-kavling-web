/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { Banknote, CheckCircle, Clock, History } from 'lucide-react';
import Modal from '../shared/Modal';
import { formatRupiah } from '../../utils/formatters';
import { useGetPenjualan } from '../../hooks/queries/usePenjualan';
import { useGetFeeAgents } from '../../hooks/queries/useFeeAgent';
import { useGetAllAgentPencairan, useAjukanAgentPencairan } from '../../hooks/queries/useAgentPencairan';
import { useGetPerusahaanAgents } from '../../hooks/queries/usePerusahaanAgent';
import type { FeeAgentData } from '../../services/feeAgent.service';
import type { AgentPencairanData } from '../../services/agentPencairan.service';
import AjukanPencairanModal from './AjukanPencairanModal';
import PencairanHistoryModal from './PencairanHistoryModal';
import {
  hasAnyEligiblePencairan,
  getPencairanBlockReason,
  formatPencairanTahapLabel,
  getPencairanPaymentStatus,
  getPencairanFeeTotals,
  getFullMarketingFee,
  getTotalNilaiAjb,
  getTotalFeeReferensi,
  calcPotonganPphFromReferensi,
  resolveSaleDetail,
  mergeAgentPenjualanWithEligibleBatal,
  type SaleDetail,
} from '../../utils/agentPencairan';
import type { PencairanKomponenKey } from '../../utils/agentPencairanPreview';
import { buildPencairanAjukanPreview } from '../../utils/agentPencairanPreview';
import {
  isAgentPerusahaan,
  resolveAgentForPencairan,
} from '../../utils/agentCommercialProfile';
import { hasAgentPencairanInvoice } from '../../utils/agentPencairanInvoice';
import type { AgentData, PenjualanAgentData } from '../../types/models/agent';
import { handleApiError } from '../../utils/errorHandler';

const getFeeForSale = (feeList: FeeAgentData[], agentId: number, saleId: number, noTransaksi: string) =>
  feeList.find(
    (f) => f.agentId === agentId && (f.penjualanId === saleId || f.noTransaksi === noTransaksi),
  ) ??
  feeList.find(
    (f) => f.penjualanId === saleId || f.noTransaksi === noTransaksi,
  );

const calcAgentFees = (
  agent: AgentData,
  feeRecord: FeeAgentData | undefined,
  detail?: SaleDetail,
) => {
  if (!feeRecord) return { fee: 0, totalFee: 0, potPph: 0 };
  const fee = getFullMarketingFee(agent, detail);
  const totalFee = getTotalFeeReferensi(agent, feeRecord, detail);
  const potPph = calcPotonganPphFromReferensi(agent, feeRecord, detail);
  return { fee, totalFee, potPph };
};

interface AgentPenjualanPencairanPanelProps {
  agent: AgentData;
}

const AgentPenjualanPencairanPanel = ({ agent }: AgentPenjualanPencairanPanelProps) => {
  const { data: penjualanResponse } = useGetPenjualan({ limit: 500 });
  const { data: feeData = [] } = useGetFeeAgents();
  const { data: pencairanData = [] } = useGetAllAgentPencairan();
  const { data: perusahaanList = [] } = useGetPerusahaanAgents();
  const ajukanPencairanMutation = useAjukanAgentPencairan();

  const penjualanList = penjualanResponse?.items || [];

  const pencairanByFeeAgentId = useMemo(() => {
    const map = new Map<number, AgentPencairanData[]>();
    pencairanData.forEach((p) => {
      const list = map.get(p.feeAgentId) ?? [];
      list.push(p);
      map.set(p.feeAgentId, list);
    });
    return map;
  }, [pencairanData]);

  const commercial = useMemo(
    () => resolveAgentForPencairan(agent, perusahaanList),
    [agent, perusahaanList],
  );

  const [selectedDetailPenjualan, setSelectedDetailPenjualan] = useState<any>(null);
  const [pencairanModal, setPencairanModal] = useState<{
    feeRecord: FeeAgentData;
    agent: AgentData;
    saleLabel: string;
    detail?: SaleDetail;
  } | null>(null);
  const [historyModal, setHistoryModal] = useState<{
    saleLabel: string;
    records: AgentPencairanData[];
  } | null>(null);
  const [historyPreviewUrl, setHistoryPreviewUrl] = useState<string | null>(null);

  const pencairanPreview = useMemo(() => {
    if (!pencairanModal) return null;
    const pencairanList = pencairanByFeeAgentId.get(pencairanModal.feeRecord.id) ?? [];
    return buildPencairanAjukanPreview(
      pencairanModal.agent,
      pencairanModal.feeRecord,
      pencairanList,
      pencairanModal.detail,
    );
  }, [pencairanModal, pencairanByFeeAgentId]);

  const requireInvoiceForModal = useMemo(() => {
    if (!pencairanModal || !isAgentPerusahaan(agent.type)) return false;
    const pencairanList = pencairanByFeeAgentId.get(pencairanModal.feeRecord.id) ?? [];
    const pendingWithInvoice = pencairanList.some(
      (p) => p.status === 'MENUNGGU_PEMBAYARAN' && hasAgentPencairanInvoice(p),
    );
    return !pendingWithInvoice;
  }, [pencairanModal, pencairanByFeeAgentId, agent.type]);

  const openAjukanPencairanModal = (
    feeRecord: FeeAgentData,
    saleLabel: string,
    detail?: SaleDetail,
  ) => {
    const pencairanList = pencairanByFeeAgentId.get(feeRecord.id) ?? [];
    if (!hasAnyEligiblePencairan(commercial, feeRecord, pencairanList, detail)) {
      alert(getPencairanBlockReason(commercial, feeRecord, pencairanList, detail) ?? 'Belum memenuhi syarat pencairan.');
      return;
    }
    setPencairanModal({ feeRecord, saleLabel, agent: commercial, detail });
  };

  const handleConfirmAjukanPencairan = async (
    selected: Set<PencairanKomponenKey>,
    fileInvoices?: File[],
  ) => {
    if (!pencairanModal) return;
    try {
      await ajukanPencairanMutation.mutateAsync({
        feeAgentId: pencairanModal.feeRecord.id,
        includeClosing: selected.has('closing'),
        includeMarketing: selected.has('marketing'),
        fileInvoices,
      });
      alert('Pengajuan pencairan berhasil dikirim ke finance.');
      setPencairanModal(null);
    } catch (err: unknown) {
      const { message } = handleApiError(err);
      alert(message);
    }
  };

  const relatedSales = mergeAgentPenjualanWithEligibleBatal(agent, penjualanList);

  return (
    <>
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <p className="text-[10px] text-slate-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Fee Marketing:{' '}
            <span className="font-semibold text-slate-600 tabular-nums">
              {commercial.feeMarketingPct != null ? `${commercial.feeMarketingPct}%` : '-'}
            </span>
          </span>
          <span>
            Fee Closing:{' '}
            <span className="font-semibold text-slate-600 tabular-nums">
              {commercial.feeClosingNominal != null ? formatRupiah(commercial.feeClosingNominal) : '-'}
            </span>
          </span>
          {isAgentPerusahaan(agent.type) && (
            <span>
              PKP:{' '}
              <span className="font-semibold text-slate-600">
                {commercial.isPkp ? 'PKP' : 'Non-PKP'}
              </span>
            </span>
          )}
          <span>
            Potongan PPh:{' '}
            <span className="font-semibold text-slate-600 tabular-nums">
              {commercial.potonganPph != null ? `${commercial.potonganPph}%` : '-'}
            </span>
          </span>
        </p>
        {relatedSales.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Blok</th>
                  <th className="px-4 py-3 font-bold">No</th>
                  <th className="px-4 py-3 text-right font-bold">Harga Jual</th>
                  <th className="px-4 py-3 text-right font-bold">Nilai AJB</th>
                  <th className="px-4 py-3 text-right font-bold">Fee</th>
                  <th className="px-4 py-3 text-right font-bold">Total Fee</th>
                  <th className="px-4 py-3 text-right font-bold">Pot PPh</th>
                  <th className="px-4 py-3 text-center font-bold">Dibayar</th>
                  <th className="px-4 py-3 rounded-r-lg text-center font-bold w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {relatedSales.map((sale: PenjualanAgentData) => {
                  const detail = resolveSaleDetail(sale, penjualanList);
                  const saleDetailForModal = { ...sale, ...detail };
                  const openSaleDetailModal = () => setSelectedDetailPenjualan(saleDetailForModal);
                  const nilaiAjb = getTotalNilaiAjb(detail?.progressPenjualan) || null;
                  const feeRecord = getFeeForSale(feeData, agent.id, sale.id, sale.noTransaksi);
                  const pencairanList = feeRecord ? (pencairanByFeeAgentId.get(feeRecord.id) ?? []) : [];
                  const { fee, totalFee, potPph } = calcAgentFees(commercial, feeRecord, detail);
                  const feeTotals = feeRecord
                    ? getPencairanFeeTotals(commercial, feeRecord, detail)
                    : undefined;
                  const paymentStatus = getPencairanPaymentStatus(pencairanList, feeTotals);
                  const saleLabel = `${sale.customer?.nama || '-'} — Blok ${sale.kavling?.blok || '-'} No. ${sale.kavling?.nomorUnit || '-'}`;
                  const canAjukan = feeRecord
                    ? hasAnyEligiblePencairan(commercial, feeRecord, pencairanList, detail)
                    : false;
                  const blockReason = getPencairanBlockReason(commercial, feeRecord, pencairanList, detail);
                  const waitingPencairan = pencairanList.filter((p) => p.status === 'MENUNGGU_PEMBAYARAN');

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3 font-medium cursor-pointer" onClick={openSaleDetailModal}>
                        {sale.customer?.nama || '-'}
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={openSaleDetailModal}>
                        {sale.kavling?.blok}
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={openSaleDetailModal}>
                        {sale.kavling?.nomorUnit}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-bold text-slate-700 cursor-pointer"
                        onClick={openSaleDetailModal}
                      >
                        {formatRupiah(sale.hargaJual)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 cursor-pointer" onClick={openSaleDetailModal}>
                        {nilaiAjb ? formatRupiah(nilaiAjb) : '-'}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-medium text-slate-800 cursor-pointer"
                        onClick={openSaleDetailModal}
                      >
                        {nilaiAjb ? formatRupiah(fee) : '-'}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-medium text-slate-800 cursor-pointer"
                        onClick={openSaleDetailModal}
                      >
                        {formatRupiah(totalFee)}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-medium text-slate-800 cursor-pointer"
                        onClick={openSaleDetailModal}
                      >
                        {formatRupiah(potPph)}
                      </td>
                      <td className="px-4 py-3 text-center cursor-pointer" onClick={openSaleDetailModal}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${paymentStatus.className}`}>
                            {paymentStatus.label}
                          </span>
                          {paymentStatus.hint && (
                            <span className="text-[9px] text-slate-500 leading-tight max-w-[110px]">
                              {paymentStatus.hint}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-1 min-w-[88px]">
                          <div className="flex items-center justify-center gap-1">
                            {canAjukan && feeRecord && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAjukanPencairanModal(feeRecord, saleLabel, detail);
                                }}
                                disabled={ajukanPencairanMutation.isPending}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                                title="Ajukan pencairan"
                              >
                                <Banknote size={14} />
                                Ajukan
                              </button>
                            )}
                            {pencairanList.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryModal({ saleLabel, records: pencairanList });
                                }}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                title="Riwayat pencairan"
                              >
                                <History size={16} />
                              </button>
                            )}
                            {waitingPencairan.map((p) => (
                              <span
                                key={p.id}
                                className="p-1.5 text-amber-500"
                                title={`Menunggu finance (${formatPencairanTahapLabel(p.tahap, detail?.caraPembayaran)})`}
                              >
                                <Clock size={16} />
                              </span>
                            ))}
                            {pencairanList.some((p) => p.status === 'SUDAH_DIBAYAR') && (
                              <span className="p-1.5 text-green-600" title="Ada pencairan yang sudah dibayar finance">
                                <CheckCircle size={16} />
                              </span>
                            )}
                          </div>
                          {!canAjukan && blockReason && (
                            <span
                              className="text-[9px] leading-tight text-slate-500 max-w-[120px] text-center"
                              title={blockReason}
                            >
                              {blockReason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada riwayat penjualan untuk agent ini.
          </p>
        )}
      </div>

      <Modal
        isOpen={!!selectedDetailPenjualan}
        onClose={() => setSelectedDetailPenjualan(null)}
        title="Informasi Transaksi Penjualan"
      >
        {selectedDetailPenjualan && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer / Pembeli</p>
                  <p className="text-lg font-black text-slate-900">
                    {selectedDetailPenjualan.nama || selectedDetailPenjualan.customer?.nama || '-'}
                  </p>
                 
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      selectedDetailPenjualan.status === 'LUNAS'
                        ? 'bg-green-100 text-green-800'
                        : selectedDetailPenjualan.status === 'BATAL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedDetailPenjualan.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kavling</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.perumahan || selectedDetailPenjualan.kavling?.perumahan?.nama} - Blok{' '}
                    {selectedDetailPenjualan.blok || selectedDetailPenjualan.kavling?.blok} No.{' '}
                    {selectedDetailPenjualan.nomorUnit || selectedDetailPenjualan.kavling?.nomorUnit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Metode Pembayaran</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.caraPembayaran?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Harga Jual</p>
                  <p className="text-sm font-bold text-blue-700">
                    {selectedDetailPenjualan.hargaJual ? formatRupiah(selectedDetailPenjualan.hargaJual) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Transaksi</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.tanggal
                      ? new Date(selectedDetailPenjualan.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetailPenjualan(null)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black transition-colors cursor-pointer shadow-md"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

      <AjukanPencairanModal
        isOpen={!!pencairanModal}
        onClose={() => setPencairanModal(null)}
        preview={pencairanPreview}
        saleLabel={pencairanModal?.saleLabel ?? ''}
        pencairanHistory={
          pencairanModal ? (pencairanByFeeAgentId.get(pencairanModal.feeRecord.id) ?? []) : []
        }
        requireInvoice={requireInvoiceForModal}
        isSubmitting={ajukanPencairanMutation.isPending}
        onConfirm={(selected, fileInvoices) => void handleConfirmAjukanPencairan(selected, fileInvoices)}
      />

      <PencairanHistoryModal
        isOpen={!!historyModal}
        onClose={() => {
          setHistoryModal(null);
          setHistoryPreviewUrl(null);
        }}
        title="Riwayat Pencairan Agent"
        subtitle={historyModal?.saleLabel}
        records={historyModal?.records ?? []}
        previewUrl={historyPreviewUrl}
        onPreviewBukti={setHistoryPreviewUrl}
        onClosePreview={() => setHistoryPreviewUrl(null)}
      />
    </>
  );
};

export default AgentPenjualanPencairanPanel;
