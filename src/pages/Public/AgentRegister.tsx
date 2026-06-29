import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import Modal from '../../components/shared/Modal';
import { UserPlus, Info } from 'lucide-react';
import { authService, type RegisterAgentPayload } from '../../services/auth.service';
import SignatureCanvas from 'react-signature-canvas';
import api from '../../lib/axios';
import { handleApiError } from '../../utils/errorHandler';
import { getNikValidationError, sanitizeNikInput } from '../../utils/nik';

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

  // ✅ PERBAIKAN TS ERROR: Tambahkan "| undefined" pada Record
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [perusahaanList, setPerusahaanList] = useState<{ id: number, nama: string }[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const navigate = useNavigate();
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const fetchPerusahaan = async () => {
      try {
        const res = await api.get('/perusahaan-agents');
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

    if (!isAgreed) {
      setError("Anda wajib membaca dan menyetujui Surat Pernyataan terlebih dahulu.");
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      setError("Tanda tangan wajib diisi!");
      return;
    }

    if (formData.type === 'PERUSAHAAN' && !formData.perusahaanAgentId) {
      setFieldErrors({ perusahaanAgentId: "Perusahaan wajib dipilih" });
      setError("Anda wajib memilih Perusahaan tempat Anda bernaung.");
      return;
    }

    const nikError = getNikValidationError(formData.nik);
    if (nikError) {
      setFieldErrors({ nik: nikError });
      setError('NIK tidak valid. Mohon periksa kembali.');
      return;
    }

    setIsLoading(true);

    try {
      const ttdBase64 = sigCanvas.current?.getCanvas().toDataURL('image/png');
      const payload = { ...formData, nik: sanitizeNikInput(formData.nik), ttdData: ttdBase64 };

      await authService.registerAgent(payload);

      navigate('/agent-register-success', {
        state: {
          nama: formData.nama,
          alamat: formData.alamat,
          perusahaan: getNamaPerusahaan()
        },
        replace: true
      });

    } catch (err: any) {
      // ✅ KODE YANG DIUBAH: Menggunakan helper standar untuk mapping validasi field
      const { message, errors: backendErrors } = handleApiError(err);

      if (backendErrors && Array.isArray(backendErrors)) {
        const newFieldErrors: Record<string, string> = {};
        backendErrors.forEach((errorItem: { field: string; message: string }) => {
          newFieldErrors[errorItem.field] = errorItem.message;
        });
        setFieldErrors(newFieldErrors);
        setError("Ada data yang tidak valid, mohon periksa pesan error pada form di bawah.");
      } else {
        setError(message || 'Terjadi kesalahan saat registrasi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'nik' ? sanitizeNikInput(value) : value;
    setFormData({ ...formData, [name]: nextValue });

    // ✅ KODE YANG DITAMBAHKAN: Hapus pesan error saat user mulai mengetik ulang
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const getNamaPerusahaan = () => {
    if (formData.type === 'PRIBADI') return 'Independen / Pribadi';
    const selected = perusahaanList.find(p => p.id === Number(formData.perusahaanAgentId));
    return selected ? selected.nama : '____________________________';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4 font-sans py-12">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-600/30 mb-4">
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
              error={fieldErrors.type}
              name="type"
              value={formData.type}
              onChange={(e) => {
                setFormData({ ...formData, type: e.target.value, perusahaanAgentId: undefined });
                if (fieldErrors.type) setFieldErrors(prev => ({ ...prev, type: undefined }));
              }}
              options={[{ value: 'PRIBADI', label: 'Pribadi' }, { value: 'PERUSAHAAN', label: 'Perusahaan' }]}
            />

            {formData.type === 'PERUSAHAAN' && (
              <Select
                label="Pilih Perusahaan"
                name="perusahaanAgentId"
                error={fieldErrors.perusahaanAgentId}
                value={formData.perusahaanAgentId || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: '-- Pilih Perusahaan --' },
                  ...perusahaanList.map(p => ({ value: p.id, label: p.nama }))
                ]}
              />
            )}

            <Input
              label="NIK KTP"
              name="nik"
              value={formData.nik}
              onChange={handleChange}
              error={fieldErrors.nik}
              placeholder="16 Digit NIK"
              required
              maxLength={16}
              inputMode="numeric"
            />

            <div className="flex flex-col">
              <Input
                label="Nama Lengkap"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                error={fieldErrors.nama}
                placeholder="Sesuai KTP"
                required
              />
              <span className="text-[10px] text-slate-400 italic ml-1 -mt-3">*Isi nama lengkap sesuai dengan KTP</span>
            </div>

            <Input
              label="No. WhatsApp"
              name="noHp"
              value={formData.noHp}
              onChange={handleChange}
              error={fieldErrors.noHp}
              placeholder="08xxxxxxxx"
              required
            />
          </div>

          <Input
            label="Alamat Lengkap"
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            error={fieldErrors.alamat}
            placeholder="Alamat Domisili"
          />

          <div className="pt-4 border-t border-slate-100 mt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Login</h3>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-2 text-blue-700">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">
                Email dan password di bawah ini akan digunakan untuk masuk ke <b>sistem portal agent Puri Safana</b>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Aktif"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={fieldErrors.email}
                placeholder="email@anda.com"
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={fieldErrors.password}
                placeholder="Min. 6 Karakter"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Persetujuan & Tanda Tangan</h3>

            <div
              onClick={() => setIsModalOpen(true)}
              className="flex items-start gap-3 mb-4 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                id="agreement"
                checked={isAgreed}
                readOnly
                className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 pointer-events-none"
              />
              <label className="text-xs text-slate-600 leading-relaxed pointer-events-none">
                Dengan mencentang kotak ini dan memberikan tanda tangan di bawah, saya menyatakan bahwa saya telah membaca, memahami, dan menyetujui seluruh isi dari{' '}
                <span className="text-blue-600 font-bold underline">
                  Surat Pernyataan Sales Marketing
                </span>.
              </label>
            </div>

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

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md mt-6 disabled:opacity-50 cursor-pointer">
            {isLoading ? 'Memproses Registrasi...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6 font-medium">
          Sudah punya akun? <Link to="/agent-login" className="text-blue-600 hover:underline font-bold">Login di sini</Link>
        </p>
      </div>

      {/* Modal Surat Pernyataan */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detail Persyaratan">
        <div className="text-sm text-slate-700 space-y-5 leading-relaxed pb-4">
          <div className="text-center space-y-1">
            <h2 className="font-bold text-base underline uppercase">Surat Pernyataan Sales Marketing</h2>
            <h3 className="font-bold text-sm uppercase">Tentang Kepatuhan Tata Cara Penjualan Perumahan</h3>
          </div>

          <div>
            <p className="mb-2">Yang bertanda tangan di bawah ini:</p>
            <table className="w-full border-collapse">
              <tbody>
                <tr><td className="w-28 py-1">Nama</td><td className="font-medium">: {formData.nama || '____________________________'}</td></tr>
                <tr><td className="w-28 py-1">Jabatan</td><td className="font-medium">: Sales Marketing</td></tr>
                <tr><td className="w-28 py-1">Perusahaan</td><td className="font-medium">: {getNamaPerusahaan()}</td></tr>
                <tr><td className="w-28 py-1 align-top">Alamat</td><td className="font-medium">: {formData.alamat || '____________________________'}</td></tr>
              </tbody>
            </table>
          </div>

          <p>Dengan ini menyatakan dan menyetujui hal-hal sebagai berikut:</p>

          <ol className="list-decimal pl-5 space-y-3 text-justify">
            <li>Bahwa saya akan menjalankan kegiatan pemasaran dan penjualan unit perumahan sesuai dengan ketentuan, SOP, kebijakan perusahaan, serta arahan manajemen developer.</li>
            <li>Bahwa saya tidak akan memberikan informasi yang tidak benar, menyesatkan, dimanipulasi, atau berbeda dari data resmi perusahaan kepada calon konsumen, baik terkait harga, legalitas, spesifikasi bangunan, fasilitas, promo, skema pembayaran, maupun waktu serah terima unit.</li>
            <li>Bahwa saya dilarang melakukan:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Mark up harga unit tanpa persetujuan resmi perusahaan;</li>
                <li>Pengambilan keuntungan pribadi di luar ketentuan perusahaan;</li>
                <li>Double booking unit;</li>
                <li>Penahanan booking fee;</li>
                <li>Manipulasi data penjualan;</li>
                <li>Penjualan unit fiktif;</li>
                <li>Pengalihan konsumen secara tidak sah;</li>
                <li>Segala bentuk tindakan yang merugikan perusahaan maupun konsumen.</li>
              </ul>
            </li>
            <li>Bahwa seluruh pembayaran konsumen wajib dilakukan langsung ke rekening resmi perusahaan/developer dan saya tidak diperkenankan menerima, menyimpan, meminjam, menggunakan, ataupun menguasai dana konsumen dalam bentuk apa pun atas nama pribadi.</li>
            <li>Bahwa saya dilarang menggunakan, menyebarluaskan, memperjualbelikan, memanfaatkan, ataupun memberikan data konsumen kepada pihak mana pun tanpa izin tertulis dari perusahaan, termasuk namun tidak terbatas pada nomor telepon, alamat, identitas, data pembayaran, dan dokumen pribadi konsumen.</li>
            <li>Bahwa saya dilarang bekerja sama, bersekongkol, bermain dengan orang dalam, staf internal, pihak ketiga, ataupun pihak lainnya dalam bentuk apa pun yang dapat menimbulkan konflik kepentingan, penyimpangan penjualan, manipulasi unit, penyalahgunaan kewenangan, ataupun kerugian bagi perusahaan.</li>
            <li>Bahwa saya wajib menjaga nama baik perusahaan, menjaga kerahasiaan perusahaan, serta menjalankan etika profesi dalam seluruh kegiatan pemasaran dan penjualan.</li>
            <li>Bahwa apabila saya terbukti melakukan pelanggaran terhadap ketentuan perusahaan, SOP, tata cara penjualan, maupun isi surat pernyataan ini, maka perusahaan berhak:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Memberikan sanksi administratif;</li>
                <li>Membatalkan komisi dan insentif;</li>
                <li>Menonaktifkan akses kerja;</li>
                <li>Memberhentikan saya secara sepihak tanpa kewajiban memberikan alasan ataupun kompensasi dalam bentuk apa pun;</li>
                <li>Menempuh jalur hukum apabila ditemukan unsur pidana maupun perdata.</li>
              </ul>
            </li>
            <li>Bahwa saya membuat dan menandatangani surat pernyataan ini dalam keadaan sadar, sehat jasmani dan rohani, tanpa paksaan dari pihak mana pun, serta bersedia mematuhi seluruh ketentuan yang berlaku di perusahaan.</li>
          </ol>

          <p className="pt-2 text-justify">
            Demikian surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya. Dengan menekan tombol "Saya Mengerti & Setuju" dan memberikan tanda tangan secara digital, maka pernyataan ini sah dan mengikat secara hukum.
          </p>

          <div className="flex justify-end pt-4 gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-slate-500 hover:text-slate-700 px-4 py-2 font-semibold text-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAgreed(true);
                setIsModalOpen(false);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 cursor-pointer shadow-md"
            >
              Saya Mengerti & Setuju
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentRegister;