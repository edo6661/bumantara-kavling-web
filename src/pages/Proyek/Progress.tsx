import React, { useState, useMemo, useEffect, useCallback } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import PageLoader from "../PageLoader";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import {
  useAddTahapanLog,
  useGetProgressProyek,
  useUpdateProgressProyek,
  useUploadTahapanPhotos
} from "../../hooks/queries/useProgressProyek";
import { handleApiError } from '../../utils/errorHandler';
import {
  HardHat, UploadCloud, Save, Loader2, Trash2, Edit2, CheckCircle2, Image as ImageIcon
} from 'lucide-react';
import type { TahapanProyekData } from '../../services/progressProyek.service';
import { formatDate } from '../../utils/formatters';


interface ProgressProyekSummary {
  persentase: number;
  pelaksana: string | null;
}

interface PenjualanRow {
  id: string;
  dbId: number;
  nama: string;
  blok: string;
  nomorUnit: string;
  progressProyek: ProgressProyekSummary | null;
  status: string;
}

const TAHAPAN_LIST = [
  'Pondasi', 'Kolom', 'Dinding', 'Atap', 'Lantai',
  'Plafon', 'Pipa', 'Electrical', 'Finishing'
];




const Progress = () => {
  const { data: penjualanResponse, isLoading: loadingPenjualan } = useGetPenjualan({ limit: 500 });

  const penjualanList: PenjualanRow[] = useMemo(() => {
    if (!penjualanResponse?.items) return [];
    return penjualanResponse.items
      .filter((p) => p.status !== 'BATAL')
      .map((p) => ({
        id: p.id,
        dbId: p.dbId,
        nama: p.nama,
        blok: p.blok,
        nomorUnit: p.nomorUnit,
        progressProyek: p.progressProyek ? {
          persentase: Number(p.progressProyek.persentase),
          pelaksana: p.progressProyek.pelaksana
        } : null,
        status: p.status
      }));
  }, [penjualanResponse]);

  const [selectedPenjualan, setSelectedPenjualan] = useState<PenjualanRow | null>(null);

  const columns = [
    {
      header: 'Customer',
      accessor: 'nama',
      render: (val: string) => <span className="font-bold text-slate-900">{val}</span>
    },
    { header: 'Blok', accessor: 'blok' },
    { header: 'Unit', accessor: 'nomorUnit' },
    {
      header: 'Pelaksana',
      accessor: 'progressProyek',
      render: (val: ProgressProyekSummary | null) => (
        <span className="text-slate-600 font-medium">{val?.pelaksana || '-'}</span>
      )
    },
    {
      header: 'Total Progress',
      accessor: 'progressProyek',
      render: (val: ProgressProyekSummary | null) => {
        const persentase = val?.persentase || 0;
        return (
          <div className="flex items-center gap-3">
            <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${persentase === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${persentase}%` }}
              ></div>
            </div>
            <span className="text-xs font-black text-slate-700">{persentase}%</span>
          </div>
        );
      }
    },
    {
      header: 'Aksi',
      accessor: 'dbId',
      render: (_val: number, row: PenjualanRow) => (
        <button
          onClick={() => setSelectedPenjualan(row)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition shadow-sm cursor-pointer"
        >
          <HardHat size={14} /> Kelola Progress
        </button>
      )
    }
  ];

  if (loadingPenjualan) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Laporan Progress Lapangan"
        columns={columns}
        data={penjualanList}
      />

      {selectedPenjualan && (
        <ProgressDetailModal
          isOpen={!!selectedPenjualan}
          onClose={() => setSelectedPenjualan(null)}
          penjualan={selectedPenjualan}
        />
      )}
    </div>
  );
};




interface ProgressDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  penjualan: PenjualanRow;
}

const ProgressDetailModal: React.FC<ProgressDetailModalProps> = ({ isOpen, onClose, penjualan }) => {
  const { data: progressData, isLoading } = useGetProgressProyek(penjualan.dbId);
  const updateMutation = useUpdateProgressProyek();

  const [pelaksana, setPelaksana] = useState<string>('');
  const [selectedTahapanToEdit, setSelectedTahapanToEdit] = useState<string | null>(null);

  useEffect(() => {
    if (progressData) {
      setPelaksana(progressData.pelaksana || '');
    }
  }, [progressData]);

  const handleSavePelaksana = async () => {
    try {
      await updateMutation.mutateAsync({
        id: penjualan.dbId,
        data: { pelaksana }
      });
      alert('Nama pelaksana berhasil disimpan!');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Kelola Progress Lapangan" size="lg">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-sm font-bold text-slate-500 animate-pulse">Memuat detail proyek...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Identitas */}
            <div className="bg-slate-900 p-5 rounded-2xl flex justify-between items-center text-white shadow-md">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kavling</p>
                <h3 className="text-xl font-black">Blok {penjualan.blok}-{penjualan.nomorUnit}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-sm font-bold">{penjualan.nama}</p>
              </div>
            </div>

            {/* Form Pelaksana */}
            <div className="bg-white p-4 border border-slate-200 rounded-2xl flex items-end gap-3 shadow-sm">
              <div className="flex-1">
                <Input
                  label="Nama Pelaksana / Kontraktor"
                  name="pelaksana"
                  value={pelaksana}
                  onChange={(e) => setPelaksana(e.target.value)}
                  placeholder="Masukkan nama kontraktor/mandor..."
                />
              </div>
              <button
                onClick={handleSavePelaksana}
                disabled={updateMutation.isPending}
                className="mb-4 px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Pelaksana'}
              </button>
            </div>

            {/* Tabel Detail Tahapan */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                      <th className="px-5 py-4 font-bold">Tahapan</th>
                      <th className="px-5 py-4 font-bold">Progress</th>
                      <th className="px-5 py-4 font-bold">Tanggal Update</th>
                      <th className="px-5 py-4 font-bold">Deskripsi</th>
                      <th className="px-5 py-4 font-bold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {TAHAPAN_LIST.map((tahapan) => {
                      // 🔥 Ubah cara mencari tData dari .find() menjadi ambil yang paling baru
                      const tDataLogs = progressData?.tahapan.filter((t) => t.namaTahapan === tahapan) || [];
                      const tData = tDataLogs.sort((a, b) => {
                        const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
                        if (dateDiff !== 0) return dateDiff;
                        return (b.id || 0) - (a.id || 0);
                      })[0];

                      const isCompleted = tData && tData.persentase > 0;
                      return (
                        <tr key={tahapan} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <span className={`font-bold ${isCompleted ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {tahapan}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {tData ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-200 rounded-full h-1.5">
                                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${tData.persentase}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-700">{tData.persentase}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Belum dimulai</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {tData ? (
                              <span className="text-xs font-medium text-slate-600">{formatDate(tData.tanggal)}</span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {tData?.deskripsi ? (
                              <p className="text-xs text-slate-600 line-clamp-2 max-w-[200px]" title={tData.deskripsi}>
                                {tData.deskripsi}
                              </p>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => setSelectedTahapanToEdit(tahapan)}
                              className="px-4 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 mx-auto"
                            >
                              <Edit2 size={12} /> Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup Manajemen Progress
              </button>
            </div>
          </div>
        )}
      </Modal>

      {selectedTahapanToEdit && (
        <EditTahapanModal
          isOpen={!!selectedTahapanToEdit}
          onClose={() => setSelectedTahapanToEdit(null)}
          penjualanDbId={penjualan.dbId}
          namaTahapan={selectedTahapanToEdit}
          tahapanData={progressData?.tahapan.find((t) => t.namaTahapan === selectedTahapanToEdit)}
          progressData={progressData} // <--- Tambahkan properti ini
        />
      )}
    </>
  );
};




interface EditTahapanModalProps {
  isOpen: boolean;
  onClose: () => void;
  penjualanDbId: number;
  namaTahapan: string;
  tahapanData?: TahapanProyekData;
  progressData: any;
}

const EditTahapanModal: React.FC<EditTahapanModalProps> = ({
  isOpen,
  onClose,
  penjualanDbId,
  namaTahapan,
  tahapanData, progressData
}) => {
  const updateMutation = useUpdateProgressProyek();
  const uploadPhotoMutation = useUploadTahapanPhotos();
  const addLogMutation = useAddTahapanLog(); // Gunakan hook baru


  const [formData, setFormData] = useState({
    persentase: 0,
    deskripsi: '',
    tanggal: new Date().toISOString().split('T')[0]!,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (progressData?.tahapan) {
      // 🔥 Perbaiki cara cari log terbaru
      const logTerbaru = progressData.tahapan
        .filter((t: any) => t.namaTahapan === namaTahapan)
        .sort((a: any, b: any) => {
          const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (b.id || 0) - (a.id || 0); // Gunakan ID sebagai penentu terakhir
        })[0];

      if (logTerbaru) {
        setFormData({
          persentase: Number(logTerbaru.persentase),
          deskripsi: '', // Kosongkan deskripsi untuk log baru
          tanggal: new Date().toISOString().split('T')[0]!,
        });
      }
    }
  }, [progressData, namaTahapan, isOpen]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((f: File) => f.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(files => files.filter((_, index) => index !== indexToRemove));
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.persentase < 0 || formData.persentase > 100) return;

    try {
      await addLogMutation.mutateAsync({
        id: penjualanDbId,
        namaTahapan: namaTahapan,
        persentase: formData.persentase,
        deskripsi: formData.deskripsi,
        tanggal: formData.tanggal,
        files: selectedFiles
      });
      alert(`Log progres ${namaTahapan} berhasil ditambahkan!`);
      // Jangan onClose() agar user bisa langsung lihat riwayatnya
      setSelectedFiles([]);
      setFormData(prev => ({ ...prev, persentase: 0, deskripsi: '' }));
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const isSaving = updateMutation.isPending || uploadPhotoMutation.isPending || addLogMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detail Tahapan: ${namaTahapan}`} size="md">
      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <label className="text-[11px] font-bold text-indigo-800 uppercase tracking-widest mb-2 block">
            Update Persentase Pembangunan
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.persentase}
              onChange={(e) => setFormData({ ...formData, persentase: Number(e.target.value) })}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={formData.persentase}
              onChange={(e) => setFormData({ ...formData, persentase: Number(e.target.value) })}
              className="w-16 px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-black text-indigo-700 text-center outline-none"
            />
            <span className="font-bold text-indigo-600">%</span>
          </div>
        </div>

        <Input
          label="Tanggal Laporan"
          type="date"
          name="tanggal"
          value={formData.tanggal}
          onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Deskripsi
          </label>
          <textarea
            value={formData.deskripsi}
            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[100px] text-slate-900"
            placeholder={`Ketik catatan kondisi pengerjaan ${namaTahapan}...`}
          ></textarea>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Galeri Foto Dokumentasi
          </label>

          {/* Dropzone Multi Upload */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all outline-none
              ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
            `}
          >
            <UploadCloud size={28} className={`mb-2 ${dragActive ? 'text-indigo-600' : 'text-slate-400'}`} />
            <p className="text-xs font-medium text-slate-600 mb-1">Tarik & lepas gambar ke sini</p>
            <p className="text-[10px] text-slate-400 font-medium mb-3">Bisa memilih lebih dari 1 file</p>

            <label className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-50 transition shadow-sm">
              Pilih Foto
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>

          {/* Foto Baru (Pending Upload) */}
          {selectedFiles.length > 0 && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Foto Siap Diunggah ({selectedFiles.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-amber-300 group">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-slate-800 shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
            ) : (
              <> Simpan Data</>
            )}
          </button>
        </div>
      </form>
      <div className="mt-8 border-t border-slate-200 pt-6">
        <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest text-[11px]">
          Riwayat Progress: {namaTahapan}
        </h4>

        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left text-sm border-collapse bg-white">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-center">Progress</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3 text-center">Dokumentasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {progressData?.tahapan
                .filter((t: any) => t.namaTahapan === namaTahapan)
                .sort((a: any, b: any) => {
                  // 🔥 Perbaiki logika sort
                  const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
                  if (dateDiff !== 0) return dateDiff;
                  return (b.id || 0) - (a.id || 0);
                })
                .map((log: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {formatDate(log.tanggal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {log.persentase}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate" title={log.deskripsi || ''}>
                      {log.deskripsi || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center -space-x-2">
                        {log.foto.map((url, fIdx) => (
                          <a
                            key={fIdx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm hover:z-10 hover:scale-110 transition-transform"
                          >
                            <img src={url} alt="Foto" className="w-full h-full object-cover" />
                          </a>
                        ))}
                        {log.foto.length === 0 && <span className="text-slate-300 text-xs">-</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              {(!progressData?.tahapan.find(t => t.namaTahapan === namaTahapan)) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-slate-400 italic">
                    Belum ada riwayat progres untuk tahapan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default Progress;