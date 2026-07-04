/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import {
  FileUp, Eye, CheckCircle2, AlertCircle, Ban,
  Check, X, Clock,
  XCircle, Pencil
} from 'lucide-react';
import { useGetPengajuanBatal, useApproveBatal, useGetPenjualan, useUpdateBatalPenjualan } from "../../hooks/queries/usePenjualan";
import { useUploadRefundTagihan } from "../../hooks/queries/useTagihan";
import { useGetAgents } from "../../hooks/queries/useAgent";
import { useGetFeeAgents } from "../../hooks/queries/useFeeAgent";
import { useGetPerusahaanAgents } from "../../hooks/queries/usePerusahaanAgent";
import { storage } from "../../utils/storage";
import { handleApiError } from '../../utils/errorHandler';
import { getBatalClosingPencairanStatus, isBookingFeePaid } from '../../utils/agentPencairan';
import { resolveAgentForPencairan } from '../../utils/agentCommercialProfile';
import type { AgentData } from '../../types/models/agent';
import type { FeeAgentData } from '../../services/feeAgent.service';

const inferBookingFeePaid = (row: any) =>
  isBookingFeePaid({
    status: row.status,
    tagihan: row.tagihan,
    bookingFeeLunasBatal: row.bookingFeeLunasBatal,
  });
const BatalTransaksi = () => {
  const [activeTab, setActiveTab] = useState<'pengajuan' | 'refund'>('refund');
  const { data: pengajuanList = [], isLoading: loadingPengajuan } = useGetPengajuanBatal('PENDING');
  const approveMutation = useApproveBatal();
  const { data: penjualanResponse, isLoading: loadingPenjualan } = useGetPenjualan({ limit: 500 });
  const penjualanData = penjualanResponse?.items || [];
  const uploadRefundMutation = useUploadRefundTagihan();
  const updateBatalMutation = useUpdateBatalPenjualan();
  const { data: agentData = [] } = useGetAgents();
  const { data: feeData = [] } = useGetFeeAgents();
  const { data: perusahaanList = [] } = useGetPerusahaanAgents();
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPenjualan, setSelectedPenjualan] = useState<any>(null);
  const [editAgent, setEditAgent] = useState('');
  const [editBookingFeeLunas, setEditBookingFeeLunas] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState<any>(null);
  const [refundFile, setRefundFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const user = storage.getUser();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const agentByName = useMemo(() => {
    const map = new Map<string, AgentData>();
    agentData.forEach((a) => map.set(a.nama.trim().toLowerCase(), a));
    return map;
  }, [agentData]);

  const feeByPenjualanId = useMemo(() => {
    const map = new Map<number, FeeAgentData>();
    feeData.forEach((f) => map.set(f.penjualanId, f));
    return map;
  }, [feeData]);

  const resolveClosingStatus = (row: any) => {
    const matched = row.agent
      ? agentByName.get(String(row.agent).trim().toLowerCase())
      : undefined;
    const commercial = matched
      ? resolveAgentForPencairan(matched, perusahaanList)
      : null;
    const feeRecord = row.id ? feeByPenjualanId.get(row.id) : undefined;
    return getBatalClosingPencairanStatus(commercial, {
      status: row.status,
      bookingFeeLunasBatal: row.bookingFeeLunasBatal,
      tagihan: row.tagihan,
    }, feeRecord);
  };
  const handleOpenEdit = (row: any) => {
    setSelectedPenjualan(row);
    setEditAgent(row.agent || '');
    setEditBookingFeeLunas(inferBookingFeePaid(row));
    setIsEditModalOpen(true);
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPenjualan) return;
    if (!editAgent.trim()) {
      alert('Agent wajib dipilih.');
      return;
    }
    try {
      await updateBatalMutation.mutateAsync({
        id: selectedPenjualan.noTransaksi,
        data: {
          agent: editAgent.trim(),
          bookingFeeLunasBatal: editBookingFeeLunas,
        },
      });
      alert('Data penjualan batal berhasil diperbarui.');
      setIsEditModalOpen(false);
      setSelectedPenjualan(null);
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };
  const handleApproveReject = async (id: number, isApproved: boolean) => {
    const actionText = isApproved ? 'menyetujui' : 'menolak';
    if (!window.confirm(`Apakah Anda yakin ingin ${actionText} pengajuan pembatalan ini?`)) return;
    try {
      await approveMutation.mutateAsync({ id, isApproved });
      alert(`Pengajuan berhasil ${isApproved ? 'disetujui' : 'ditolak'}.`);
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };
  const columnsApproval = [
    { header: 'Tgl Pengajuan', accessor: 'createdAt', render: (val: string) => formatDate(val) },
    {
      header: 'Customer',
      accessor: 'penjualan',
      render: (val: any) => (
        <div>
          <p className="font-bold text-slate-900">{val?.customer?.nama}</p>
          <p className="text-xs text-slate-500">Trx: {val?.noTransaksi}</p>
        </div>
      )
    },
    {
      header: 'Kavling',
      accessor: 'penjualan',
      render: (val: any) => ` Blok ${val?.kavling?.blok}-${val?.kavling?.nomorUnit}`
    },
    { header: 'Alasan Batal', accessor: 'alasan', render: (val: string) => <span className="text-sm italic text-slate-600">{val}</span> },
    {
      header: 'Diajukan Oleh',
      accessor: 'requestedBy',
      render: (val: any) => val ? <span className="font-medium text-slate-700">{val.nama}</span> : '-'
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string, row: any) => {
        if (val === 'PENDING') return <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md w-fit"><Clock size={12} /> Menunggu</span>;
        if (val === 'APPROVED') return (
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit"><CheckCircle2 size={12} /> Disetujui</span>
            <span className="text-[10px] text-slate-400 mt-1">Oleh: {row.approvedBy?.nama || 'Admin'}</span>
          </div>
        );
        return (
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md w-fit"><XCircle size={12} /> Ditolak</span>
            <span className="text-[10px] text-slate-400 mt-1">Oleh: {row.approvedBy?.nama || 'Admin'}</span>
          </div>
        );
      }
    },
    {
      header: 'Aksi (Admin)',
      accessor: 'id',
      render: (_: any, row: any) => {
        if (row.status === 'PENDING' && isAdmin) {
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => handleApproveReject(row.id, true)} disabled={approveMutation.isPending} className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition cursor-pointer shadow-sm" title="Setujui Batal">
                <Check size={16} />
              </button>
              <button onClick={() => handleApproveReject(row.id, false)} disabled={approveMutation.isPending} className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition cursor-pointer shadow-sm" title="Tolak Pengajuan">
                <X size={16} />
              </button>
            </div>
          );
        }
        return <span className="text-slate-300 text-xs">-</span>;
      }
    }
  ];
  const canceledTransactions = useMemo(() => {
    return penjualanData.filter((p: any) => p.status === 'BATAL');
  }, [penjualanData]);
  const columnsRefund = [
    { header: 'Tanggal Batal', accessor: 'updatedAt', render: (val: string) => formatDate(val) },
    { header: 'Nama Customer', accessor: 'nama', render: (val: string) => <span className="font-bold">{val}</span> },
    { header: 'Kavling', accessor: 'blok', render: (_: any, row: any) => ` Blok ${row.blok}-${row.nomorUnit}` },
    {
      header: 'Total Dana Masuk',
      accessor: 'tagihan',
      render: (_: any, row: any) => {
        const tagihanLunas = (row.tagihan || []).filter((t: any) => t.status === 'LUNAS');
        const total = tagihanLunas.reduce((acc: number, curr: any) => acc + Number(curr.nominal), 0);
        return <span className="font-bold text-slate-900">{formatRupiah(total)}</span>;
      }
    },
    {
      header: 'Agent',
      accessor: 'agent',
      render: (val: string) => (
        <span className="font-medium text-slate-700">{val || '-'}</span>
      ),
    },
    {
      header: 'Booking Fee',
      accessor: 'bookingFeeLunasBatal',
      render: (_: any, row: any) => {
        const paid = inferBookingFeePaid(row);
        return paid ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
            <CheckCircle2 size={12} /> Sudah Bayar
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
            Belum / Hangus
          </span>
        );
      },
    },
    {
      header: 'Status', accessor: 'status', render: (val: string) => (
        <span className="px-2.5 py-1 bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
          {val}
        </span>
      )
    },
    {
      header: 'Aksi',
      accessor: 'noTransaksi',
      render: (_: any, row: any) => (
        <button
          type="button"
          onClick={() => handleOpenEdit(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer"
          title="Edit data penjualan batal"
        >
          <Pencil size={14} /> Edit
        </button>
      ),
    },
  ];
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert("Hanya file gambar dan PDF yang diperbolehkan!");
        e.target.value = '';
        return;
      }
      setRefundFile(file);
    }
  };
  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundFile || !selectedTagihan) {
      alert("Silakan pilih file bukti refund terlebih dahulu!");
      return;
    }
    try {
      await uploadRefundMutation.mutateAsync({
        id: selectedTagihan.id,
        file: refundFile
      });
      alert("Bukti refund berhasil diunggah!");
      setIsRefundModalOpen(false);
      setRefundFile(null);
      setSelectedTagihan(null);
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };
  const expandedRowRenderRefund = (row: any) => {
    const tagihanLunas = (row.tagihan || []).filter((t: any) => t.status === 'LUNAS');
    const closingStatus = resolveClosingStatus(row);
    const closingToneClass =
      closingStatus.tone === 'success'
        ? 'text-green-700'
        : closingStatus.tone === 'warning'
          ? 'text-amber-700'
          : 'text-slate-500';
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-slate-100 pb-3 gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Ban size={16} className="text-red-500" /> Alasan Pembatalan
            </h4>
            <p className="text-sm text-slate-600 mt-1">{row.alasanBatal || 'Tidak ada alasan yang dicantumkan.'}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-slate-500">Agent: <span className="font-bold text-slate-800">{row.agent || '-'}</span></p>
            <p className="text-slate-500 mt-1">
              Closing fee agent:{' '}
              <span className={`font-bold ${closingToneClass}`}>
                {closingStatus.message}
              </span>
            </p>
          </div>
        </div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">Dana yang Masuk (Bisa Di-refund)</h4>
        {tagihanLunas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">Keterangan Tagihan</th>
                  <th className="px-4 py-3 font-bold">Tanggal Pembayaran</th>
                  <th className="px-4 py-3 text-right font-bold">Nominal (Rp)</th>
                  <th className="px-4 py-3 text-center font-bold">Status Refund</th>
                  <th className="px-4 py-3 rounded-r-lg text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tagihanLunas.map((tagihan: any) => (
                  <tr key={tagihan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{tagihan.pembayaran}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(tagihan.updatedAt)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRupiah(tagihan.nominal)}</td>
                    <td className="px-4 py-3 text-center">
                      {tagihan.isRefunded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                          <CheckCircle2 size={12} /> Dikembalikan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                          <AlertCircle size={12} /> Belum Refund
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tagihan.isRefunded ? (
                        <button
                          onClick={() => setPreviewImage(tagihan.fileBuktiRefund)}
                          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                        >
                          <Eye size={14} /> Lihat Bukti
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTagihan(tagihan);
                            setRefundFile(null);
                            setIsRefundModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-black transition shadow-sm cursor-pointer"
                        >
                          <FileUp size={14} /> Proses Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 italic">Belum ada dana yang dibayarkan oleh customer ini (0 Rupiah).</p>
          </div>
        )}
      </div>
    );
  };
  if (loadingPengajuan || loadingPenjualan) return <PageLoader />;
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto hide-scrollbar bg-white p-2 rounded-t-2xl shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('refund')}
          className={`whitespace-nowrap py-3 px-6 border-b-2 font-bold text-sm tracking-wide transition-colors cursor-pointer ${activeTab === 'refund' ? 'border-black text-black' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
        >
          Proses Pengembalian Dana (Refund)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pengajuan')}
          className={`whitespace-nowrap py-3 px-6 border-b-2 font-bold text-sm tracking-wide transition-colors cursor-pointer ${activeTab === 'pengajuan' ? 'border-black text-black' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
        >
          Antrean Persetujuan Pembatalan
        </button>
      </div>
      {/* TAB 1: PENGAJUAN */}
      {activeTab === 'pengajuan' && (
        <DataTable
          title="Daftar Pengajuan Pembatalan Transaksi"
          columns={columnsApproval}
          data={pengajuanList}
        />
      )}
      {/* TAB 2: REFUND */}
      {activeTab === 'refund' && (
        <DataTable
          title="Daftar Transaksi Batal"
          columns={columnsRefund}
          data={canceledTransactions}
          expandedRowRender={expandedRowRenderRefund}
        />
      )}
      {/* MODAL EDIT PENJUALAN BATAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Penjualan Batal"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5">
          {selectedPenjualan && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
              <p className="font-bold text-slate-900">{selectedPenjualan.nama}</p>
              <p className="text-slate-500 mt-1">
                {selectedPenjualan.noTransaksi} · Blok {selectedPenjualan.blok}-{selectedPenjualan.nomorUnit}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Agent Penjualan
            </label>
            <select
              value={editAgent}
              onChange={(e) => setEditAgent(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black text-black"
              required
            >
              <option value="">-- Pilih Agent --</option>
              {agentData.map((agent: { id: number; nama: string }) => (
                <option key={agent.id} value={agent.nama}>
                  {agent.nama}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={editBookingFeeLunas}
              onChange={(e) => setEditBookingFeeLunas(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">Customer sudah bayar booking fee</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Jika dicentang, marketing dapat mengajukan pencairan closing fee agent untuk transaksi batal ini (komisi marketing tidak dicairkan).
              </p>
            </div>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updateBatalMutation.isPending}
              className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updateBatalMutation.isPending}
              className="px-6 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-lg disabled:opacity-50"
            >
              {updateBatalMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>
      {/* MODAL PROSES REFUND */}
      <Modal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} title="Proses Pengembalian Dana (Refund)">
        <form onSubmit={handleRefundSubmit} className="space-y-5">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Item yang di-refund</p>
            <p className="text-sm font-black text-blue-900 mb-1">{selectedTagihan?.pembayaran}</p>
            <p className="text-lg font-black text-blue-700">{formatRupiah(selectedTagihan?.nominal || 0)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Jika dana {selectedTagihan?.pembayaran} dikembalikan kepada customer, silakan unggah bukti transfer pengembalian dana di bawah ini. Jika dana hangus (tidak di-refund), Anda tidak perlu melakukan aksi ini.
            </p>
            <FileInput
              label="Upload Bukti Transfer Refund (Gambar/PDF)"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              required
            />
            {refundFile && (
              <p className="text-xs text-green-600 font-bold bg-green-50 p-2 rounded-lg border border-green-100">
                File siap diunggah: {refundFile.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsRefundModalOpen(false)}
              disabled={uploadRefundMutation.isPending}
              className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploadRefundMutation.isPending || !refundFile}
              className="px-6 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-lg disabled:opacity-50"
            >
              {uploadRefundMutation.isPending ? "Memproses..." : "Konfirmasi Refund"}
            </button>
          </div>
        </form>
      </Modal>
      {/* MODAL LIGHTBOX PREVIEW GAMBAR REFUND */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Bukti Transfer Refund">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {previewImage.split('?')[0].toLowerCase().endsWith('.pdf') || previewImage.includes('application/pdf') ? (
                <iframe src={previewImage} className="w-full h-[60vh] rounded-lg border-none" title="PDF Preview" />
              ) : (
                <img src={previewImage} alt="Preview Bukti Refund" className="max-w-full max-h-[60vh] rounded-lg shadow-xl object-contain" />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a
              href={previewImage || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
            >
              Buka Tab Baru
            </a>
            <button
              onClick={() => setPreviewImage(null)}
              className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-md"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default BatalTransaksi;