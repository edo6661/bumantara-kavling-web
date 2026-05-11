import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-red-200">
        <AlertTriangle size={48} className="text-red-500" />
      </div>
      <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-700 mb-3">Halaman Tidak Ditemukan</h2>
      <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
        Maaf, halaman atau rute yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
      >
        <Home size={18} /> Kembali ke Beranda
      </button>
    </div>
  );
};

export default NotFound;