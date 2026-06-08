/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "../shared/Modal";
import { formatDate, formatRupiah, formatTanpaDesimal } from "../../utils/formatters";
import { Clock } from "lucide-react";

export interface PenjualanDetailData {
  nama: string;
  noIdentitas: string;
  noTelepon?: string;
  agent: string;
  alamat: string;
  perumahan: string;
  blok: string;
  nomorUnit: string;
  tipe?: string;
  luasTanah?: number;
  luasBangunan?: number;
  caraPembayaran?: string | null;
  hargaDasar?: number;
  diskonPenjualan?: number;
  bookingFee?: number;
  dp?: number;
  biayaKpr?: number;
  plafonKredit?: number;
  tambahanKpr?: { nama: string; nominal: number }[];
  nilaiPengajuanKpr?: number;
  plafonAcc?: number;
  dpTidakDibayar?: number;
  dpDibayar?: number;
  hargaJual?: number;
  tagihan?: any[];
  riwayatSpr?: any[];
}

interface PenjualanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detailData: PenjualanDetailData | null;
  title?: string;
  isLoading?: boolean;
}

const PenjualanDetailModal = ({
  isOpen,
  onClose,
  detailData,
  title = "Detail Informasi Transaksi",
  isLoading = false,
}: PenjualanDetailModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm font-bold text-slate-500 animate-pulse">Memuat detail transaksi...</p>
        </div>
      )}
      {!isLoading && detailData && (
        <div className="space-y-2">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">1. Data Pembeli & Marketing</h4>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nama Customer</p>
                <p className="text-sm font-bold text-slate-900">{detailData.nama}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">No Identitas (NIK)</p>
                <p className="text-sm font-medium text-slate-800 tabular-nums">{detailData.noIdentitas}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">No Telepon</p>
                <p className="text-sm font-medium text-slate-800 tabular-nums">{detailData.noTelepon || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Agent Marketing</p>
                <p className="text-sm font-bold text-blue-600">{detailData.agent}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Alamat Domisili</p>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">{detailData.alamat}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">2. Data Kavling</h4>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Perumahan</p>
                <p className="text-sm font-bold text-slate-900">{detailData.perumahan}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Blok & Nomor Unit</p>
                <p className="text-sm font-bold text-slate-900">Blok {detailData.blok} - {detailData.nomorUnit}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Tipe Unit</p>
                <p className="text-sm font-medium text-slate-800">{detailData.tipe || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dimensi</p>
                <p className="text-sm font-medium text-slate-800 tabular-nums">LT: {detailData.luasTanah} m² / LB: {detailData.luasBangunan} m²</p>
              </div>
            </div>
          </div>

          {detailData.caraPembayaran ? (
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-3">
                3. Kalkulasi Transaksi ({detailData.caraPembayaran})
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-300">Harga Dasar Kavling</span>
                  <span className="font-bold text-white tabular-nums">{formatRupiah(detailData.hargaDasar || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-300">- Diskon Penjualan</span>
                  <span className="font-bold text-red-400 tabular-nums">{formatRupiah(detailData.diskonPenjualan || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-300">- Booking Fee</span>
                  <span className="font-bold text-red-400 tabular-nums">{formatRupiah(detailData.bookingFee || 5000000)}</span>
                </div>

                {detailData.caraPembayaran === 'CASH BERTAHAP' && (
                  <>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="font-medium text-slate-300">- DP (Down Payment)</span>
                      <span className="font-bold text-orange-400 tabular-nums">{formatRupiah(detailData.dp || 0)}</span>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mt-3 mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-blue-400">Sisa Pembayaran</span>
                        <span className="text-sm font-bold text-emerald-400 tabular-nums">
                          {formatRupiah(Math.max(0, (detailData.hargaDasar || 0) - (detailData.diskonPenjualan || 0) - (detailData.dp || 0)))}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Kalkulasi:</strong> Harga Jual - DP
                      </p>
                    </div>
                  </>
                )}

                {detailData.caraPembayaran === 'KPR' && (
                  <>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-blue-400">Biaya KPR (6%)</span>
                        <span className="text-sm font-bold text-blue-400 tabular-nums">{formatRupiah(detailData.biayaKpr || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Kalkulasi:</strong> Plafon Awal × 6%
                      </p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-blue-400">Plafon Kredit</span>
                        <span className="text-sm font-bold text-blue-400 tabular-nums">{formatRupiah(detailData.plafonKredit || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Kalkulasi:</strong> Plafon Awal + Biaya KPR
                      </p>
                    </div>

                    {detailData.tambahanKpr && detailData.tambahanKpr.length > 0 && (
                      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-blue-400">Tambahan Nilai KPR (Furnish, dll)</span>
                        </div>
                        {detailData.tambahanKpr.map((kprItem, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-slate-300">- {kprItem.nama}</span>
                            <span className="font-bold text-blue-400 tabular-nums">{formatRupiah(kprItem.nominal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-purple-400">Nilai Pengajuan KPR</span>
                        <span className="text-sm font-bold text-purple-400 tabular-nums">{formatRupiah(detailData.nilaiPengajuanKpr || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Kalkulasi:</strong> Plafon Kredit - Total Biaya Tambahan + Tambahan Nilai KPR
                      </p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-blue-400">Plafon ACC Bank</span>
                        <span className="text-sm font-bold text-blue-400 tabular-nums">{formatRupiah(detailData.plafonAcc || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Info:</strong> Nilai ACC yang disetujui pihak Bank KPR
                      </p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-orange-400">DP Tidak Dibayar 10%</span>
                        <span className="text-sm font-bold text-orange-400 tabular-nums">{formatTanpaDesimal(detailData.dpTidakDibayar || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Kalkulasi:</strong> ((Harga Jual - Diskon) × 10%) - Booking Fee
                      </p>
                    </div>

                    {detailData.dpDibayar && detailData.dpDibayar > 0 ? (
                      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 shadow-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-emerald-400">DP Dibayar</span>
                          <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatTanpaDesimal(detailData.dpDibayar)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          <strong className="text-slate-400">Info:</strong> Nilai DP manual yang disepakati untuk dibayarkan.
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4" />
                    )}
                  </>
                )}

                <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black text-emerald-400 uppercase tracking-wider">Harga Jual</span>
                    <span className="text-xl font-black text-emerald-400 tabular-nums">{formatRupiah(detailData.hargaJual || 0)}</span>
                  </div>
                  <p className="text-[10px] text-emerald-600/70 font-mono">
                    <strong className="text-emerald-500/80">Kalkulasi:</strong>{" "}
                    {detailData.caraPembayaran === 'KPR'
                      ? '(Plafon Kredit / 0.9) + Diskon Penjualan + Tambahan Nilai KPR'
                      : 'Harga Dasar - Diskon Penjualan'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm text-center mt-4">
              <p className="text-sm font-bold text-slate-500 italic">Skema pembayaran belum ditentukan.</p>
            </div>
          )}

          {(() => {
            const biayaTambahanList = detailData.tagihan?.filter((t: any) => t.noTagihan?.startsWith('INV-ADD-')) || [];
            if (biayaTambahanList.length === 0) return null;

            const totalBiayaTambahan = biayaTambahanList.reduce((acc: number, curr: any) => acc + Number(curr.nominal || 0), 0);

            return (
              <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 shadow-md">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Biaya Lainnya / Tambahan</p>
                <div className="space-y-3">
                  {biayaTambahanList.map((biaya: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <div>
                        <span className="font-medium text-slate-300">+ {biaya.pembayaran}</span>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> Dibuat: {formatDate(biaya.createdAt || biaya.jatuhTempo)}
                        </p>
                      </div>
                      <span className="font-bold text-amber-400 tabular-nums">{formatRupiah(biaya.nominal || 0)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm mt-4 pt-3 border-t border-slate-700">
                  <span className="font-bold text-amber-300">Total Biaya Tambahan</span>
                  <span className="font-black text-amber-400 tabular-nums">{formatRupiah(totalBiayaTambahan)}</span>
                </div>
              </div>
            );
          })()}

          {detailData.riwayatSpr && detailData.riwayatSpr.length > 0 && (
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 mt-4">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
                Riwayat Perubahan Dokumen SPR
              </h4>
              <div className="divide-y divide-slate-100">
                {detailData.riwayatSpr.map((riwayat: any, idx: number) => (
                  <div key={idx} className="py-3 flex justify-between items-center group">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{riwayat.keterangan || 'Update Dokumen'}</p>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {formatDate(riwayat.createdAt)}
                      </p>
                    </div>
                    <a
                      href={riwayat.fileSpr}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all border border-slate-200 shadow-sm"
                    >
                      Lihat PDF Lama
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-slate-200 -mx-4 -mb-4 mt-4 z-20">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}
      {!isLoading && !detailData && isOpen && (
        <div className="py-8 text-center">
          <p className="text-sm font-bold text-slate-500">Data penjualan tidak ditemukan.</p>
        </div>
      )}
    </Modal>
  );
};

export default PenjualanDetailModal;
