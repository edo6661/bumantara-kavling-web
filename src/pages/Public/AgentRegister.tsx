import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import { UserPlus, Info } from 'lucide-react'; // Tambah icon Info
import { authService, type RegisterAgentPayload } from '../../services/auth.service';
import SignatureCanvas from 'react-signature-canvas'; // Tambahan untuk TTD
import api from '../../lib/axios'; // Untuk fetch data perusahaan

const AgentRegister = () => {
  const [formData, setFormData] = useState<RegisterAgentPayload>({
    nik: '',
    nama: '',
    noHp: '',
    email: '',
    password: '',
    alamat: '',
    type: 'PRIBADI',
    namaBank: '',
    noRekening: '',
    atasNamaRekening: '',
    perusahaanAgentId: undefined,
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [perusahaanList, setPerusahaanList] = useState<{ id: number, nama: string }[]>([]);
  const navigate = useNavigate();
  const sigCanvas = useRef<SignatureCanvas>(null);

  // Ambil list perusahaan (Opsional: Nanti kita buatkan endpoint aslinya di tahap 2)
  useEffect(() => {
    const fetchPerusahaan = async () => {
      try {
        const res = await api.get('/perusahaan-agents'); // Endpoint ini disiapkan untuk tahap 2
        setPerusahaanList(res.data.data.items || []);
      } catch (err) {
        console.error("Gagal load perusahaan:", err);
      }
    };
    fetchPerusahaan();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (sigCanvas.current?.isEmpty()) {
      setError("Tanda tangan wajib diisi!");
      return;
    }

    if (formData.type === 'PERUSAHAAN' && !formData.perusahaanAgentId) {
      setError("Anda wajib memilih Perusahaan tempat Anda bernaung.");
      return;
    }

    setIsLoading(true);

    try {
      const ttdBase64 = sigCanvas.current?.getCanvas().toDataURL('image/png');
      const payload = { ...formData, ttdData: ttdBase64 };

      await authService.registerAgent(payload);

      // Pesan Sukses yang Baru
      alert("Terimakasih telah mendaftar sebagai agent di Puri Safana. Mohon tunggu approval oleh admin untuk bisa login ke sistem.");
      navigate('/agent-login', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat registrasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-4 font-sans py-12">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-indigo-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 mb-4">
            <UserPlus size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Agent Marketing</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Lengkapi data diri Anda untuk bergabung sebagai Agent</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipe Agent"
              name="type"
              value={formData.type}
              onChange={(e) => {
                setFormData({ ...formData, type: e.target.value, perusahaanAgentId: undefined });
              }}
              options={[{ value: 'PRIBADI', label: 'Pribadi' }, { value: 'PERUSAHAAN', label: 'Perusahaan' }]}
            />

            {formData.type === 'PERUSAHAAN' && (
              <Select
                label="Pilih Perusahaan"
                name="perusahaanAgentId"
                value={formData.perusahaanAgentId || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: '-- Pilih Perusahaan --' },
                  ...perusahaanList.map(p => ({ value: p.id, label: p.nama }))
                ]}
              />
            )}

            <Input label="NIK KTP" name="nik" value={formData.nik} onChange={handleChange} placeholder="16 Digit NIK" required maxLength={16} />

            <div className="flex flex-col">
              <Input label="Nama Lengkap" name="nama" value={formData.nama} onChange={handleChange} placeholder="Sesuai KTP" required />
              {/* Teks Kecil Sesuai Permintaan */}
              <span className="text-[10px] text-slate-400 italic ml-1 -mt-3">*Isi nama lengkap sesuai dengan KTP</span>
            </div>

            <Input label="No. WhatsApp" name="noHp" value={formData.noHp} onChange={handleChange} placeholder="08xxxxxxxx" required />
          </div>

          <Input label="Alamat Lengkap" name="alamat" value={formData.alamat} onChange={handleChange} placeholder="Alamat Domisili" />

          <div className="pt-4 border-t border-slate-100 mt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Login</h3>

            {/* Box Info Tambahan */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2 text-blue-700">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">
                Email dan password di bawah ini akan digunakan untuk masuk ke <b>sistem portal agent Puri Safana</b>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email Aktif" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@anda.com" required />
              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 Karakter" required />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tanda Tangan Digital</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ width: 500, height: 150, className: 'sigCanvas w-full cursor-crosshair' }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-[10px] text-slate-400">Tanda tangan di dalam area kotak (Wajib).</p>
              <button type="button" onClick={() => sigCanvas.current?.clear()} className="text-[10px] font-bold text-red-500 hover:underline">Hapus / Ulangi</button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md mt-6 disabled:opacity-50 cursor-pointer">
            {isLoading ? 'Memproses Registrasi...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6 font-medium">
          Sudah punya akun? <Link to="/agent-login" className="text-indigo-600 hover:underline font-bold">Login di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default AgentRegister;