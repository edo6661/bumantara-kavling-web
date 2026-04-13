import React, { useRef, useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import PageLoader from "../PageLoader";
import { FileText, Clock, PenTool } from 'lucide-react';
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import { formatRupiah } from "../../utils/formatters";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import SignatureCanvas from 'react-signature-canvas';

const SPR = () => {
  const { data: penjualanData = [], isLoading } = useGetPenjualan();

  // State untuk Modal Tanda Tangan
  const [isTtdModalOpen, setIsTtdModalOpen] = useState(false);
  const [selectedSpr, setSelectedSpr] = useState<any>(null);

  // Tambahkan state 'sebagai' untuk opsi penandatangan
  const [ttdData, setTtdData] = useState({
    nama: '',
    tanggal: new Date().toISOString().split('T')[0],
    sebagai: 'Pemesan'
  });

  const sigCanvas = useRef<SignatureCanvas>(null);

  const clearSignature = () => sigCanvas.current?.clear();

  const saveSignature = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Tanda tangan tidak boleh kosong!");
      return;
    }
    if (!ttdData.nama.trim()) {
      alert("Nama penandatangan wajib diisi!");
      return;
    }

    // PERBAIKAN ERROR: Gunakan getCanvas() asli, bukan getTrimmedCanvas() agar tidak error di Vite
    const canvas = sigCanvas.current?.getCanvas();
    if (!canvas) return;

    // Convert ke Base64 PNG
    const signatureBase64 = canvas.toDataURL('image/png');

    // TODO: Kirim data ini ke Backend API
    // Contoh payload: { idPenjualan: selectedSpr.id, signatureBase64, nama: ttdData.nama, peran: ttdData.sebagai }
    console.log("Data TTD yang siap dikirim:", {
      idTransaksi: selectedSpr?.id,
      ...ttdData,
      signatureBase64
    });

    alert(`Tanda tangan ${ttdData.sebagai} berhasil disimpan! (Cek console log)`);

    setIsTtdModalOpen(false);
    setSelectedSpr(null);
  };

  const columns = [
    { header: 'No. Transaksi', accessor: 'id' },
    { header: 'Nama Customer', accessor: 'nama' },
    { header: 'Perumahan', accessor: 'perumahan' },
    {
      header: 'Kavling',
      accessor: 'blok',
      render: (_: unknown, row: any) => <span className="font-medium text-slate-700">{row.blok} - {row.nomorUnit}</span>
    },
    {
      header: 'Harga Jual',
      accessor: 'hargaJual',
      render: (val: number) => formatRupiah(val)
    },
    {
      header: 'Dokumen SPR',
      accessor: 'fileSpr',
      render: (val: string | null, row: any) => (
        <div className="flex items-center gap-2">
          {val ? (
            <a
              href={val}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors w-max shadow-sm"
            >
              <FileText size={14} /> Lihat PDF SPR
            </a>
          ) : (
            <span className="text-amber-700 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 w-max">
              <Clock size={14} /> Menunggu SPR
            </span>
          )}

          <button
            onClick={() => {
              setSelectedSpr(row);
              setTtdData({
                nama: row.nama,
                tanggal: new Date().toISOString().split('T')[0],
                sebagai: 'Pemesan' // Default value saat modal dibuka
              });
              setIsTtdModalOpen(true);

              // Beri jeda sedikit agar canvas terender dulu sebelum dicover clear
              setTimeout(() => clearSignature(), 100);
            }}
            className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors w-max shadow-sm cursor-pointer"
          >
            <PenTool size={14} /> TTD Digital
          </button>
        </div>
      )
    },
  ];

  const activeSprData = penjualanData.filter((p: any) => p.status !== 'BATAL');

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Dokumen Surat Pesanan Rumah (SPR)"
        columns={columns}
        data={activeSprData}
      />

      {/* MODAL TANDA TANGAN DIGITAL */}
      <Modal isOpen={isTtdModalOpen} onClose={() => setIsTtdModalOpen(false)} title="Tanda Tangan Digital SPR">
        <div className="space-y-5">

          {/* PERUBAHAN: Ditambahkan pilihan "Sebagai" (Pemesan/Marketing/dll) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Sebagai"
              name="sebagai"
              value={ttdData.sebagai}
              onChange={(e) => setTtdData({ ...ttdData, sebagai: e.target.value })}
              options={[
                { value: 'Pemesan', label: 'Pemesan' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Supervisor', label: 'Supervisor' },
                { value: 'Manager', label: 'Manager' },
              ]}
            />
            <Input
              label="Nama Penandatangan"
              value={ttdData.nama}
              onChange={(e) => setTtdData({ ...ttdData, nama: e.target.value })}
              placeholder="Masukkan nama..."
            />
            <Input
              label="Tanggal Tanda Tangan"
              type="date"
              value={ttdData.tanggal}
              onChange={(e) => setTtdData({ ...ttdData, tanggal: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wider ml-1 mb-2 block">
              Area Tanda Tangan
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ width: 600, height: 200, className: 'sigCanvas w-full cursor-crosshair' }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-xs font-medium text-slate-400">Pastikan tanda tangan berada di dalam kotak.</p>
              <button
                type="button"
                onClick={clearSignature}
                className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer transition-colors"
              >
                Hapus / Ulangi
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setIsTtdModalOpen(false)}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={saveSignature}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors"
            >
              Simpan Tanda Tangan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SPR;