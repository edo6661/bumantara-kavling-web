/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetMyAgentProfile,
  useUploadMyAgentDoc,
  useUpdateMyAgentAccount
} from '../../hooks/queries/useAgentPortal';
import PageLoader from '../PageLoader';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import FileInput from '../../components/shared/FileInput';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../utils/formatters';
import { LogOut, Briefcase, Settings, UploadCloud, Users, ShoppingCart, AlertCircle, FileText } from 'lucide-react';
import { handleApiError } from '../../utils/errorHandler';

const AgentPortalDashboard = () => {
  const { data: agentData, isLoading } = useGetMyAgentProfile();
  const uploadDocMutation = useUploadMyAgentDoc();
  const updateAccountMutation = useUpdateMyAgentAccount();
  const { logout } = useAuth();

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: '', password: '', confirmPassword: '' });

  // ✅ PERBAIKAN TS ERROR: Tambahkan "| undefined"
  const [accountErrors, setAccountErrors] = useState<Record<string, string | undefined>>({});

  if (isLoading) return <PageLoader />;
  if (!agentData) return <div className="p-8 text-center font-bold text-slate-500">Gagal memuat profil Agent.</div>;

  const handleUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      e.target.value = '';
      return;
    }

    try {
      await uploadDocMutation.mutateAsync({ docType, file });
      alert('Dokumen berhasil diunggah!');
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      e.target.value = '';
    }
  };

  const openAccountModal = () => {
    setAccountForm({ email: agentData.email || '', password: '', confirmPassword: '' });
    setAccountErrors({});
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.password && accountForm.password.length < 6) {
      alert("Password minimal 6 karakter!");
      return;
    }
    if (accountForm.password !== accountForm.confirmPassword) {
      alert("Password dan Konfirmasi Password tidak cocok!");
      return;
    }

    try {
      const payload: { email?: string; password?: string } = {};
      if (accountForm.email && accountForm.email !== agentData.email) payload.email = accountForm.email;
      if (accountForm.password) payload.password = accountForm.password;

      if (Object.keys(payload).length === 0) {
        alert("Tidak ada perubahan data.");
        setIsAccountModalOpen(false);
        return;
      }

      await updateAccountMutation.mutateAsync(payload);
      alert("Data akun berhasil diperbarui! Jika Anda mengubah email atau password, silakan login kembali.");
      setIsAccountModalOpen(false);
      logout();
    } catch (error: any) {
      const { message, errors: backendErrors } = handleApiError(error);
      if (backendErrors && Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((err: { field: string; message: string }) => {
          fieldErrors[err.field] = err.message;
        });
        setAccountErrors(fieldErrors);
      } else {
        alert(message);
      }
    }
  };

  const baseDocs = [
    { key: 'fileSuratPernyataan', label: 'Surat Pernyataan (TTD & Materai)' }
  ];

  const documentFields = agentData.type === 'PRIBADI'
    ? [
      ...baseDocs,
      { key: 'fileKtp', label: 'Foto KTP' },
      { key: 'fileNpwp', label: 'Foto NPWP' },
    ]
    : [
      ...baseDocs,
      { key: 'fileSuratKeterangan', label: 'Surat Keterangan' },
      { key: 'fileKtpDirektur', label: 'KTP Direktur' },
      { key: 'fileNpwpPerusahaan', label: 'NPWP Perusahaan' }
    ];

  const totalPenjualan = agentData.penjualan?.length || 0;
  const penjualanLunas = agentData.penjualan?.filter((p: any) => p.status === 'LUNAS').length || 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Briefcase className="text-blue-600" size={24} />
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Agent<span className="text-blue-600">Portal</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/management/manajemen-transaksi"
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ShoppingCart size={16} /> Penjualan & Customer
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 px-4 space-y-8 animate-in fade-in duration-500">
        {agentData.status === 'PENDING' && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm flex items-start gap-4 text-amber-800">
            <AlertCircle className="shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-bold text-base mb-1">Akun Anda masih dalam status PENDING</h3>
              <p className="text-sm font-medium leading-relaxed">
                Anda belum di-approve sebagai agent. Anda harus melengkapi berkas-berkas dokumen di bawah ini. Setelah dokumen lengkap, silakan <strong>hubungi admin untuk approval</strong> dan validasi berkas.
              </p>
            </div>
          </div>
        )}
        {/* Ringkasan Profil */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-600 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20 mb-3 inline-block">
              Agent {agentData.type}
            </span>
            <h2 className="text-3xl font-black mb-1">{agentData.nama}</h2>
            <p className="text-blue-100 font-medium tracking-wide">NIK: {agentData.nik}</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 flex-1 md:w-32 text-center">
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Total Closing</p>
              <p className="text-2xl font-black">{totalPenjualan}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 flex-1 md:w-32 text-center">
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Status Lunas</p>
              <p className="text-2xl font-black">{penjualanLunas}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Biodata & Akun */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-800">Biodata Agent</h3>
                <button onClick={openAccountModal} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer" title="Pengaturan Akun">
                  <Settings size={16} />
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">No WhatsApp</p><p className="font-semibold text-slate-800">{agentData.noHp}</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email Akses Portal</p><p className="font-semibold text-slate-800">{agentData.email}</p></div>

                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Alamat Lengkap</p><p className="font-medium text-slate-600 leading-relaxed">{agentData.alamat || '-'}</p></div>
              </div>
            </div>

            {agentData.pics && agentData.pics.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <Users size={16} className="text-blue-600" /> Tim / PIC Agent
                </h3>
                <div className="space-y-3">
                  {agentData.pics.map((pic: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="font-bold text-slate-800 text-sm mb-1">{pic.nama}</p>
                      <p className="text-xs text-slate-500 font-medium">📞 {pic.noHp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kolom Dokumen Utama */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                <UploadCloud size={18} className="text-blue-600" /> Upload Kelengkapan Berkas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {documentFields.map(({ key, label }) => {
                  const fileUrl = agentData[key as keyof typeof agentData] as string;
                  return (
                    <div key={key} className="flex flex-col gap-3 p-4 border rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-sm">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 text-center">
                        {label}
                      </span>
                      <div
                        onClick={() => fileUrl && setPreviewImage(fileUrl)}
                        className={`aspect-[4/3] w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all ${fileUrl ? 'border-slate-200 cursor-zoom-in bg-white' : 'border-slate-300 bg-slate-100'}`}
                      >
                        {fileUrl ? (
                          (fileUrl.split('?')[0].toLowerCase().endsWith('.pdf') || fileUrl.includes('application/pdf')) ? (
                            <div className="flex flex-col items-center text-red-500 hover:scale-105 transition-transform duration-300">
                              <FileText size={32} />
                              <span className="text-[10px] font-bold mt-1 text-slate-600">PDF</span>
                            </div>
                          ) : (
                            <img src={fileUrl} alt={label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          )
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">BELUM ADA DOKUMEN</span>
                        )}
                      </div>
                      <FileInput
                        label={fileUrl ? "Ganti Dokumen" : "Upload Dokumen"}
                        accept="image/*,.pdf"
                        onChange={(e) => handleUpload(key, e)}
                        disabled={uploadDocMutation.isPending}
                      />
                      {key === 'fileSuratPernyataan' && !fileUrl && agentData.defaultSuratPernyataan && (
                        <a
                          href={agentData.defaultSuratPernyataan}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest text-center rounded-lg transition-colors border border-blue-100"
                        >
                          Unduh Template
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Riwayat Penjualan */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4 flex items-center gap-2">
                <ShoppingCart size={18} className="text-blue-600" /> Riwayat Transaksi (Closing)
              </h3>

              {agentData.penjualan && agentData.penjualan.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4 border-b border-slate-200">Customer</th>
                        <th className="p-4 border-b border-slate-200">Kavling</th>
                        <th className="p-4 border-b border-slate-200 text-right">Nilai Jual</th>
                        <th className="p-4 border-b border-slate-200 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {agentData.penjualan.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-slate-900">{sale.customer?.nama || '-'}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{sale.noTransaksi}</p>
                          </td>
                          <td className="p-4 font-medium text-slate-700">
                            {sale.kavling?.perumahan?.nama} Blok {sale.kavling?.blok}-{sale.kavling?.nomorUnit}
                          </td>
                          <td className="p-4 text-right font-black text-slate-900 tabular-nums">
                            {formatRupiah(sale.hargaJual)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${sale.status === 'LUNAS' ? 'bg-green-100 text-green-700' : sale.status === 'BATAL' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {sale.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 italic">Belum ada riwayat closing penjualan.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Modal Account Settings */}
      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Pengaturan Akun Portal">
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-4">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Anda dapat memperbarui email untuk login dan password Anda di sini. Kosongkan kolom password jika tidak ingin mengubahnya.
            </p>
          </div>
          <Input
            label="Email Login Baru"
            name="email"
            type="email"
            error={accountErrors.email}
            value={accountForm.email}
            onChange={(e) => {
              setAccountForm({ ...accountForm, email: e.target.value });
              if (accountErrors.email) setAccountErrors(prev => ({ ...prev, email: undefined }));
            }}
            placeholder="Masukkan email baru..."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input
              label="Password Baru"
              name="password"
              type="password"
              error={accountErrors.password}
              value={accountForm.password}
              onChange={(e) => {
                setAccountForm({ ...accountForm, password: e.target.value });
                if (accountErrors.password) setAccountErrors(prev => ({ ...prev, password: undefined }));
              }}
              placeholder="Minimal 6 karakter"
            />
            <Input
              label="Konfirmasi Password Baru"
              name="confirmPassword"
              type="password"
              value={accountForm.confirmPassword}
              onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
              placeholder="Ketik ulang password"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updateAccountMutation.isPending}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {updateAccountMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Lightbox Preview */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {previewImage.split('?')[0].toLowerCase().endsWith('.pdf') || previewImage.includes('application/pdf') ? (
                <iframe src={previewImage} className="w-full h-[70vh] rounded-lg border-none" title="PDF Preview" />
              ) : (
                <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20">Tutup</button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AgentPortalDashboard;