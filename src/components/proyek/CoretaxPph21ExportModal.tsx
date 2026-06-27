import { useEffect, useMemo, useState } from 'react';
import Modal from '../shared/Modal';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';
import {
  buildCoretaxPph21Rows,
  buildDefaultNitkuPemotong,
  downloadCoretaxPph21Xml,
  generateCoretaxPph21Xml,
  getInvalidCoretaxNikEntries,
  getStoredNitkuPemotong,
  isValidNitku,
  resolveCoretaxKsoConfig,
  storeNitkuPemotong,
  buildCoretaxPph21Filename,
  commitCoretaxDocumentNumbers,
  type BuildCoretaxPph21Options,
} from '../../utils/coretaxPph21';

interface CoretaxPph21ExportModalProps {
  isOpen: boolean;
  pembayaran: SpkPembayaranData | null;
  taxPeriodMonth: number;
  taxPeriodYear: number;
  onClose: () => void;
}

const CoretaxPph21ExportModal = ({
  isOpen,
  pembayaran,
  taxPeriodMonth,
  taxPeriodYear,
  onClose,
}: CoretaxPph21ExportModalProps) => {
  const kso = useMemo(
    () => resolveCoretaxKsoConfig(pembayaran?.spk?.bankRekeningPt?.atasNama),
    [pembayaran?.spk?.bankRekeningPt?.atasNama],
  );

  const [nitkuPemotong, setNitkuPemotong] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !kso) return;
    const stored = getStoredNitkuPemotong(kso.companyCode);
    setNitkuPemotong(stored ?? buildDefaultNitkuPemotong(kso.tin));
    setError(null);
  }, [isOpen, kso]);

  const invalidNikEntries = useMemo(
    () => (pembayaran ? getInvalidCoretaxNikEntries(pembayaran) : []),
    [pembayaran],
  );

  const handleExport = () => {
    if (!pembayaran || !kso) return;

    const nitku = nitkuPemotong.replace(/\D/g, '');
    if (!isValidNitku(nitku)) {
      setError('NITKU pemotong harus 22 digit (16 digit NPWP + 6 digit kode TKU).');
      return;
    }
    if (invalidNikEntries.length > 0) {
      setError('Perbaiki NIK tukang yang tidak valid sebelum export.');
      return;
    }

    try {
      const options: BuildCoretaxPph21Options & { nitkuPemotong: string } = {
        taxPeriodMonth,
        taxPeriodYear,
        nitkuPemotong: nitku,
      };
      const { rows } = buildCoretaxPph21Rows(pembayaran, options);
      const xml = generateCoretaxPph21Xml(rows, kso.tin);
      const filename = buildCoretaxPph21Filename(
        pembayaran,
        kso,
        taxPeriodMonth,
        taxPeriodYear,
      );
      downloadCoretaxPph21Xml(xml, filename);
      storeNitkuPemotong(kso.companyCode, nitku);

      const lastDocNumber = Number(rows[rows.length - 1]?.documentNumber.split('/')[0]);
      if (Number.isFinite(lastDocNumber)) {
        commitCoretaxDocumentNumbers(kso.companyCode, taxPeriodYear, lastDocNumber);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat file XML.');
    }
  };

  if (!pembayaran) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export XML PPh 21 Coretax" size="md">
      <div className="space-y-4 text-sm text-slate-700">
        <p className="text-xs text-slate-500">
          NITKU pemotong harus sama dengan yang terdaftar di Coretax (
          <strong>Portal Saya → Profil → Tempat Kegiatan Usaha</strong>). Bukan sekadar NPWP +
          000000 jika kode TKU di Coretax berbeda.
        </p>

        {kso && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <p>
              <span className="text-slate-500">KSO:</span>{' '}
              <span className="font-bold">{kso.label}</span>
            </p>
            <p>
              <span className="text-slate-500">NPWP (TIN):</span>{' '}
              <span className="font-mono">{kso.tin}</span>
            </p>
            <p>
              <span className="text-slate-500">Tukang:</span>{' '}
              <span className="font-bold">{pembayaran.upahBaris?.length ?? 0} orang</span>
            </p>
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            NITKU Pemotong (IDPlaceOfBusinessActivity)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={nitkuPemotong}
            onChange={(e) => {
              setNitkuPemotong(e.target.value.replace(/\D/g, '').slice(0, 22));
              setError(null);
            }}
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm text-black"
            placeholder="22 digit NITKU"
          />
          <p className="mt-1 text-[10px] text-slate-400">
            {nitkuPemotong.replace(/\D/g, '').length}/22 digit
          </p>
        </div>

        {invalidNikEntries.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <p className="font-bold mb-1">NIK tidak valid (harus 16 digit):</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {invalidNikEntries.map((entry) => (
                <li key={entry.id}>
                  {entry.nama}: <span className="font-mono">{entry.nik}</span> ({entry.digitCount}{' '}
                  digit)
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!kso || invalidNikEntries.length > 0}
            className="px-4 py-2 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg disabled:opacity-40"
          >
            Download XML
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CoretaxPph21ExportModal;
