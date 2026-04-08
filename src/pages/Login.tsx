import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/shared/Input';
import Select from '../components/shared/Select';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perumahan, setPerumahan] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!perumahan) {
      setError('Silakan pilih perumahan terlebih dahulu');
      return;
    }

    const success = login(email, password, perumahan);
    if (success) {
      navigate('/');
    } else {
      setError('Email atau password salah!');
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
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center animate-in fade-in">
              {error}
            </div>
          )}

          <Select
            label="Pilih Perumahan"
            name="perumahan"
            value={perumahan}
            onChange={(e) => setPerumahan(e.target.value)}
            options={[
              { value: 'Puri Safana', label: 'Puri Safana' },
              { value: 'Poris 88', label: 'Poris 88' }
            ]}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
          />

          <button
            type="submit"
            className="w-full bg-black text-white font-bold text-sm py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-black/10 mt-4 cursor-pointer"
          >
            Masuk Sekarang
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;