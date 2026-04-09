import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/shared/Input';
import Select from '../components/shared/Select';
import { useGetPerumahan } from '../hooks/queries/usePerumahan';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    perumahanId: ''
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState('');

  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  // Gunakan Custom Hook React Query
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
      setErrors({ perumahanId: 'Silakan pilih perumahan terlebih dahulu' });
      return;
    }

    const selectedPerumahanObj = perumahanList.find(p => String(p.id) === String(formData.perumahanId));

    if (!selectedPerumahanObj) {
      setGeneralError('Data perumahan tidak valid. Silakan muat ulang halaman.');
      return;
    }

    const result = await login(formData.email, formData.password, selectedPerumahanObj);

    if (result.success) {
      navigate('/', { replace: true });
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

          <Select
            label="Pilih Perumahan"
            name="perumahanId"
            value={formData.perumahanId}
            onChange={handleChange}
            error={errors.perumahanId}
            // Disabled select jika data perumahan masih loading dari API
            disabled={isLoadingPerumahan}
            options={[
              { value: '', label: isLoadingPerumahan ? 'Memuat data perumahan...' : 'Pilih opsi...' },
              ...perumahanList.map(p => ({ value: String(p.id), label: p.nama }))
            ]}
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
            className={`w-full bg-black text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-lg shadow-black/10 mt-4 flex justify-center items-center ${isLoading || isLoadingPerumahan ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800 cursor-pointer'}`}
          >
            {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;