import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/shared/Input';
import Select from '../components/shared/Select';
import { useGetPerumahan } from '../hooks/queries/usePerumahan';
import { storage } from '../utils/storage';
const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    perumahanId: '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const from = location.state?.from?.pathname || '/';
  const { data: perumahanList = [], isLoading: isLoadingPerumahan } = useGetPerumahan();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});
    if (!formData.perumahanId) {
      setGeneralError('Silakan pilih perumahan terlebih dahulu');
      return;
    }
    const selectedPerumahan = perumahanList.find(p => String(p.id) === String(formData.perumahanId));
    if (!selectedPerumahan) {
      setGeneralError('Perumahan tidak valid');
      return;
    }
    const result = await login(formData.email, formData.password, selectedPerumahan);
    if (result.success) {
      const redirectTo = storage.getUser()?.role === 'MANDOR' ? '/proyek/progress' : from;
      navigate(redirectTo, { replace: true });
    } else {
      if (result.errors && Array.isArray(result.errors)) {
        const fieldErrors = result.errors.reduce((acc, err) => {
          acc[err.field] = err.message;
          return acc;
        }, {} as Record<string, string>);
        setErrors(fieldErrors);
      } else {
        setGeneralError(result.message || 'Login gagal');
      }
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-lg mb-4">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bumantaraz</h1>
          <p className="text-sm text-slate-500 mt-2">Masuk ke sistem manajemen properti</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {generalError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center animate-in fade-in">
              {generalError}
            </div>
          )}
          {/* Tambahkan Dropdown Pilih Perumahan */}
          <Select
            label="Pilih Perumahan"
            name="perumahanId"
            value={formData.perumahanId}
            onChange={handleChange}
            options={[
              { value: '', label: isLoadingPerumahan ? 'Memuat data...' : '-- Pilih Perumahan --' },
              ...perumahanList.map(p => ({ value: String(p.id), label: p.nama }))
            ]}
            disabled={isLoadingPerumahan}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="admin@gmail.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Masukkan password"
          />
          <button
            type="submit"
            disabled={isLoading || isLoadingPerumahan}
            className={`w-full bg-black text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-lg shadow-black/10 mt-4 flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800 cursor-pointer'}`}
          >
            {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;