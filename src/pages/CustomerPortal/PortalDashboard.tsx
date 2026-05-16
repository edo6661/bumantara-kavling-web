/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  useGetCustomerDashboard,
  useUploadMyBuktiTagihan,
  useUploadMyDocument,
  useUpdateMyAccount
} from '../../hooks/queries/useCustomerPortal';
import PageLoader from '../PageLoader';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut, User, Home, Clock, ZoomIn, PlusCircle,
  CheckCircle2, UploadCloud, Settings,
  FileText
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { handleApiError } from '../../utils/errorHandler';

const PortalDashboard = () => {
  const { data, isLoading } = useGetCustomerDashboard();
  const uploadBuktiMutation = useUploadMyBuktiTagihan();
  const { logout } = useAuth();
  const uploadMutation = useUploadMyDocument();
  const updateAccountMutation = useUpdateMyAccount();

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState("");

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });

  // ✅ PERBAIKAN TS ERROR: Tambahkan state error handling
  const [accountErrors, setAccountErrors] = useState<Record<string, string | undefined>>({});

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="p-8 text-center">Gagal memuat data portal.</div>;

  const { profil, transaksi } = data;

  const handleUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMutation.mutateAsync({ docType, file });
      alert('Dokumen berhasil diunggah!');
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      e.target.value = '';
    }
  };

  const handleUploadBuktiTagihan = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadBuktiMutation.mutateAsync({ id, file });
      alert('Bukti pembayaran berhasil diunggah, menunggu verifikasi Admin!');
    } catch (error) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      e.target.value = '';
    }
  };

  const handleUploadLainnya = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newDocName.trim()) {
      alert("Tuliskan nama dokumen terlebih dahulu (contoh: Slip Gaji)!");
      e.target.value = "";
      return;
    }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya file gambar dan PDF yang diperbolehkan!");
      e.target.value = "";
      return;
    }
    try {
      await uploadMutation.mutateAsync({ docType: 'lainnya', file, namaDokumen: newDocName });
      setNewDocName("");
      alert('Dokumen tambahan berhasil diunggah!');
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      e.target.value = "";
    }
  };

  const openAccountModal = () => {
    setAccountForm({ username: '', email: profil.email || '', password: '', confirmPassword: '' });
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
      const payload: { username?: string; email?: string; password?: string } = {};

      if (accountForm.username) payload.username = accountForm.username;

      if (accountForm.email && accountForm.email !== profil.email) {
        payload.email = accountForm.email;
      }

      if (accountForm.password) {
        payload.password = accountForm.password;
      }

      if (Object.keys(payload).length === 0) {
        alert("Tidak ada perubahan data.");
        setIsAccountModalOpen(false);
        return;
      }

      await updateAccountMutation.mutateAsync(payload);
      alert("Data akun berhasil diperbarui! Silakan login kembali dengan data baru Anda.");
      setIsAccountModalOpen(false);
      logout();
    } catch (error: any) {
      // ✅ KODE YANG DIUBAH: Tambahkan mapping error UI
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

  const dokumenUtama = [
    { key: 'fileKtp', label: 'KTP' },
    { key: 'fileKk', label: 'Kartu Keluarga (KK)' },
    { key: 'fileNpwp', label: 'NPWP' }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-black text-slate-900 tracking-tight">Kavling<span className="text-blue-600">Portal</span></h1>
        <button onClick={logout} className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer">
          <LogOut size={16} /> Keluar
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-8 px-4 space-y-8 animate-in fade-in duration-500">
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={20} /></div>
              <h2 className="text-lg font-bold text-slate-800">Profil & Dokumen Anda</h2>
            </div>
            <button
              onClick={openAccountModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Settings size={14} /> Pengaturan Akun
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Informasi Biodata</h3>
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-sm text-left border-collapse bg-white">
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-500 w-1/3 bg-slate-50/50">Nama Lengkap</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{profil.nama}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-500 w-1/3 bg-slate-50/50">NIK KTP</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{profil.nikKtp}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-500 w-1/3 bg-slate-50/50">No. Telepon</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{profil.noHp}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-500 w-1/3 bg-slate-50/50">Email</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{profil.email || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-500 w-1/3 bg-slate-50/50">Pekerjaan</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{profil.pekerjaan || '-'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-500 w-1/3 bg-slate-50/50">Alamat KTP</td>
                      <td className="py-3 px-4 font-medium text-slate-700 leading-relaxed">{profil.alamatKtp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Kelengkapan Administrasi</h3>
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-sm text-left border-collapse bg-white">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Dokumen</th>
                      <th className="py-3 px-4 text-center">Status / Preview</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dokumenUtama.map(({ key, label }) => (
                      <tr key={key} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-700">{label}</td>
                        <td className="py-3 px-4 text-center">
                          {profil[key] ? (
                            <div
                              onClick={() => setPreviewImage(profil[key] as string)}
                              className="relative w-14 h-10 mx-auto rounded border border-slate-200 overflow-hidden cursor-zoom-in group shadow-sm bg-slate-100 flex justify-center items-center"
                              title={`Lihat Dokumen ${label}`}
                            >
                              {(profil[key] as string).split('?')[0].toLowerCase().endsWith('.pdf') || (profil[key] as string).includes('application/pdf') ? (
                                <div className="text-red-500 group-hover:scale-110 transition-transform duration-300"><FileText size={18} /></div>
                              ) : (
                                <img src={profil[key] as string} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              )}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="text-white" size={14} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Belum Ada</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm
                            ${profil[key] ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                            <UploadCloud size={14} />
                            {uploadMutation.isPending ? 'Proses...' : profil[key] ? 'Ganti' : 'Upload'}
                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleUpload(key, e)} disabled={uploadMutation.isPending} />
                          </label>
                        </td>
                      </tr>
                    ))}
                    {profil.dokumenLainnya && profil.dokumenLainnya.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-700">{doc.nama}</td>
                        <td className="py-3 px-4 text-center">
                          <div
                            onClick={() => setPreviewImage(doc.fileUrl)}
                            className="relative w-14 h-10 mx-auto rounded border border-slate-200 overflow-hidden cursor-zoom-in group shadow-sm bg-slate-100"
                            title={`Lihat ${doc.nama}`}
                          >
                            <img src={doc.fileUrl} alt={doc.nama} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="text-white" size={14} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1.5 rounded-lg border border-green-100">
                            <CheckCircle2 size={12} /> Terupload
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50/30">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          placeholder="Nama Dok (cth: Slip Gaji)"
                          className="w-full px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 outline-none focus:border-blue-500 bg-white text-black"
                        />
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right">
                        <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm
                          ${!newDocName.trim() || uploadMutation.isPending
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                          }`}
                        >
                          <PlusCircle size={14} />
                          {uploadMutation.isPending ? 'Mengunggah...' : 'Tambah & Upload File'}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleUploadLainnya}
                            disabled={uploadMutation.isPending || !newDocName.trim()}
                          />
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-2">
            <Home className="text-indigo-600" size={20} /> Unit & Tagihan Saya
          </h2>

          {transaksi.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              Belum ada riwayat pembelian unit.
            </div>
          ) : (
            transaksi.map((trx: any) => (
              <div key={trx.noTransaksi} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">{trx.perumahan}</p>
                    <p className="text-xl font-black">{trx.kavling}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Status Penjualan</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${trx.statusPenjualan === 'LUNAS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {trx.statusPenjualan}
                    </span>
                  </div>
                </div>

                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4 border-b border-slate-200">Keterangan Tagihan</th>
                        <th className="p-4 border-b border-slate-200">Jatuh Tempo</th>
                        <th className="p-4 border-b border-slate-200 text-right">Nominal</th>
                        <th className="p-4 border-b border-slate-200 text-center">Status</th>
                        <th className="p-4 border-b border-slate-200 text-center">Aksi Dokumen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trx.tagihan.map((t: any) => (
                        <tr key={t.noTagihan} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{t.pembayaran}</td>
                          <td className="p-4 text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5"><Clock className="text-slate-400" size={14} /> {formatDate(t.jatuhTempo)}</span>
                          </td>
                          <td className="p-4 text-right font-black text-slate-900 tabular-nums">{formatRupiah(t.nominal)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider 
                              ${t.status === 'LUNAS' ? 'bg-green-100 text-green-700' :
                                t.status === 'MENUNGGU_KONFIRMASI' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'}`}>
                              {t.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <a
                                href={`/verify/${t.status === 'LUNAS' ? t.noTagihan.replace('INV-', 'KWT-') : t.noTagihan}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-colors shrink-0 shadow-sm"
                              >
                                {t.status === 'LUNAS' ? 'Kwitansi' : 'Invoice'}
                              </a>
                              {t.status === 'BELUM_BAYAR' && (
                                <label className="px-3 py-1.5 bg-blue-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shadow-sm shrink-0 flex items-center gap-1.5">
                                  <UploadCloud size={14} />
                                  {uploadBuktiMutation.isPending ? 'Proses...' : 'Upload Bukti'}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => handleUploadBuktiTagihan(t.id, e)}
                                    disabled={uploadBuktiMutation.isPending}
                                  />
                                </label>
                              )}
                              {t.fileBukti ? (
                                <div
                                  onClick={() => setPreviewImage(t.fileBukti as string)}
                                  className="relative w-14 h-9 rounded-lg border border-slate-200 overflow-hidden cursor-zoom-in group shadow-sm bg-slate-100 shrink-0"
                                  title="Lihat Bukti Transfer"
                                >
                                  <img
                                    src={t.fileBukti as string}
                                    alt="Bukti Transfer"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ZoomIn className="text-white" size={14} />
                                  </div>
                                </div>
                              ) : (
                                t.status !== 'BELUM_BAYAR' && <span className="text-[10px] text-slate-400 italic">Tidak ada gambar</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {trx.tagihan.length === 0 && (
                        <tr><td colSpan={5} className="p-6 text-center text-slate-400 italic">Belum ada rincian tagihan.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Pengaturan Akun Portal">
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-4">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Anda dapat memperbarui Username (Login), Email, dan Password Anda di sini. Kosongkan kolom yang tidak ingin diubah.
            </p>
          </div>

          <Input
            label="Username Baru (Opsional)"
            name="username"
            type="text"
            error={accountErrors.username}
            value={accountForm.username}
            onChange={(e) => {
              setAccountForm({ ...accountForm, username: e.target.value });
              if (accountErrors.username) setAccountErrors(prev => ({ ...prev, username: undefined }));
            }}
            placeholder="Masukkan username baru..."
          />

          <Input
            label="Email Baru (Opsional)"
            name="email"
            type="email"
            error={accountErrors.email}
            value={accountForm.email}
            onChange={(e) => {
              setAccountForm({ ...accountForm, email: e.target.value });
              if (accountErrors.email) setAccountErrors(prev => ({ ...prev, email: undefined }));
            }}
            placeholder="email@example.com"
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

export default PortalDashboard;