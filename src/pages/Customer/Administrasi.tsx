/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import SignatureCanvas from 'react-signature-canvas';
import { formatRupiah, formatDate } from "../../utils/formatters";
import { useGetPenjualan, useUploadSignature } from "../../hooks/queries/usePenjualan";
import {
  ShoppingCart, ZoomIn, ImageIcon, PlusCircle, FileUp,
  Eye, Edit2, UploadCloud, Trash2,
  FileText, Share2, PenTool, AlertCircle,
  Key,
  LinkIcon
} from "lucide-react";
import {
  useGetCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useUploadCustomerDoc, useGenerateCustomerAccount
} from "../../hooks/queries/useCustomer";
import type { CustomerData, CreateCustomerDTO, CustomerDocType } from "../../services/customer.service";

const initialFormState: CreateCustomerDTO = {
  nikKtp: '',
  nama: '',
  noHp: '',
  email: '',
  pekerjaan: '',
  perusahaan: '',
  bank: '',
  alamatKtp: '',
  alamatTinggal: '',
  alamatKoresponden: ''
};

const Administrasi = () => {
  const { data: customers = [], isLoading } = useGetCustomers();
  const { data: penjualanResponse, isLoading: isLoadingPenjualan } = useGetPenjualan({ limit: 500 });
  const penjualanData = penjualanResponse?.items || [];

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const uploadMutation = useUploadCustomerDoc();
  const generateAccountMutation = useGenerateCustomerAccount();
  const uploadSignatureMutation = useUploadSignature();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [formData, setFormData] = useState<CreateCustomerDTO>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCustomerDTO, string>>>({});
  const [newDocName, setNewDocName] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);


  const [isTtdModalOpen, setIsTtdModalOpen] = useState(false);
  const [selectedSpr, setSelectedSpr] = useState<any>(null);
  const [ttdData, setTtdData] = useState({
    nama: '',
    tanggal: new Date().toISOString().split('T')[0],
    sebagai: 'Pemesan'
  });
  const handleCopyBankLink = (row: CustomerData) => {
    const link = `${window.location.origin}/customer-detail/${row.id}`;
    const message = link;
    navigator.clipboard.writeText(message);
    alert('Tautan akses Bank berhasil disalin! Silakan paste (Ctrl+V) di WhatsApp.');
  };
  const sigCanvas = useRef<SignatureCanvas>(null);

  const currentCustomer = customers.find(c => c.id === selectedCustomer?.id) || selectedCustomer;

  const columns = [
    { header: 'Nama Lengkap', accessor: 'nama', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    {
      header: 'Blok',
      accessor: 'id',
      render: (_: any, row: CustomerData) => {
        const customerSales = penjualanData.filter((p: any) => p.noIdentitas === row.nikKtp && p.status !== 'BATAL');
        if (customerSales.length === 0) return <span className="text-slate-400 text-xs italic">-</span>;
        return (
          <div className="flex flex-col gap-1">
            {customerSales.map((sale: any) => (
              <span key={`blok-${sale.id}`} className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit">
                {sale.blok}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'No',
      accessor: 'id',
      render: (_: any, row: CustomerData) => {
        const customerSales = penjualanData.filter((p: any) => p.noIdentitas === row.nikKtp && p.status !== 'BATAL');
        if (customerSales.length === 0) return <span className="text-slate-400 text-xs italic">-</span>;
        return (
          <div className="flex flex-col gap-1">
            {customerSales.map((sale: any) => (
              <span key={`unit-${sale.id}`} className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit">
                {sale.nomorUnit}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: any, row: CustomerData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openDetailModal(row); }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
            title="Detail Data"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer"
            title="Edit Administrasi"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openUploadModal(row); }}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all cursor-pointer"
            title="Upload Dokumen"
          >
            <UploadCloud size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleGenerateAccount(row); }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${row.hasAccount
              ? 'text-green-600 bg-green-50'
              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
              }`}
            title={row.hasAccount ? "Sudah Memiliki Akun" : "Buat Akun Portal (Generate)"}
            disabled={row.hasAccount}
          >
            <Key size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCopyBankLink(row); }}
            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-all cursor-pointer"
            title="Salin Tautan Akses Bank"
          >
            <LinkIcon size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
            title="Hapus"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];





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

    const canvas = sigCanvas.current?.getCanvas();
    if (!canvas) return;

    const signatureBase64 = canvas.toDataURL('image/png');

    try {
      await uploadSignatureMutation.mutateAsync({
        noTransaksi: selectedSpr.id,
        signatureBase64,
        nama: ttdData.nama,
        peran: ttdData.sebagai,
        tanggal: ttdData.tanggal,
      });

      alert(`Tanda tangan ${ttdData.sebagai} berhasil disimpan dan SPR telah diupdate!`);
      setIsTtdModalOpen(false);
      setSelectedSpr(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan tanda tangan");
    }
  };

  const handleShareWASpr = (row: any) => {
    const phone = (row.noTelepon || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('Nomor telepon customer tidak valid / kosong.');
      return;
    }
    const waPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const documentLink = row.fileSpr ? row.fileSpr : `${window.location.origin}/verify/${row.id}`;
    const message = `Halo Bapak/Ibu *${row.nama}*,\n\nBerikut kami sampaikan dokumen *Surat Pesanan Rumah (SPR)* untuk unit Kavling *${row.perumahan} Blok ${row.blok}-${row.nomorUnit}*.\n\n🔗 *Unduh Dokumen SPR:*\n${documentLink}\n\nTerima Kasih\n**`;

    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const expandedRowRender = (row: CustomerData) => {
    const customerSales = penjualanData.filter((p: any) => p.noIdentitas === row.nikKtp && p.status !== 'BATAL');

    if (customerSales.length === 0) {
      return (
        <div className="p-4 bg-slate-50 border-t border-slate-100 shadow-inner">
          <p className="text-sm text-slate-500 italic text-center">Belum ada transaksi pembelian untuk customer ini.</p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-slate-50 border-t border-slate-100 shadow-inner">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShoppingCart size={16} className="text-blue-600" /> Dokumen Surat Pesanan Rumah (SPR)
        </h4>

        {/* === MULAI PERUBAHAN LAYOUT TABLE === */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[10px]">
                <th className="p-3 font-bold whitespace-nowrap">Blok</th>
                <th className="p-3 font-bold whitespace-nowrap">No</th>
                <th className="p-3 font-bold text-center whitespace-nowrap">Status</th>
                <th className="p-3 font-bold whitespace-nowrap">Dokumen SPR</th>
                <th className="p-3 font-bold text-center whitespace-nowrap">Aksi TTD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {customerSales.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-black text-slate-800">
                    {sale.blok}
                  </td>
                  <td className="p-3 font-black text-slate-800">
                    {sale.nomorUnit}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${sale.status === 'LUNAS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {sale.fileSpr ? (
                        <>
                          <a
                            href={sale.fileSpr}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors shadow-sm text-[11px] font-bold"
                            title="Lihat PDF SPR"
                          >
                            <FileText size={14} />
                          </a>
                          <button
                            onClick={() => handleShareWASpr(sale)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors shadow-sm cursor-pointer text-[11px] font-bold"
                            title="Kirim via WhatsApp"
                          >
                            <Share2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200 flex items-center gap-1 w-fit font-bold">
                          Menunggu File
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedSpr(sale);
                        setTtdData({
                          nama: sale.nama,
                          tanggal: new Date().toISOString().split('T')[0],
                          sebagai: 'Pemesan'
                        });
                        setIsTtdModalOpen(true);
                        setTimeout(() => clearSignature(), 100);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors shadow-sm cursor-pointer text-[11px] font-bold"
                      title="Tanda Tangan Digital"
                    >
                      <PenTool size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* === AKHIR PERUBAHAN LAYOUT TABLE === */}
      </div>
    );
  };





  const openDetailModal = (item: CustomerData) => {
    setSelectedCustomer(item);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (item?: CustomerData) => {
    if (item) {
      setSelectedCustomer(item);
      setFormData({
        nikKtp: item.nikKtp,
        nama: item.nama,
        noHp: item.noHp,
        email: item.email || '',
        pekerjaan: item.pekerjaan || '',
        perusahaan: item.perusahaan || '',
        bank: item.bank || '',
        alamatKtp: item.alamatKtp,
        alamatTinggal: item.alamatTinggal || '',
        alamatKoresponden: item.alamatKoresponden || ''
      });
    } else {
      setSelectedCustomer(null);
      setFormData(initialFormState);
    }
    setErrors({});
    setIsEditModalOpen(true);
  };

  const openUploadModal = (item: CustomerData) => {
    setSelectedCustomer(item);
    setNewDocName("");
    setIsUploadModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateCustomerDTO]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CreateCustomerDTO, string>> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (formData.nikKtp.length !== 16) newErrors.nikKtp = 'NIK harus 16 digit';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';
    if (!formData.alamatKtp.trim()) newErrors.alamatKtp = 'Alamat KTP wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    try {
      if (selectedCustomer) {
        await updateMutation.mutateAsync({ id: selectedCustomer.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.success === false && responseData?.error) {
        if (Array.isArray(responseData.error)) {
          const backendErrors: Partial<Record<keyof CreateCustomerDTO, string>> = {};
          responseData.error.forEach((item: { field: string; message: string }) => {
            backendErrors[item.field as keyof CreateCustomerDTO] = item.message;
          });
          setErrors(backendErrors);
        } else {
          alert(responseData.message || "Terjadi kesalahan validasi");
        }
      } else {
        alert("Gagal terhubung ke server. Silakan coba lagi.");
      }
    }
  };

  const handleDelete = async (item: CustomerData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data ${item.nama} ?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        alert(error.response?.data?.message || "Gagal menghapus data");
      }
    }
  };
  const handleGenerateAccount = async (customer: CustomerData) => {
    if (customer.hasAccount) {
      alert("Customer ini sudah memiliki akun portal!");
      return;
    }
    if (!customer.email) {
      alert("Gagal: Email customer masih kosong. Silakan Edit data administrasi dan isi email terlebih dahulu!");
      return;
    }


    const password = window.prompt(`Masukkan password baru untuk akun portal ${customer.nama} (Min. 6 karakter):`);
    if (!password) return;
    if (password.length < 6) {
      alert("Password harus minimal 6 karakter!");
      return;
    }

    try {
      await generateAccountMutation.mutateAsync({ id: customer.id, password });
      alert(`Berhasil! Akun portal untuk ${customer.nama} telah dibuat. Silakan login menggunakan email: ${customer.email}`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal membuat akun portal.");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: CustomerDocType) => {
    const file = e.target.files?.[0];
    if (!file || !currentCustomer) return;
    if (!file.type.startsWith('image/')) {
      alert("Hanya file gambar yang diperbolehkan!");
      e.target.value = "";
      return;
    }
    try {
      await uploadMutation.mutateAsync({ id: currentCustomer.id, docType, file });
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengunggah gambar");
    }
  };

  const handleUploadLainnya = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCustomer) return;

    if (!newDocName.trim()) {
      alert("Isi nama dokumen terlebih dahulu sebelum mengunggah file!");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert("Hanya file gambar yang diperbolehkan!");
      e.target.value = "";
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        id: currentCustomer.id,
        docType: 'lainnya',
        file,
        namaDokumen: newDocName
      });
      setNewDocName("");
      alert("Dokumen tambahan berhasil diunggah!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengunggah dokumen tambahan");
    }
  };

  if (isLoading || isLoadingPenjualan) return <PageLoader />;

  return (
    <div className="space-y-6">
      <DataTable
        title="Administrasi Customer"
        columns={columns}
        data={customers}
        onAdd={() => openEditModal()}
        expandedRowRender={expandedRowRender}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={selectedCustomer ? "Edit Data Administrasi" : "Tambah Customer Baru"}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Sesuai KTP" name="nama" value={formData.nama} onChange={handleEditChange} error={errors.nama} placeholder="Masukkan nama lengkap" />
            <Input label="NIK (16 Digit)" name="nikKtp" value={formData.nikKtp} onChange={handleEditChange} error={errors.nikKtp} maxLength={16} placeholder="Masukkan 16 digit NIK" />
            <Input label="No. WhatsApp / HP" name="noHp" value={formData.noHp} onChange={handleEditChange} error={errors.noHp} placeholder="08xxxxxxxxxx" />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleEditChange} error={errors.email} placeholder="email@example.com" />
            <Input label="Pekerjaan" name="pekerjaan" value={formData.pekerjaan} onChange={handleEditChange} error={errors.pekerjaan} placeholder="PNS / Swasta / Wiraswasta" />
            <Input label="Perusahaan" name="perusahaan" value={formData.perusahaan} onChange={handleEditChange} error={errors.perusahaan} placeholder="Nama Perusahaan" />
            <Input label="Bank / Bank KPR" name="bank" value={formData.bank} onChange={handleEditChange} error={errors.bank} placeholder="BCA / Mandiri / BSI" />
            <Input label="Alamat Sesuai KTP" name="alamatKtp" value={formData.alamatKtp} onChange={handleEditChange} error={errors.alamatKtp} placeholder="Masukkan alamat KTP" />
            <Input label="Alamat Tinggal Sekarang" name="alamatTinggal" value={formData.alamatTinggal} onChange={handleEditChange} error={errors.alamatTinggal} placeholder="Masukkan alamat domisili" />
            <Input label="Alamat Korespondensi" name="alamatKoresponden" value={formData.alamatKoresponden} onChange={handleEditChange} error={errors.alamatKoresponden} placeholder="Alamat surat-menyurat" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50">Batal</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-8 py-2 text-sm font-bold text-white bg-black rounded-xl uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-black/10">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Upload Dokumen: ${currentCustomer?.nama}`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['fileKtp', 'fileKk', 'fileNpwp'] as const).map((type) => (
              <div key={type} className="flex flex-col gap-3 p-4 border rounded-2xl bg-slate-50/50 hover:bg-white transition-all group shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {type.replace('file', '')}
                </span>
                <div
                  onClick={() => currentCustomer?.[type] && setPreviewImage(currentCustomer[type] as string)}
                  className={`aspect-video w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all ${currentCustomer?.[type] ? 'border-slate-200 cursor-zoom-in' : 'border-slate-300 bg-slate-100'
                    }`}
                >
                  {currentCustomer?.[type] ? (
                    <>
                      <img src={currentCustomer[type] as string} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <ImageIcon size={24} strokeWidth={1.5} />
                      <span className="text-[9px] font-bold">KOSONG</span>
                    </div>
                  )}
                </div>
                <FileInput
                  label="Upload / Ganti"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, type)}
                  disabled={uploadMutation.isPending}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <PlusCircle size={16} className="text-blue-600" /> Dokumen Pendukung Lainnya
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentCustomer?.dokumenLainnya && currentCustomer.dokumenLainnya.map((doc: any) => (
                <div key={doc.id} className="flex flex-col gap-3 p-4 border rounded-2xl bg-slate-50 hover:bg-white transition-all group shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 truncate" title={doc.nama}>
                    {doc.nama}
                  </span>
                  <div
                    onClick={() => setPreviewImage(doc.fileUrl)}
                    className="aspect-video w-full rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden relative cursor-zoom-in group"
                  >
                    <img src={doc.fileUrl} alt={doc.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn size={20} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-3 p-4 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/30">
                <div className="w-full">
                  <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5 block">
                    Nama Dokumen Baru
                  </label>
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Contoh: Slip Gaji"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <FileInput
                  label="Pilih File"
                  accept="image/*"
                  onChange={handleUploadLainnya}
                  disabled={uploadMutation.isPending || newDocName.trim() === ""}
                />
              </div>
            </div>
          </div>

          {uploadMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs animate-pulse bg-blue-50 p-3 rounded-lg border border-blue-100">
              <FileUp size={16} /> Sedang Menyinkronkan Data...
            </div>
          )}

          <div className="flex justify-end pt-4 border-t sticky bottom-0 bg-white">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="px-8 py-2.5 bg-black text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 cursor-pointer shadow-md transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Informasi Detail Customer">
        {currentCustomer && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Biodata Customer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nama Lengkap</p><p className="text-sm font-bold text-slate-900">{currentCustomer.nama}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">NIK KTP</p><p className="text-sm font-medium text-slate-800 tabular-nums">{currentCustomer.nikKtp}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">No. WhatsApp / HP</p><p className="text-sm font-medium text-slate-800 tabular-nums">{currentCustomer.noHp}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Email</p><p className="text-sm font-medium text-slate-800">{currentCustomer.email || '-'}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pekerjaan</p><p className="text-sm font-medium text-slate-800">{currentCustomer.pekerjaan || '-'}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bank KPR / Utama</p><p className="text-sm font-medium text-slate-800">{currentCustomer.bank || '-'}</p></div>
                <div className="md:col-span-2"><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Alamat KTP</p><p className="text-sm font-medium text-slate-800 leading-relaxed">{currentCustomer.alamatKtp}</p></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ImageIcon size={16} className="text-indigo-600" /> Lampiran Dokumen Administrasi
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(['fileKtp', 'fileKk', 'fileNpwp'] as const).map((type) => (
                  <div key={type} className="flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 text-center">{type.replace('file', '')}</span>
                    <div
                      onClick={() => currentCustomer[type] && setPreviewImage(currentCustomer[type] as string)}
                      className={`aspect-[4/3] rounded-xl border flex items-center justify-center overflow-hidden transition-all ${currentCustomer[type] ? 'border-slate-200 cursor-zoom-in bg-slate-50' : 'border-slate-100 bg-slate-50/50'}`}
                    >
                      {currentCustomer[type] ? (
                        <img src={currentCustomer[type] as string} alt={type} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 italic text-center px-2">Belum Upload</span>
                      )}
                    </div>
                  </div>
                ))}

                {currentCustomer.dokumenLainnya?.map((doc: any) => (
                  <div key={doc.id} className="flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 text-center truncate px-1" title={doc.nama}>{doc.nama}</span>
                    <div
                      onClick={() => setPreviewImage(doc.fileUrl)}
                      className="aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 cursor-zoom-in overflow-hidden"
                    >
                      <img src={doc.fileUrl} alt={doc.nama} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingCart size={16} className="text-blue-600" /> Riwayat Transaksi Penjualan
                </h4>
              </div>
              {(() => {
                const customerSales = penjualanData.filter((p: any) => p.noIdentitas === currentCustomer.nikKtp);
                return customerSales.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg custom-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[10px]">
                          <th className="p-3 font-bold">Tanggal</th>
                          <th className="p-3 font-bold">Kavling</th>
                          <th className="p-3 font-bold text-right">Nilai Transaksi</th>
                          <th className="p-3 font-bold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerSales.map((item: any) => (
                          <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-600 font-medium tabular-nums">{formatDate(item.tanggal)}</td>
                            <td className="p-3 font-semibold text-slate-800">{item.perumahan} - Blok {item.blok}-{item.nomorUnit}</td>
                            <td className="p-3 text-slate-900 font-bold text-right tabular-nums">{formatRupiah(item.hargaJual)}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${item.status === 'LUNAS' ? 'bg-green-100 text-green-700' : item.status === 'BATAL' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Belum ada riwayat transaksi penjualan untuk customer ini.
                  </p>
                );
              })()}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer shadow-md">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20">Tutup</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTtdModalOpen} onClose={() => setIsTtdModalOpen(false)} title="Tanda Tangan Digital Dokumen">
        <div className="space-y-5">
          {selectedSpr?.ttdData && selectedSpr.ttdData[ttdData.sebagai] !== undefined && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-sm animate-in fade-in duration-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Perhatian: {ttdData.sebagai} sudah menandatangani dokumen ini.</p>
                <p className="text-xs mt-0.5 text-amber-700">Jika Anda melanjutkan, maka tanda tangan, nama, dan tanggal sebelumnya akan digantikan dengan yang baru.</p>
              </div>
            </div>
          )}

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
                backgroundColor="white"
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
              disabled={uploadSignatureMutation.isPending}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={saveSignature}
              disabled={uploadSignatureMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50"
            >
              {uploadSignatureMutation.isPending ? "Menyimpan..." : "Simpan Tanda Tangan"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Administrasi;