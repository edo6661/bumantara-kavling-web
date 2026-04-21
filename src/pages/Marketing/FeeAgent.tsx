/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
import { Edit2, Eye, ZoomIn } from "lucide-react";
import {
  useGetFeeAgents,
  useUpdateFeeAgent,
  useUploadBuktiFee,
} from "../../hooks/queries/useFeeAgent";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import type { FeeAgentData } from "../../services/feeAgent.service";

interface FeeFormState {
  id: number | "";
  bookingNominal: number | "";
  bookingTanggal: string;
  bookingBukti: string | File;
  closingNominal: number | "";
  closingTanggal: string;
  closingBukti: string | File;
  marketingNominal: number | "";
  marketingTanggal: string;
  marketingBukti: string | File;
}

const initialFormState: FeeFormState = {
  id: "",
  bookingNominal: "",
  bookingTanggal: "",
  bookingBukti: "",
  closingNominal: "",
  closingTanggal: "",
  closingBukti: "",
  marketingNominal: "",
  marketingTanggal: "",
  marketingBukti: "",
};

interface GroupedAgentFee {
  agentId: number;
  namaAgent: string;
  totalPenjualan: number;
  totalBookingFee: number;
  totalClosingFee: number;
  totalMarketingFee: number;
  rincianPenjualan: FeeAgentData[];
}

const FeeAgent = () => {
  const { data: feeData = [], isLoading } = useGetFeeAgents();
  const { data: penjualanResponse } = useGetPenjualan({ limit: 500 });
  const penjualanList = penjualanResponse?.items || [];

  const updateMutation = useUpdateFeeAgent();
  const uploadMutation = useUploadBuktiFee();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FeeFormState>(initialFormState);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedKavling, setSelectedKavling] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // State untuk Detail Penjualan dan Lightbox Gambar
  const [selectedDetailPenjualan, setSelectedDetailPenjualan] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const groupedData = useMemo(() => {
    const groups: Record<number, GroupedAgentFee> = {};

    feeData.forEach((item) => {
      if (!groups[item.agentId]) {
        groups[item.agentId] = {
          agentId: item.agentId,
          namaAgent: item.namaAgent,
          totalPenjualan: 0,
          totalBookingFee: 0,
          totalClosingFee: 0,
          totalMarketingFee: 0,
          rincianPenjualan: [],
        };
      }

      groups[item.agentId].totalPenjualan += 1;
      groups[item.agentId].totalBookingFee += item.bookingNominal || 0;
      groups[item.agentId].totalClosingFee += item.closingNominal || 0;
      groups[item.agentId].totalMarketingFee += item.marketingNominal || 0;
      groups[item.agentId].rincianPenjualan.push(item);
    });

    return Object.values(groups);
  }, [feeData]);

  const columns = [
    { header: "Nama Agent", accessor: "namaAgent", render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    {
      header: "Total Penjualan",
      accessor: "totalPenjualan",
      render: (val: number) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
          {val} Unit
        </span>
      )
    },
    {
      header: "Total Booking Fee",
      accessor: "totalBookingFee",
      render: (val: number) => formatRupiah(val),
    },
    {
      header: "Total Closing Fee",
      accessor: "totalClosingFee",
      render: (val: number) => formatRupiah(val),
    },
    {
      header: "Total Marketing Fee",
      accessor: "totalMarketingFee",
      render: (val: number) => formatRupiah(val),
    },
  ];

  const openModal = (item: FeeAgentData) => {
    setFormData({
      id: item.id,
      bookingNominal: item.bookingNominal || "",
      bookingTanggal: formatDateForInput(item.bookingTanggal as unknown as string),
      bookingBukti: item.bookingBukti || "",
      closingNominal: item.closingNominal || "",
      closingTanggal: formatDateForInput(item.closingTanggal as unknown as string),
      closingBukti: item.closingBukti || "",
      marketingNominal: item.marketingNominal || "",
      marketingTanggal: formatDateForInput(item.marketingTanggal as unknown as string),
      marketingBukti: item.marketingBukti || "",
    });
    setSelectedAgent(item.namaAgent);
    setSelectedKavling(item.kavling);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "number" ? (value === "" ? "" : Number(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Hanya format gambar yang diperbolehkan!");
        e.target.value = "";
        return;
      }
      setFormData((prev) => ({ ...prev, [fieldName]: file }));
      if (errors[fieldName]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        id: Number(formData.id),
        data: {
          bookingNominal: Number(formData.bookingNominal) || undefined,
          bookingTanggal: formData.bookingTanggal || undefined,
          closingNominal: Number(formData.closingNominal) || undefined,
          closingTanggal: formData.closingTanggal || undefined,
          marketingNominal: Number(formData.marketingNominal) || undefined,
          marketingTanggal: formData.marketingTanggal || undefined,
        },
      });

      const uploadPromises = [];

      if (formData.bookingBukti instanceof File) {
        uploadPromises.push(uploadMutation.mutateAsync({ id: Number(formData.id), type: "bookingBukti", file: formData.bookingBukti }));
      }

      if (formData.closingBukti instanceof File) {
        uploadPromises.push(uploadMutation.mutateAsync({ id: Number(formData.id), type: "closingBukti", file: formData.closingBukti }));
      }

      if (formData.marketingBukti instanceof File) {
        uploadPromises.push(uploadMutation.mutateAsync({ id: Number(formData.id), type: "marketingBukti", file: formData.marketingBukti }));
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      closeModal();
    } catch (error: any) {
      const responseData = error.response?.data;

      if (responseData?.error && Array.isArray(responseData.error)) {
        const backendErrors: Record<string, string> = {};
        responseData.error.forEach((err: { field: string; message: string }) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else {
        alert(responseData?.message || 'Terjadi kesalahan saat menyimpan data');
      }
    }
  };

  // Helper untuk merender thumbnail di form modal edit
  const renderThumbnail = (fileUrl: string | File) => {
    if (!fileUrl || fileUrl instanceof File) return null;
    return (
      <div
        onClick={() => setPreviewImage(fileUrl as string)}
        className="mt-3 relative w-16 h-12 rounded-lg border border-slate-200 overflow-hidden cursor-zoom-in group shadow-sm bg-slate-100"
      >
        <img src={fileUrl} alt="Bukti" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <ZoomIn size={14} className="text-white" />
        </div>
      </div>
    );
  };

  const expandedRowRender = (row: GroupedAgentFee) => {
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Rincian Penjualan Agent: <span className="text-blue-600">{row.namaAgent}</span>
        </h4>
        {row.rincianPenjualan.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Kavling</th>
                  <th className="px-4 py-3 font-bold">No. Transaksi</th>
                  <th className="px-4 py-3 text-right font-bold">Booking Fee</th>
                  <th className="px-4 py-3 text-right font-bold">Closing Fee</th>
                  <th className="px-4 py-3 text-right font-bold">Marketing Fee</th>
                  <th className="px-4 py-3 rounded-r-lg font-bold text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {row.rincianPenjualan.map((feeData) => (
                  <tr key={feeData.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3 font-bold text-slate-900">{feeData.namaCustomer}</td>
                    <td className="px-4 py-3 text-slate-600">{feeData.kavling}</td>
                    <td className="px-4 py-3 font-medium text-slate-500">{feeData.noTransaksi}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-right">
                      {feeData.bookingNominal ? formatRupiah(feeData.bookingNominal) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-right">
                      {feeData.closingNominal ? formatRupiah(feeData.closingNominal) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-right">
                      {feeData.marketingNominal ? formatRupiah(feeData.marketingNominal) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            const detail = penjualanList.find((p: any) => p.id === feeData.noTransaksi);
                            setSelectedDetailPenjualan(detail || feeData);
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Lihat Detail Penjualan"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openModal(feeData)}
                          className="p-2 text-slate-500 hover:text-black hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                          title="Edit / Kelola Fee"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada penjualan untuk agent ini.
          </p>
        )}
      </div>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Rekap Fee Agent"
        columns={columns}
        data={groupedData}
        expandedRowRender={expandedRowRender}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Kelola Pencairan Fee Agent">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Agent Marketing</p>
              <p className="text-lg font-black text-blue-900">{selectedAgent}</p>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Kavling Terjual</p>
              <p className="text-sm font-bold text-blue-900">{selectedKavling}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">1. Booking Fee</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Nominal (Rp)" name="bookingNominal" type="number" value={formData.bookingNominal} onChange={handleChange} error={errors.bookingNominal} placeholder="Contoh: 1000000" />
              <Input label="Tanggal Transfer" name="bookingTanggal" type="date" value={formData.bookingTanggal} error={errors.bookingTanggal} onChange={handleChange} />
              <div>
                <FileInput label="Bukti Transfer" accept="image/*" onChange={(e) => handleFileChange(e, "bookingBukti")} error={errors.bookingBukti} />
                {renderThumbnail(formData.bookingBukti)}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">2. Closing Fee</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Nominal (Rp)" name="closingNominal" type="number" value={formData.closingNominal} error={errors.closingNominal} onChange={handleChange} placeholder="Contoh: 2500000" />
              <Input label="Tanggal Transfer" name="closingTanggal" type="date" value={formData.closingTanggal} onChange={handleChange} error={errors.closingBukti} />
              <div>
                <FileInput label="Bukti Transfer" accept="image/*" onChange={(e) => handleFileChange(e, "closingBukti")} />
                {renderThumbnail(formData.closingBukti)}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">3. Marketing Fee</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Nominal (Rp)" name="marketingNominal" type="number" value={formData.marketingNominal} onChange={handleChange} error={errors.marketingNominal} placeholder="Contoh: 5000000" />
              <Input label="Tanggal Transfer" name="marketingTanggal" type="date" value={formData.marketingTanggal} onChange={handleChange} error={errors.marketingTanggal} />
              <div>
                <FileInput label="Bukti Transfer" accept="image/*" onChange={(e) => handleFileChange(e, "marketingBukti")} error={errors.marketingBukti} />
                {renderThumbnail(formData.marketingBukti)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} disabled={updateMutation.isPending || uploadMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors">Batal</button>
            <button type="submit" disabled={updateMutation.isPending || uploadMutation.isPending} className="px-6 py-2 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors">
              {updateMutation.isPending || uploadMutation.isPending ? "Menyimpan..." : "Simpan Data Fee"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL LIGHTBOX PREVIEW GAMBAR */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen / Bukti">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20">Tutup</button>
          </div>
        </div>
      </Modal>

      {/* MODAL DETAIL PENJUALAN */}
      <Modal isOpen={!!selectedDetailPenjualan} onClose={() => setSelectedDetailPenjualan(null)} title="Informasi Transaksi Penjualan">
        {selectedDetailPenjualan && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer / Pembeli</p>
                  <p className="text-lg font-black text-slate-900">{selectedDetailPenjualan.nama || selectedDetailPenjualan.namaCustomer || '-'}</p>
                  <p className="text-sm text-slate-500 font-medium">Transaksi: {selectedDetailPenjualan.id || selectedDetailPenjualan.noTransaksi}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${(selectedDetailPenjualan.status || 'PROSES') === 'LUNAS' ? 'bg-green-100 text-green-800' : (selectedDetailPenjualan.status || '') === 'BATAL' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {selectedDetailPenjualan.status || 'PROSES'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kavling</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.perumahan || selectedDetailPenjualan.kavling?.split(' ')?.[0] || '-'} Blok {selectedDetailPenjualan.blok || selectedDetailPenjualan.kavling?.split('Blok ')?.[1] || '-'}
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
                    {selectedDetailPenjualan.tanggal ? new Date(selectedDetailPenjualan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedDetailPenjualan(null)} className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black transition-colors cursor-pointer shadow-md">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default FeeAgent;