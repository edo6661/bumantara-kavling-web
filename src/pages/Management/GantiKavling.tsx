/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { ArrowRightLeft } from 'lucide-react';
import { useGetPenjualan, useGantiKavling } from "../../hooks/queries/usePenjualan";
import { useGetKavlings } from "../../hooks/queries/useKavling";

const GantiKavling = () => {
  const { data: penjualanData = [], isLoading: loadingPenjualan } = useGetPenjualan();
  const { data: kavlingResponse, isLoading: loadingKavling } = useGetKavlings({ limit: 500 });
  const gantiKavlingMutation = useGantiKavling();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  const [formData, setFormData] = useState({
    kavlingBaruId: '',
    alasan: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eligiblePenjualan = useMemo(() => {
    return penjualanData.filter((p: any) => p.status === 'BOOKED' || p.status === 'PROSES');
  }, [penjualanData]);

  const availableKavlings = useMemo(() => {
    if (!kavlingResponse?.items) return [];
    return kavlingResponse.items.filter(k => k.status === 'AVAILABLE');
  }, [kavlingResponse]);

  // --- MEMO BARU: Ekstrak semua riwayat ganti kavling dari data penjualan ---
  const riwayatGanti = useMemo(() => {
    const history: any[] = [];
    penjualanData.forEach((p: any) => {
      if (p.riwayatGantiKavling && p.riwayatGantiKavling.length > 0) {
        p.riwayatGantiKavling.forEach((riwayat: any) => {
          history.push({
            ...riwayat,
            noTransaksi: p.id,
            namaCustomer: p.nama,
          });
        });
      }
    });
    // Urutkan dari yang terbaru (descending)
    return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [penjualanData]);

  const columns = [
    { header: 'No. Transaksi', accessor: 'id' },
    { header: 'Tanggal', accessor: 'tanggal', render: (val: string) => formatDate(val) },
    { header: 'Customer', accessor: 'nama', render: (val: string) => <span className="font-bold">{val}</span> },
    { header: 'Kavling Saat Ini', accessor: 'blok', render: (_: any, row: any) => `${row.perumahan} Blok ${row.blok}-${row.nomorUnit}` },
    {
      header: 'Status', accessor: 'status', render: (val: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
          {val}
        </span>
      )
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: any, row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTransaksi(row);
            setFormData({ kavlingBaruId: '', alasan: '' });
            setErrors({});
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors cursor-pointer"
        >
          <ArrowRightLeft size={14} /> Ganti Kavling
        </button>
      )
    }
  ];

  // --- KOLOM BARU UNTUK TABEL HISTORI ---
  const columnsHistory = [
    { header: 'Tanggal Ganti', accessor: 'createdAt', render: (val: string) => formatDate(val) },
    { header: 'No. Transaksi', accessor: 'noTransaksi' },
    { header: 'Customer', accessor: 'namaCustomer', render: (val: string) => <span className="font-bold">{val}</span> },
    {
      header: 'Kavling Lama',
      accessor: 'kavlingLama',
      render: (_: any, row: any) => <span className="text-red-600 font-medium">{row.kavlingLama?.perumahan?.nama} Blok {row.kavlingLama?.blok}-{row.kavlingLama?.nomorUnit}</span>
    },
    {
      header: 'Kavling Baru',
      accessor: 'kavlingBaru',
      render: (_: any, row: any) => <span className="text-green-600 font-bold">{row.kavlingBaru?.perumahan?.nama} Blok {row.kavlingBaru?.blok}-{row.kavlingBaru?.nomorUnit}</span>
    },
    { header: 'Alasan', accessor: 'alasan', render: (val: string) => <span className="text-slate-500 italic">{val}</span> }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.kavlingBaruId) newErrors.kavlingBaruId = "Kavling baru wajib dipilih";
    if (formData.alasan.length < 5) newErrors.alasan = "Alasan wajib diisi (min. 5 karakter)";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await gantiKavlingMutation.mutateAsync({
        id: selectedTransaksi.id,
        data: {
          kavlingBaruId: Number(formData.kavlingBaruId),
          alasan: formData.alasan
        }
      });
      alert("Proses Ganti Kavling Berhasil!");
      setIsModalOpen(false);
      setSelectedTransaksi(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Terjadi kesalahan saat memproses ganti kavling");
    }
  };

  if (loadingPenjualan || loadingKavling) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Wrapper max-height untuk tabel utama */}
      <div className="max-h-[450px] overflow-y-auto custom-scrollbar rounded-2xl shadow-sm border border-slate-200/60 bg-white">
        <DataTable
          title="Proses Ganti Kavling"
          columns={columns}
          data={eligiblePenjualan}
        />
      </div>

      {/* Tabel Histori di bawahnya */}
      <div className="mt-8">
        <DataTable
          title="Riwayat Ganti Kavling"
          columns={columnsHistory}
          data={riwayatGanti}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Formulir Ganti Kavling">
        {selectedTransaksi && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* INFO KAVLING LAMA (DISABLED) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Kavling Lama</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Harga Jual Lama" name="hargaLama" value={formatRupiah(selectedTransaksi.hargaJual)} readOnly disabled />
                <Input label="Status Saat Ini" name="status" value={selectedTransaksi.status} readOnly disabled />
                <Input label="Nama Customer" name="nama" value={selectedTransaksi.nama} readOnly disabled />
                <Input label="Kavling Lama" name="kavlingLama" value={`${selectedTransaksi.perumahan} Blok ${selectedTransaksi.blok}-${selectedTransaksi.nomorUnit}`} readOnly disabled />
              </div>
            </div>

            {/* INPUT KAVLING BARU */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ArrowRightLeft size={16} /> Pilih Kavling Baru
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <Select
                  label="Pilih Unit Kavling Tersedia (Available)"
                  name="kavlingBaruId"
                  value={formData.kavlingBaruId}
                  onChange={(e) => setFormData({ ...formData, kavlingBaruId: e.target.value })}
                  error={errors.kavlingBaruId}
                  options={[
                    { value: '', label: '-- Pilih Kavling Baru --' },
                    ...availableKavlings.map((k) => ({
                      value: k.id,
                      label: `${k.perumahan?.nama || ''} Blok ${k.blok}-${k.nomorUnit} (Tipe: ${k.namaTipe}) - ${formatRupiah(k.hargaJual)}`
                    }))
                  ]}
                />
                <Input
                  label="Alasan Pindah / Ganti Kavling"
                  name="alasan"
                  value={formData.alasan}
                  onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                  error={errors.alasan}
                  placeholder="Contoh: Customer ingin upgrade ke tipe yang lebih besar..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={gantiKavlingMutation.isPending}
                className="px-6 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                {gantiKavlingMutation.isPending ? "Memproses..." : "Konfirmasi Ganti Kavling"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default GantiKavling;