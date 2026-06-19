/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileText } from 'lucide-react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Select from '../shared/Select';
import FileInput from '../shared/FileInput';
import CurrencyInput from '../shared/CurrencyInput';
import { formatRupiah } from '../../utils/formatters';
import { isAgentPerusahaan } from '../../utils/agentCommercialProfile';
import type { AgentData } from '../../types/models/agent';
import type { AgentCrudApi } from '../../hooks/useAgentCrud';

interface AgentCrudModalsProps {
  crud: AgentCrudApi;
}

const AgentCrudModals = ({ crud }: AgentCrudModalsProps) => {
  const {
    perusahaanList,
    lockAgentType,
    isModalOpen,
    formData,
    errors,
    isEditing,
    isDetailModalOpen,
    selectedAgentDetail,
    isUploadModalOpen,
    selectedUploadAgent,
    previewImage,
    setPreviewImage,
    setIsDetailModalOpen,
    setIsUploadModalOpen,
    createMutation,
    updateMutation,
    uploadDocMutation,
    resolveAgentCommercial,
    closeModal,
    handleChange,
    handleCurrencyChange,
    handlePICChange,
    handleAddPIC,
    handleRemovePIC,
    handleSubmit,
    handleUploadDoc,
  } = crud;

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? 'Edit Data Agent' : 'Tambah Data Agent'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Utama Agent</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!lockAgentType && (
                <Select
                  label="Tipe Agent"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  error={errors.type}
                  options={[
                    { value: 'PRIBADI', label: 'Pribadi' },
                    { value: 'PERUSAHAAN', label: 'Perusahaan' },
                  ]}
                />
              )}

              {isAgentPerusahaan(formData.type) && (
                <Select
                  label="Pilih Perusahaan"
                  name="perusahaanAgentId"
                  value={formData.perusahaanAgentId || ''}
                  onChange={handleChange}
                  error={errors.perusahaanAgentId}
                  options={[
                    { value: '', label: '-- Pilih Perusahaan --' },
                    ...perusahaanList.map((p) => ({ value: p.id, label: p.nama })),
                  ]}
                />
              )}

              <Input label="NIK KTP" name="nik" value={formData.nik} onChange={handleChange} error={errors.nik} placeholder="Masukkan NIK 16 Digit" />
              <Input label="Nama Lengkap / Perusahaan" name="nama" value={formData.nama} onChange={handleChange} error={errors.nama} placeholder="Sesuai KTP" />
              <Input label="No. WhatsApp / HP" name="noHp" value={formData.noHp} onChange={handleChange} error={errors.noHp} placeholder="08xxxxxxxxxx" />
              <Input label="Email (Untuk Login)" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
              <div className="md:col-span-2">
                {isAgentPerusahaan(formData.type) ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                      Fee & Rekening — otomatis dari perusahaan
                    </p>
                    {!formData.perusahaanAgentId ? (
                      <p className="text-sm text-slate-600">Pilih perusahaan terlebih dahulu.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Fee Marketing</p>
                          <p className="font-semibold text-slate-900">{formData.feeMarketingPct !== '' ? `${formData.feeMarketingPct}%` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Fee Closing</p>
                          <p className="font-semibold text-slate-900">{formData.feeClosingNominal !== '' ? formatRupiah(Number(formData.feeClosingNominal)) : '-'}</p>
                          {formData.isPkp && formData.feeClosingNominal !== '' ? (
                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Termasuk PPN 11%</p>
                          ) : null}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">PKP</p>
                          <p className="font-semibold text-slate-900">{formData.isPkp ? 'PKP' : 'Non-PKP'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Pot. PPh</p>
                          <p className="font-semibold text-slate-900">{formData.potonganPph !== '' ? `${formData.potonganPph}%` : '-'}</p>
                        </div>
                        <div className="md:col-span-3 pt-2 border-t border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Bank</p>
                            <p className="font-semibold text-slate-900">{formData.namaBank || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">No. Rekening</p>
                            <p className="font-semibold text-slate-900">{formData.noRekening || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Atas Nama</p>
                            <p className="font-semibold text-slate-900">{formData.atasNamaRekening || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Ubah nilai fee atau rekening di menu Marketing → Perusahaan Agent.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Fee Marketing (%)"
                        name="feeMarketingPct"
                        type="number"
                        step="any"
                        value={formData.feeMarketingPct}
                        onChange={handleChange}
                        placeholder="Contoh: 2.5"
                      />
                      <div className="w-full">
                        <CurrencyInput
                          label="Fee Closing (Rp)"
                          name="feeClosingNominal"
                          value={Number(formData.feeClosingNominal) || 0}
                          onValueChange={(_, val) => handleCurrencyChange('feeClosingNominal', val)}
                          placeholder="0"
                        />
                      </div>
                      <Input
                        label="Potongan PPh (%)"
                        name="potonganPph"
                        type="number"
                        step="any"
                        value={formData.potonganPph}
                        onChange={handleChange}
                        placeholder="Contoh: 2.5"
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Rekening Bank (Opsional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Nama Bank" name="namaBank" value={formData.namaBank} onChange={handleChange} error={errors.namaBank} placeholder="Contoh: BCA / BSI" />
                        <Input label="Nomor Rekening" name="noRekening" value={formData.noRekening} onChange={handleChange} error={errors.noRekening} placeholder="Masukkan No. Rek" />
                        <Input label="Atas Nama Rekening" name="atasNamaRekening" value={formData.atasNamaRekening} onChange={handleChange} error={errors.atasNamaRekening} placeholder="A/N Rekening" />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="md:col-span-2">
                <Input label="Alamat Lengkap (Opsional)" name="alamat" value={formData.alamat} onChange={handleChange} error={errors.alamat} placeholder="Masukkan alamat lengkap agent" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Daftar PIC Agent (Opsional)</h4>
                <p className="text-xs text-gray-500">Tambahkan kontak PIC untuk di bawah agent ini</p>
              </div>
              <button type="button" onClick={handleAddPIC} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-black rounded-lg transition-colors cursor-pointer shadow-sm">
                + Tambah PIC
              </button>
            </div>

            <div className="space-y-4">
              {formData.pics.map((pic, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg relative shadow-sm">
                  {formData.pics.length > 1 && (
                    <button type="button" onClick={() => handleRemovePIC(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer">Hapus</button>
                  )}
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">PIC #{index + 1}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nama PIC" name="nama" value={pic.nama} onChange={(e) => handlePICChange(index, e)} error={errors[`pics.${index}.nama`]} placeholder="Masukkan nama PIC" />
                    <Input label="No. Telepon / HP PIC" name="noHp" value={pic.noHp} onChange={(e) => handlePICChange(index, e)} error={errors[`pics.${index}.noHp`]} placeholder="08xxxxxxxxxx" />
                    <div className="md:col-span-2">
                      <Input label="Alamat PIC (Opsional)" name="alamat" value={pic.alamat || ''} onChange={(e) => handlePICChange(index, e)} error={errors[`pics.${index}.alamat`]} placeholder="Masukkan alamat lengkap PIC" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 text-sm font-bold text-white bg-black rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors shadow-md">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={`Upload Dokumen Agent: ${selectedUploadAgent?.nama}`}>
        {selectedUploadAgent && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(selectedUploadAgent.type === 'PRIBADI'
                ? ['fileSuratPernyataan', 'fileKtp', 'fileNpwp', 'kwitansiBookingFee']
                : ['fileSuratPernyataan', 'fileSuratKeterangan', 'fileKtpDirektur', 'fileNpwpPerusahaan']
              ).map((type) => (
                <div key={type} className="flex flex-col gap-3 p-4 border rounded-2xl bg-slate-50/50 hover:bg-white transition-all group shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 text-center">
                    {type.replace('file', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div
                    onClick={() => selectedUploadAgent[type as keyof AgentData] && setPreviewImage(selectedUploadAgent[type as keyof AgentData] as string)}
                    className={`aspect-[4/3] w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all ${selectedUploadAgent[type as keyof AgentData] ? 'border-slate-200 cursor-zoom-in bg-white' : 'border-slate-300 bg-slate-100'}`}
                  >
                    {selectedUploadAgent[type as keyof AgentData] ? (
                      ((selectedUploadAgent[type as keyof AgentData] as string).split('?')[0].toLowerCase().endsWith('.pdf') || (selectedUploadAgent[type as keyof AgentData] as string).includes('application/pdf')) ? (
                        <div className="flex flex-col items-center text-red-500 group-hover:scale-105 transition-transform">
                          <FileText size={32} />
                          <span className="text-[10px] font-bold mt-1 text-slate-600">PDF</span>
                        </div>
                      ) : (
                        <img src={selectedUploadAgent[type as keyof AgentData] as string} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 italic">KOSONG</span>
                    )}
                  </div>
                  <FileInput label="Upload / Ganti" accept="image/*,.pdf" onChange={(e) => handleUploadDoc(type, e)} disabled={uploadDocMutation.isPending} />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 cursor-pointer transition-all" type="button">
                Tutup Dokumen
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Informasi Detail Agent">
        {selectedAgentDetail && (() => {
          const detailCommercial = resolveAgentCommercial(selectedAgentDetail);
          return (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Biodata Agent</h4>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${selectedAgentDetail.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{selectedAgentDetail.status}</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] uppercase font-bold tracking-wider">{selectedAgentDetail.type}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  {selectedAgentDetail.type === 'PERUSAHAAN' && selectedAgentDetail.perusahaanAgent && (
                    <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-2">
                      <p className="text-[10px] text-blue-500 uppercase font-bold mb-1">Perusahaan Induk</p>
                      <p className="text-sm font-black text-blue-900">{selectedAgentDetail.perusahaanAgent.nama}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nama Agent</p>
                    <p className="text-sm font-bold text-slate-900">{selectedAgentDetail.nama}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">NIK</p>
                    <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.nik}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">No. WhatsApp / Telepon</p>
                    <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.noHp}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Email</p>
                    <p className="text-sm font-medium text-slate-800">{selectedAgentDetail.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fee Marketing (%)</p>
                    <p className="text-sm font-medium text-slate-800 tabular-nums">{detailCommercial.feeMarketingPct ?? '-'} %</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fee Closing (Rp)</p>
                    <p className="text-sm font-medium text-slate-800 tabular-nums">
                      {detailCommercial.feeClosingNominal != null ? formatRupiah(detailCommercial.feeClosingNominal) : '-'}
                    </p>
                  </div>
                  {isAgentPerusahaan(selectedAgentDetail.type) && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">PKP</p>
                      <p className="text-sm font-medium text-slate-800">{detailCommercial.isPkp ? 'PKP' : 'Non-PKP'}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Potongan PPh (%)</p>
                    <p className="text-sm font-medium text-slate-800 tabular-nums">{detailCommercial.potonganPph ?? '-'} %</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Alamat Lengkap</p>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">{selectedAgentDetail.alamat || '-'}</p>
                  </div>
                  <div className="md:col-span-2 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bank Agent</p>
                      <p className="text-sm font-bold text-slate-900">{detailCommercial.namaBank || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nomor Rekening</p>
                      <p className="text-lg font-black text-blue-600 font-mono tabular-nums">{detailCommercial.noRekening || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Atas Nama (A/N)</p>
                      <p className="text-sm font-bold text-slate-900">{detailCommercial.atasNamaRekening || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedAgentDetail.type && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Dokumen / Berkas Agent</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(selectedAgentDetail.type === 'PRIBADI'
                      ? ['fileSuratPernyataan', 'fileKtp', 'fileNpwp', 'kwitansiBookingFee']
                      : ['fileSuratPernyataan', 'fileSuratKeterangan', 'fileKtpDirektur', 'fileNpwpPerusahaan']
                    ).map((type) => (
                      <div key={type} className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 text-center">
                          {type.replace('file', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div
                          onClick={() => selectedAgentDetail[type as keyof AgentData] && setPreviewImage(selectedAgentDetail[type as keyof AgentData] as string)}
                          className={`aspect-[4/3] rounded-xl border flex items-center justify-center overflow-hidden transition-all ${selectedAgentDetail[type as keyof AgentData] ? 'border-slate-200 cursor-zoom-in bg-white' : 'border-slate-100 bg-slate-50'}`}
                        >
                          {selectedAgentDetail[type as keyof AgentData] ? (
                            ((selectedAgentDetail[type as keyof AgentData] as string).split('?')[0].toLowerCase().endsWith('.pdf') || (selectedAgentDetail[type as keyof AgentData] as string).includes('application/pdf')) ? (
                              <div className="flex flex-col items-center text-red-500">
                                <FileText size={24} />
                                <span className="text-[8px] font-bold mt-1 text-slate-600">PDF</span>
                              </div>
                            ) : (
                              <img src={selectedAgentDetail[type as keyof AgentData] as string} alt={type} className="w-full h-full object-cover" />
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 italic text-center px-2">Belum Upload</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAgentDetail.pics && selectedAgentDetail.pics.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Kontak Tim / PIC Pendukung</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedAgentDetail.pics.map((pic, idx) => (
                      <div key={pic.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-100 transition-colors">
                        <p className="text-sm font-bold text-slate-800 mb-1">{pic.nama}</p>
                        <p className="text-xs text-slate-500 tabular-nums mb-1">📞 {pic.noHp}</p>
                        <p className="text-xs text-slate-400 truncate">📍 {pic.alamat || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAgentDetail.ttdData && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-4 text-center">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Tanda Tangan Pendaftar</h4>
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-2 inline-block">
                    <img src={selectedAgentDetail.ttdData} alt="Tanda Tangan" className="h-24 object-contain" />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button onClick={() => setIsDetailModalOpen(false)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer shadow-md" type="button">
                  Tutup Detail
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {previewImage.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewImage} className="w-full h-[60vh] rounded-lg border-none" title="PDF Preview" />
              ) : (
                <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20" type="button">Tutup</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AgentCrudModals;
