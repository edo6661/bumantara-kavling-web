/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Select from "../../components/shared/Select";
import Input from "../../components/shared/Input";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { ArrowRightLeft, Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useGetPenjualan, useGantiKavling, useGetPengajuanGantiKavling, useApproveGantiKavling } from "../../hooks/queries/usePenjualan";
import { useGetKavlings } from "../../hooks/queries/useKavling";
import { storage } from "../../utils/storage";

const GantiKavling = () => {
  const { data: penjualanData = [], isLoading: loadingPenjualan } = useGetPenjualan();
  const { data: kavlingResponse, isLoading: loadingKavling } = useGetKavlings({ limit: 500 });
  const { data: pengajuanList = [], isLoading: loadingPengajuan } = useGetPengajuanGantiKavling();

  const gantiKavlingMutation = useGantiKavling();
  const approveMutation = useApproveGantiKavling();

  const user = storage.getUser();
  const isAdmin = user?.role === 'ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  const [formData, setFormData] = useState({ blokBaru: '', nomorUnitBaru: '', kavlingBaruId: '', alasan: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eligiblePenjualan = useMemo(() => {
    return penjualanData.filter((p: any) => p.status === 'BOOKED' || p.status === 'PROSES');
  }, [penjualanData]);

  const availableKavlings = useMemo(() => {
    if (!kavlingResponse?.items) return [];
    return kavlingResponse.items.filter(k => k.status === 'AVAILABLE');
  }, [kavlingResponse]);

  const uniqueBloks = useMemo(() => {
    const bloks = availableKavlings.map(k => k.blok);
    return [...new Set(bloks)].sort();
  }, [availableKavlings]);

  const availableUnits = useMemo(() => {
    if (!formData.blokBaru) return [];
    return availableKavlings.filter(k => k.blok === formData.blokBaru).map(k => k.nomorUnit).sort();
  }, [availableKavlings, formData.blokBaru]);

  const selectedKavlingInfo = useMemo(() => {
    return availableKavlings.find(k => k.blok === formData.blokBaru && k.nomorUnit === formData.nomorUnitBaru);
  }, [availableKavlings, formData.blokBaru, formData.nomorUnitBaru]);

  const handleApproveReject = async (id: number, isApproved: boolean) => {
    const actionText = isApproved ? 'menyetujui' : 'menolak';
    if (!window.confirm(`Apakah Anda yakin ingin ${actionText} ganti kavling ini?`)) return;
    try {
      await approveMutation.mutateAsync({ id, isApproved });
      alert(`Pengajuan berhasil ${isApproved ? 'disetujui' : 'ditolak'}.`);
    } catch (error: any) {
      alert(error.response?.data?.message || `Gagal memproses pengajuan.`);
    }
  };

  const columnsMaster = [
    { header: 'No. Transaksi', accessor: 'id' },
    { header: 'Tanggal', accessor: 'tanggal', render: (val: string) => formatDate(val) },
    { header: 'Customer', accessor: 'nama', render: (val: string) => <span className="font-bold">{val}</span> },
    { header: 'Kavling Saat Ini', accessor: 'blok', render: (_: any, row: any) => `${row.perumahan} Blok ${row.blok}-${row.nomorUnit}` },
    {
      header: 'Aksi', accessor: 'id', render: (_: any, row: any) => (
        <button
          onClick={() => {
            setSelectedTransaksi(row);
            setFormData({ blokBaru: '', nomorUnitBaru: '', kavlingBaruId: '', alasan: '' });
            setErrors({});
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors cursor-pointer"
        >
          <ArrowRightLeft size={14} /> Ajukan Ganti
        </button>
      )
    }
  ];

  const columnsHistory = [
    { header: 'Tgl Pengajuan', accessor: 'createdAt', render: (val: string) => formatDate(val) },
    { header: 'Customer', accessor: 'penjualan', render: (val: any) => <span className="font-bold">{val?.customer?.nama}</span> },
    { header: 'Dari Kavling', accessor: 'kavlingLama', render: (val: any) => <span className="text-red-600 font-medium">Blok {val?.blok}-{val?.nomorUnit}</span> },
    { header: 'Ke Kavling', accessor: 'kavlingBaru', render: (val: any) => <span className="text-green-600 font-bold">Blok {val?.blok}-{val?.nomorUnit}</span> },
    { header: 'Alasan', accessor: 'alasan', render: (val: string) => <span className="text-slate-500 italic text-xs">{val}</span> },
    { header: 'Diajukan Oleh', accessor: 'requestedBy', render: (val: any) => val ? <span className="font-medium text-slate-700">{val.username}</span> : '-' },
    {
      header: 'Status', accessor: 'status', render: (val: string, row: any) => {
        if (val === 'PENDING') return <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md w-fit"><Clock size={12} /> Menunggu</span>;
        if (val === 'APPROVED') return (
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit"><CheckCircle2 size={12} /> Disetujui</span>
            <span className="text-[10px] text-slate-400 mt-1">Oleh: {row.approvedBy?.username}</span>
          </div>
        );
        return (
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md w-fit"><XCircle size={12} /> Ditolak</span>
            <span className="text-[10px] text-slate-400 mt-1">Oleh: {row.approvedBy?.username}</span>
          </div>
        );
      }
    },
    {
      header: 'Aksi (Admin)', accessor: 'id', render: (_: any, row: any) => {
        if (row.status === 'PENDING' && isAdmin) {
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => handleApproveReject(row.id, true)} disabled={approveMutation.isPending} className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition cursor-pointer shadow-sm" title="Setujui Ganti">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.kavlingBaruId) newErrors.kavlingBaruId = "Pilih unit terlebih dahulu";
    if (formData.alasan.length < 5) newErrors.alasan = "Alasan wajib diisi (min. 5 karakter)";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      await gantiKavlingMutation.mutateAsync({
        id: selectedTransaksi.id,
        data: { kavlingBaruId: Number(formData.kavlingBaruId), alasan: formData.alasan }
      });
      alert("Pengajuan Ganti Kavling Berhasil Dikirim ke Admin!");
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Terjadi kesalahan saat memproses pengajuan");
    }
  };

  if (loadingPenjualan || loadingKavling || loadingPengajuan) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="max-h-[450px] overflow-y-auto custom-scrollbar rounded-2xl shadow-sm border border-slate-200/60 bg-white">
        <DataTable title="Pilih Transaksi Untuk Ganti Kavling" columns={columnsMaster} data={eligiblePenjualan} />
      </div>

      <div className="mt-8">
        <DataTable title="Daftar Pengajuan Ganti Kavling" columns={columnsHistory} data={pengajuanList} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Formulir Pengajuan Ganti Kavling">
        {selectedTransaksi && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detail Transaksi Saat Ini</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Customer</p><p className="text-sm font-bold text-slate-900">{selectedTransaksi.nama}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Kavling Lama</p><p className="text-sm font-bold text-red-600">{selectedTransaksi.perumahan} Blok {selectedTransaksi.blok}-{selectedTransaksi.nomorUnit}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Harga Jual Lama</p><p className="text-sm font-bold text-slate-700">{formatRupiah(selectedTransaksi.hargaJual)}</p></div>
              </div>
            </div>

            <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl shadow-sm">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ArrowRightLeft size={14} /> Pilih Unit Kavling Baru
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Pilih Blok" name="blokBaru" value={formData.blokBaru} onChange={(e) => setFormData({ ...formData, blokBaru: e.target.value, nomorUnitBaru: '', kavlingBaruId: '' })} options={[{ value: '', label: '-- Pilih Blok --' }, ...uniqueBloks.map(b => ({ value: b, label: `${b}` }))]} />
                <Select label="Pilih Nomor Unit" name="nomorUnitBaru" value={formData.nomorUnitBaru} onChange={(e) => { const unit = e.target.value; const kav = availableKavlings.find(k => k.blok === formData.blokBaru && k.nomorUnit === unit); setFormData({ ...formData, nomorUnitBaru: unit, kavlingBaruId: kav?.id?.toString() || '' }); }} disabled={!formData.blokBaru} options={[{ value: '', label: '-- Pilih Nomor Unit --' }, ...availableUnits.map(u => ({ value: u, label: `${u}` }))]} error={errors.kavlingBaruId} />
              </div>
              {selectedKavlingInfo && (
                <div className="mt-5 p-4 bg-white rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95 duration-200 shadow-sm">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Perumahan</p>
                    <p className="text-sm font-bold text-slate-900">{selectedKavlingInfo.perumahan?.nama || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Tipe Kavling</p>
                    <p className="text-sm font-bold text-slate-900">{selectedKavlingInfo.namaTipe}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Luas Tanah</p>
                    <p className="text-sm font-bold text-slate-900">{selectedKavlingInfo.luasTanah} m²</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Luas Bangunan</p>
                    <p className="text-sm font-bold text-slate-900">{selectedKavlingInfo.luasBangunan} m²</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Harga Jual Baru</p>
                    <p className="text-sm font-black text-blue-700">{formatRupiah(selectedKavlingInfo.hargaJual)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Rekening Bank PT</p>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedKavlingInfo.rekeningTujuan
                        ? `${selectedKavlingInfo.rekeningTujuan.namaBank} - ${selectedKavlingInfo.rekeningTujuan.noRekening}`
                        : 'Belum Diatur'}
                    </p>
                    {selectedKavlingInfo.rekeningTujuan && (
                      <p className="text-[10px] text-slate-500 font-medium">
                        a/n {selectedKavlingInfo.rekeningTujuan.atasNama}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-1">
              <Input label="Alasan Pindah / Ganti Kavling" name="alasan" value={formData.alasan} onChange={(e) => setFormData({ ...formData, alasan: e.target.value })} error={errors.alasan} placeholder="Contoh: Customer ingin upgrade ke tipe yang lebih besar..." />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">Batal</button>
              <button type="submit" disabled={gantiKavlingMutation.isPending || !formData.kavlingBaruId} className="px-6 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-slate-800 shadow-lg cursor-pointer transition-colors disabled:opacity-50">
                {gantiKavlingMutation.isPending ? "Memproses..." : "Ajukan Ganti Kavling"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default GantiKavling;