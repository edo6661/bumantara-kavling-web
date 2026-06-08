import { useParams } from 'react-router-dom';
import { useGetCustomerById } from '../../hooks/queries/useCustomer';
import type { CustomerData } from '../../services/customer.service';
import PageLoader from '../PageLoader';
import { User, FileText, Download, Building2, Briefcase, Phone, Mail, MapPin } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import { useState } from 'react';
import JSZip from 'jszip';

type DokumenLainnyaItem = NonNullable<CustomerData['dokumenLainnya']>[number];
type DownloadDocItem = { url: string; name: string };

const fileUrlsList = (fileUrl: DokumenLainnyaItem['fileUrl']): string[] => {
  if (Array.isArray(fileUrl)) return fileUrl.filter(Boolean);
  return fileUrl ? [fileUrl] : [];
};

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useGetCustomerById(id!);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [, setIsDownloading] = useState(false);
  if (isLoading) return <PageLoader />;
  if (!customer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-black text-slate-800">Data Tidak Ditemukan</h2>
        <p className="text-slate-500 mt-2">Data customer mungkin telah dihapus atau ID tidak valid.</p>
      </div>
    );
  }
  const getDownloadUrl = (url: string) => {
    if (!url) return '';
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
    }
    return url;
  };
  const handleDownloadAll = async () => {
    const docs: DownloadDocItem[] = [];
    if (customer.fileKtp) docs.push({ url: customer.fileKtp, name: 'KTP' });
    if (customer.fileKk) docs.push({ url: customer.fileKk, name: 'KK' });
    if (customer.fileNpwp) docs.push({ url: customer.fileNpwp, name: 'NPWP' });
    if (customer.dokumenLainnya) {
      customer.dokumenLainnya.forEach((doc) => {
        const urls = fileUrlsList(doc.fileUrl);
        urls.forEach((url, i) => {
          const suffix = urls.length > 1 ? `_${i + 1}` : '';
          docs.push({ url, name: `${doc.nama}${suffix}` });
        });
      });
    }

    if (docs.length === 0) {
      alert("Tidak ada dokumen yang bisa diunduh.");
      return;
    }

    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const folderName = customer.nama.replace(/[^a-zA-Z0-9]/g, '_');
      const folder = zip.folder(folderName)!;

      await Promise.all(
        docs.map(async (doc) => {
          try {
            const response = await fetch(doc.url);
            const blob = await response.blob();
            const extension = doc.url.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
            const cleanFileName = `${doc.name}.${extension}`;
            folder.file(cleanFileName, blob);
          } catch (err) {
            console.error(`Gagal mengunduh: ${doc.name}`, err);
          }
        })
      );

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `Berkas_${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(zipUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header Halaman */}
      <div className="bg-blue-600 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{customer.nama}</h1>
            <p className="text-blue-200 font-medium mt-1">NIK: {customer.nikKtp}</p>
          </div>
        </div>
        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm cursor-pointer w-full md:w-auto justify-center"
        >
          <Download size={18} /> Download Semua Berkas
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Biodata */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <User size={14} className="text-blue-600" /> Informasi Pribadi
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Phone size={12} /> No Telepon</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{customer.noHp || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Mail size={12} /> Email</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{customer.email || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={12} /> Pekerjaan</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{customer.pekerjaan || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Building2 size={12} /> Perusahaan</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{customer.perusahaan || '-'}</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12} /> Alamat Sesuai KTP</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed mt-1">{customer.alamatKtp}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Kolom Berkas */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" /> Berkas Administrasi KPR
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'KTP', url: customer.fileKtp },
              { label: 'Kartu Keluarga', url: customer.fileKk },
              { label: 'NPWP', url: customer.fileNpwp }
            ].map((doc, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col group relative">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">{doc.label}</p>
                <div
                  onClick={() => doc.url && setPreviewImage(doc.url)}
                  className={`w-full aspect-4/3 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed transition-all ${doc.url ? 'border-slate-200 cursor-zoom-in bg-white' : 'border-slate-200 bg-slate-100'}`}
                >
                  {doc.url ? (
                    (doc.url.split('?')[0].toLowerCase().endsWith('.pdf') || doc.url.includes('application/pdf')) ? (
                      <div className="flex flex-col items-center text-red-500 group-hover:scale-105 transition-transform duration-300">
                        <FileText size={32} />
                        <span className="text-[10px] font-bold mt-1 text-slate-600">PDF</span>
                      </div>
                    ) : (
                      <img src={doc.url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 italic">Belum Diunggah</span>
                  )}
                </div>
                {doc.url && (
                  <a href={getDownloadUrl(doc.url)} download className="mt-3 w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest text-center rounded-lg transition-colors border border-blue-100">
                    Unduh File
                  </a>
                )}
              </div>
            ))}
            {customer.dokumenLainnya?.flatMap((doc) =>
              fileUrlsList(doc.fileUrl).map((fileUrl, i) => ({ doc, fileUrl, key: `${doc.id}-${i}` }))
            ).map(({ doc, fileUrl, key }) => (
              <div key={key} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col group relative">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 truncate" title={doc.nama}>{doc.nama}</p>
                <div
                  onClick={() => setPreviewImage(fileUrl)}
                  className="w-full aspect-4/3 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 bg-white cursor-zoom-in"
                >
                  {fileUrl.split('?')[0].toLowerCase().endsWith('.pdf') || fileUrl.includes('application/pdf') ? (
                    <div className="flex flex-col items-center text-red-500 group-hover:scale-105 transition-transform duration-300">
                      <FileText size={32} />
                      <span className="text-[10px] font-bold mt-1 text-slate-600">PDF</span>
                    </div>
                  ) : (
                    <img src={fileUrl} alt={doc.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                </div>
                <a href={getDownloadUrl(fileUrl)} download className="mt-3 w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest text-center rounded-lg transition-colors border border-blue-100">
                  Unduh File
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Modal Preview Gambar */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {previewImage.split('?')[0].toLowerCase().endsWith('.pdf') || previewImage.includes('application/pdf') ? (
                <iframe src={previewImage} className="w-full h-[75vh] rounded-lg border-none" title="PDF Preview" />
              ) : (
                <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[75vh] rounded-lg shadow-xl object-contain" />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              Buka Layar Penuh
            </a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all cursor-pointer shadow-md">
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default CustomerDetail;