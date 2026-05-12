import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import { UserPlus } from 'lucide-react';
import { authService, type RegisterAgentPayload } from '../../services/auth.service';

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
    atasNamaRekening: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.registerAgent(formData);
      alert("Registrasi berhasil! Silakan login.");
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
            <Select label="Tipe Agent" name="type" value={formData.type} onChange={handleChange} options={[{ value: 'PRIBADI', label: 'Pribadi' }, { value: 'PERUSAHAAN', label: 'Perusahaan' }]} />
            <Input label="NIK KTP" name="nik" value={formData.nik} onChange={handleChange} placeholder="16 Digit NIK" required maxLength={16} />
            <Input label="Nama Lengkap" name="nama" value={formData.nama} onChange={handleChange} placeholder="Sesuai KTP" required />
            <Input label="No. WhatsApp" name="noHp" value={formData.noHp} onChange={handleChange} placeholder="08xxxxxxxx" required />
          </div>

          <Input label="Alamat Lengkap" name="alamat" value={formData.alamat} onChange={handleChange} placeholder="Alamat Domisili" />

          <div className="pt-4 border-t border-slate-100 mt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Login</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email Aktif" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@anda.com" required />
              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 Karakter" required />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Bank (Pencairan Fee)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Bank" name="namaBank" value={formData.namaBank} onChange={handleChange} placeholder="BCA/BSI/DLL" />
              <Input label="No Rekening" name="noRekening" value={formData.noRekening} onChange={handleChange} placeholder="No Rekening" />
              <Input label="Atas Nama" name="atasNamaRekening" value={formData.atasNamaRekening} onChange={handleChange} placeholder="A/N Rekening" />
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