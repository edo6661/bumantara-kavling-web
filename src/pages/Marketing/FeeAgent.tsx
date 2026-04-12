import React, { useState, useMemo } from "react";
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
import { Edit2 } from "lucide-react";
import {
  useGetFeeAgents,
  useUpdateFeeAgent,
  useUploadBuktiFee,
} from "../../hooks/queries/useFeeAgent";
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
  const updateMutation = useUpdateFeeAgent();
  const uploadMutation = useUploadBuktiFee();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FeeFormState>(initialFormState);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedKavling, setSelectedKavling] = useState<string>("");

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
    { header: "Nama Agent", accessor: "namaAgent" },
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
      bookingTanggal: formatDateForInput(item.bookingTanggal),
      bookingBukti: item.bookingBukti || "",
      closingNominal: item.closingNominal || "",
      closingTanggal: formatDateForInput(item.closingTanggal),
      closingBukti: item.closingBukti || "",
      marketingNominal: item.marketingNominal || "",
      marketingTanggal: formatDateForInput(item.marketingTanggal),
      marketingBukti: item.marketingBukti || "",
    });
    setSelectedAgent(item.namaAgent);
    setSelectedKavling(item.kavling);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "number" ? (value === "" ? "" : Number(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldName]: file }));
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
        uploadPromises.push(
          uploadMutation.mutateAsync({
            id: Number(formData.id),
            type: "bookingBukti",
            file: formData.bookingBukti,
          })
        );
      }

      if (formData.closingBukti instanceof File) {
        uploadPromises.push(
          uploadMutation.mutateAsync({
            id: Number(formData.id),
            type: "closingBukti",
            file: formData.closingBukti,
          })
        );
      }

      if (formData.marketingBukti instanceof File) {
        uploadPromises.push(
          uploadMutation.mutateAsync({
            id: Number(formData.id),
            type: "marketingBukti",
            file: formData.marketingBukti,
          })
        );
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan data fee");
    }
  };


  const expandedRowRender = (row: GroupedAgentFee) => {
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
          Rincian Penjualan Agent: <span className="text-blue-600">{row.namaAgent}</span>
        </h4>
        {row.rincianPenjualan.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Kavling</th>
                  <th className="px-4 py-3 font-bold">No. Transaksi</th>
                  <th className="px-4 py-3 text-right font-bold">Booking Fee</th>
                  <th className="px-4 py-3 text-right font-bold">Closing Fee</th>
                  <th className="px-4 py-3 text-right font-bold">Marketing Fee</th>
                  <th className="px-4 py-3 rounded-r-lg font-bold text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {row.rincianPenjualan.map((feeData) => (
                  <tr key={feeData.id} className="hover:bg-slate-50/50 transition-colors">
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
                      <button
                        onClick={() => openModal(feeData)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer mx-auto"
                      >
                        <Edit2 size={14} /> Kelola
                      </button>
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Kelola Pencairan Fee Agent"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">
                Agent Marketing
              </p>
              <p className="text-lg font-black text-blue-900">
                {selectedAgent}
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">
                Kavling Terjual
              </p>
              <p className="text-sm font-bold text-blue-900">
                {selectedKavling}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">
              1. Booking Fee
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nominal (Rp)"
                name="bookingNominal"
                type="number"
                value={formData.bookingNominal}
                onChange={handleChange}
                placeholder="Contoh: 1000000"
              />
              <Input
                label="Tanggal Transfer"
                name="bookingTanggal"
                type="date"
                value={formData.bookingTanggal}
                onChange={handleChange}
              />
              <FileInput
                label="Bukti Transfer"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, "bookingBukti")}
              />
            </div>
            {formData.bookingBukti &&
              typeof formData.bookingBukti === "string" && (
                <p className="text-xs text-green-600 mt-1">
                  File saat ini sudah diupload. <a href={formData.bookingBukti} target="_blank" rel="noreferrer" className="underline font-bold">Lihat File</a>
                </p>
              )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">
              2. Closing Fee
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nominal (Rp)"
                name="closingNominal"
                type="number"
                value={formData.closingNominal}
                onChange={handleChange}
                placeholder="Contoh: 2500000"
              />
              <Input
                label="Tanggal Transfer"
                name="closingTanggal"
                type="date"
                value={formData.closingTanggal}
                onChange={handleChange}
              />
              <FileInput
                label="Bukti Transfer"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, "closingBukti")}
              />
            </div>
            {formData.closingBukti &&
              typeof formData.closingBukti === "string" && (
                <p className="text-xs text-green-600 mt-1">
                  File saat ini sudah diupload. <a href={formData.closingBukti} target="_blank" rel="noreferrer" className="underline font-bold">Lihat File</a>
                </p>
              )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">
              3. Marketing Fee
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nominal (Rp)"
                name="marketingNominal"
                type="number"
                value={formData.marketingNominal}
                onChange={handleChange}
                placeholder="Contoh: 5000000"
              />
              <Input
                label="Tanggal Transfer"
                name="marketingTanggal"
                type="date"
                value={formData.marketingTanggal}
                onChange={handleChange}
              />
              <FileInput
                label="Bukti Transfer"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, "marketingBukti")}
              />
            </div>
            {formData.marketingBukti &&
              typeof formData.marketingBukti === "string" && (
                <p className="text-xs text-green-600 mt-1">
                  File saat ini sudah diupload. <a href={formData.marketingBukti} target="_blank" rel="noreferrer" className="underline font-bold">Lihat File</a>
                </p>
              )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={updateMutation.isPending || uploadMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || uploadMutation.isPending}
              className="px-6 py-2 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending || uploadMutation.isPending
                ? "Menyimpan..."
                : "Simpan Data Fee"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FeeAgent;