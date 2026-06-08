import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/shared/Input';
import { Briefcase } from 'lucide-react';

const AgentLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginAgent, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await loginAgent(formData.email, formData.password);

    if (result.success) {
      navigate('/agent-portal', { replace: true });
    } else {
      setError(result.message || 'Email atau password salah');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-600/30 mb-4">
            <Briefcase size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Portal Agent</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Masuk untuk mengelola data & dokumen keagenan Anda</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
              {error}
            </div>
          )}
          <Input
            label="Email Terdaftar"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Masukkan password Anda"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 mt-4 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Memverifikasi...' : 'Masuk ke Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentLogin;