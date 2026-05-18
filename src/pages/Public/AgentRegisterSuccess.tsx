// Lokasi: src/pages/Public/AgentRegisterSuccess.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, CheckCircle2, ArrowRight } from 'lucide-react';

const AgentRegisterSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { nama?: string; alamat?: string; perusahaan?: string } | null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans print:bg-white print:py-0">

      {/* Mengurangi padding cetak agar tersedia lebih banyak ruang vertikal */}
      <style>
        {`
          @media print {
            @page {
              margin: 0.5cm; 
            }
            body {
              padding: 0; 
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>

      <div className="max-w-3xl mx-auto space-y-6 print:space-y-0">

        {/* Banner Sukses (Disembunyikan saat di-print) */}
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center print:hidden shadow-sm">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-emerald-900 tracking-tight">Registrasi Berhasil!</h1>
          <p className="text-sm font-medium text-emerald-700 mt-2 max-w-lg mx-auto leading-relaxed">
            Akun portal Anda telah dibuat. Silakan <strong>Print / Cetak dokumen ini (PDF)</strong>, beri Materai dan tanda tangan basah, lalu upload kembali di dalam Portal Agent.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-md">
              <Printer size={18} /> Print Dokumen PDF
            </button>
            <button onClick={() => navigate('/agent-login', { replace: true })} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer shadow-sm">
              Lanjut ke Portal Login <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* DOKUMEN YANG AKAN DI-PRINT (SUPER COMPACT) */}
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-4 border border-slate-200 print:border-none text-black">



          <div className="text-center mb-4">
            <h2 className="font-bold text-base uppercase tracking-widest underline underline-offset-2">
              Surat Pernyataan
            </h2>
          </div>

          {/* Bagian Biodata yang diperkecil gap-nya */}
          <div className="text-[12px] leading-tight mb-2">
            <p className="mb-1">Yang bertanda tangan di bawah ini:</p>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="w-24 py-0.5 font-medium">Nama</td>
                  <td>: {state?.nama || '____________________________'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-medium">Perusahaan</td>
                  <td>: {state?.perusahaan || 'Independen / Pribadi'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-medium align-top">Alamat</td>
                  <td>: {state?.alamat || '____________________________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[12px] mb-2 font-medium">Saya bersedia untuk menjadi agent Perumahan Puri Safana Cikeas dan menyatakan menyetujui hal-hal sebagai berikut:</p>

          {/* List spasi sangat rapat */}
          <ol className="list-decimal pl-4 space-y-1 text-[11px] text-justify mb-4 leading-tight">
            <li>Bahwa saya akan menjalankan kegiatan pemasaran dan penjualan unit perumahan sesuai dengan ketentuan, SOP, kebijakan Puri Safana Cikeas, serta arahan manajemen developer.</li>
            <li>Bahwa saya tidak akan memberikan informasi yang tidak benar, menyesatkan, dimanipulasi, atau berbeda dari data resmi Puri Safana Cikeas kepada calon konsumen.</li>
            <li>
              Bahwa saya dilarang melakukan:
              <ul className="list-disc pl-5 mt-0.5">
                <li>Mark up harga unit; Pengambilan keuntungan pribadi; Double booking unit;</li>
                <li>Penahanan booking fee; Manipulasi data penjualan; Penjualan unit fiktif;</li>
                <li>Pengalihan konsumen secara tidak sah; Tindakan merugikan Puri Safana Cikeas/konsumen.</li>
              </ul>
            </li>
            <li>Bahwa seluruh pembayaran konsumen wajib dilakukan langsung ke rekening resmi Puri Safana Cikeas dan saya dilarang menguasai dana konsumen dalam bentuk apa pun.</li>
            <li>Bahwa saya dilarang menyebarluaskan atau memperjualbelikan data identitas, nomor telepon, dan dokumen pribadi konsumen tanpa izin tertulis dari Puri Safana Cikeas.</li>
            <li>Bahwa saya dilarang bekerja sama dengan pihak internal maupun ketiga yang dapat menimbulkan konflik kepentingan atau kerugian bagi Puri Safana Cikeas.</li>
            <li>Bahwa saya wajib menjaga nama baik Puri Safana Cikeas, kerahasiaan data, serta menjalankan etika profesi dalam kegiatan pemasaran dan penjualan.</li>
            <li>
              Bahwa apabila terjadi pelanggaran, Puri Safana Cikeas berhak:
              <ul className="list-disc pl-5 mt-0.5">
                <li>Memberikan sanksi; Membatalkan komisi; Menonaktifkan akses kerja;</li>
                <li>Memberhentikan secara sepihak; Menempuh jalur hukum (pidana/perdata).</li>
              </ul>
            </li>
            <li>Bahwa saya membuat pernyataan ini dalam keadaan sadar, sehat jasmani dan rohani, tanpa paksaan, serta bersedia mematuhi seluruh ketentuan Puri Safana Cikeas.</li>
          </ol>

          <p className="text-[11px] text-justify mb-6">
            Demikian surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.
          </p>

          {/* Area Tanda Tangan Kompak */}
          <div className="flex justify-end pr-4">
            <div className="text-center w-44">
              <p className="text-[12px] mb-8">Yang Membuat Pernyataan,</p>

              <div className="relative flex justify-center items-center w-full">
                {/* Kotak Materai Kecil */}
                <div className="w-16 h-8 border border-dashed border-slate-400 absolute"></div>
              </div>

              <p className="font-bold text-[12px] underline mt-12">{state?.nama || '( Nama Lengkap )'}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AgentRegisterSuccess;