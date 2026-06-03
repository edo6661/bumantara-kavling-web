import { useMemo, useState } from 'react';
import { FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../shared/Modal';
import CurrencyInput from '../shared/CurrencyInput';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../shared/BuktiFileThumbnail';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { handleApiError } from '../../utils/errorHandler';
import {
  useCreateSpkPembayaranRequest,
  useDeleteSpkPengurangan,
  useGetSpkPembayaranBySpk,
  useUpdateSpkKasbon,
  useUpdateSpkUpah,
} from '../../hooks/queries/useSpkPembayaran';
import { useGetTukangList } from '../../hooks/queries/useTukang';
import type {
  SpkPembayaranKasbonBarisBody,
  SpkPembayaranUpahBarisBody,
} from '../../services/spkPembayaran.service';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import type { SpkData } from '../../services/spk.service';
import type { SpkPembayaranData } from '../../services/spkPembayaran.service';
import {
  SPK_KASBON_TARGET_LABEL,
  SPK_PEMBAYARAN_JENIS_LABEL,
  JENIS_UI_COLOR,
  calcSpkPembayaranNominal,
  canRequestKasbon,
  canRequestSpkPembayaran,
  getPengurangTerminCapacity,
  validatePengurangTerminNominal,
  type SpkKasbonTargetTermin,
  type SpkPembayaranJenis,
  type SpkPengurangTerminRow,
  type SpkTerminPembayaranJenis,
} from '../../utils/spkPembayaran';
import { buildSpkPembayaranKalkulasi } from '../../utils/spkPembayaranKalkulasi';

const TERMIN_JENIS_ORDER: SpkTerminPembayaranJenis[] = ['TERMIN_55', 'TERMIN_100', 'RETENSI'];

const todayIso = () => new Date().toISOString().split('T')[0]!;

interface UpahBarisForm {
  key: string;
  tukangId: number | '';
  nik: string;
  nama: string;
  nominal: number | '';
}

const newUpahBaris = (): UpahBarisForm => ({
  key: `${Date.now()}-${Math.random()}`,
  tukangId: '',
  nik: '',
  nama: '',
  nominal: '',
});

const parseUpahBarisBody = (rows: UpahBarisForm[]): SpkPembayaranUpahBarisBody[] | null => {
  const parsed: SpkPembayaranUpahBarisBody[] = [];
  for (const row of rows) {
    const nik = row.nik.trim();
    const nama = row.nama.trim();
    const nominal = row.nominal === '' ? 0 : Number(row.nominal);
    if (!nik || !nama || !nominal || nominal <= 0) return null;
    parsed.push({
      tukangId: row.tukangId === '' ? null : row.tukangId,
      nik,
      nama,
      nominal,
    });
  }
  return parsed.length ? parsed : null;
};

const upahBarisFromPembayaran = (row: SpkPembayaranData): UpahBarisForm[] =>
  (row.upahBaris ?? []).map((b) => ({
    key: `baris-${b.id}`,
    tukangId: b.tukangId ?? '',
    nik: b.nik,
    nama: b.nama,
    nominal: b.nominal,
  }));

const toDateInputValue = (dateStr: string | null | undefined) => {
  if (!dateStr) return todayIso();
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return todayIso();
  return d.toISOString().split('T')[0]!;
};

interface KasbonBarisForm {
  key: string;
  tanggalPo: string;
  keterangan: string;
  nominal: number | '';
}

const newKasbonBaris = (): KasbonBarisForm => ({
  key: `${Date.now()}-${Math.random()}`,
  tanggalPo: todayIso(),
  keterangan: '',
  nominal: '',
});

const isBatchKasbon = (row: SpkPembayaranData) => (row.kasbonBaris?.length ?? 0) > 0;

const parseKasbonBarisBody = (
  rows: KasbonBarisForm[],
): SpkPembayaranKasbonBarisBody[] | null => {
  const parsed: SpkPembayaranKasbonBarisBody[] = [];
  for (const row of rows) {
    const keterangan = row.keterangan.trim();
    const nominal = row.nominal === '' ? 0 : Number(row.nominal);
    if (!keterangan || !row.tanggalPo || !nominal || nominal <= 0) return null;
    parsed.push({
      keterangan,
      tanggalPo: row.tanggalPo,
      nominal,
    });
  }
  return parsed.length ? parsed : null;
};

const kasbonBarisFromPembayaran = (row: SpkPembayaranData): KasbonBarisForm[] =>
  (row.kasbonBaris ?? []).map((b) => ({
    key: `kasbon-${b.id}`,
    tanggalPo: toDateInputValue(b.tanggalPo),
    keterangan: b.keterangan,
    nominal: b.nominal,
  }));

const thClass =
  'px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase bg-slate-50 border border-slate-200 whitespace-nowrap';
const tdClass = 'px-2.5 py-1.5 border border-slate-200 text-xs text-slate-800 align-middle';

const toCalcRows = (list: SpkPembayaranData[]) =>
  list.map((p) => ({
    jenis: p.jenis,
    status: p.status,
    nominal: p.nominal,
    mengurangiTermin: p.mengurangiTermin,
  }));

const KalkulasiSingkat = ({
  jenis,
  spk,
  pembayaranList,
}: {
  jenis: SpkTerminPembayaranJenis;
  spk: SpkData;
  pembayaranList: SpkPembayaranData[];
}) => {
  const baris = buildSpkPembayaranKalkulasi(
    jenis,
    { nilaiKontrak: spk.nilaiKontrak },
    toCalcRows(pembayaranList),
  );

  return (
    <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5 text-[9px] text-slate-500 leading-tight min-w-[160px]">
      {baris.map((b) => (
        <div key={b.label} className="flex justify-between gap-2">
          <span className="text-left">{b.label}</span>
          <span
            className={`shrink-0 font-semibold tabular-nums ${
              b.tipe === 'negatif'
                ? 'text-red-600'
                : b.tipe === 'hasil'
                  ? 'text-indigo-600'
                  : 'text-slate-600'
            }`}
          >
            {b.tipe === 'negatif' ? '− ' : ''}
            {formatRupiah(b.nilai)}
          </span>
        </div>
      ))}
    </div>
  );
};

const PengurangPlafonBanner = ({
  nilaiKontrak,
  rows,
  termin,
  additionalNominal,
  excludeId,
}: {
  nilaiKontrak: number;
  rows: SpkPengurangTerminRow[];
  termin: SpkKasbonTargetTermin;
  additionalNominal: number;
  excludeId?: number;
}) => {
  const cap = getPengurangTerminCapacity(nilaiKontrak, rows, termin, {
    excludeId,
    additionalNominal,
  });

  return (
    <p
      className={`text-xs rounded-lg px-3 py-2 border ${
        cap.allowed || additionalNominal <= 0
          ? 'text-slate-700 bg-slate-50 border-slate-200'
          : 'text-red-800 bg-red-50 border-red-200'
      }`}
    >
      Plafon {SPK_KASBON_TARGET_LABEL[termin]}: <strong>{formatRupiah(cap.bruto)}</strong>
      {' · '}Terpakai (kasbon & upah): <strong>{formatRupiah(cap.terpakai)}</strong>
      {' · '}Sisa: <strong>{formatRupiah(cap.sisa)}</strong>
      {additionalNominal > 0 && (
        <>
          {' · '}Nominal ini: <strong>{formatRupiah(additionalNominal)}</strong>
          {' · '}Sisanya :{' '}
          <strong className={cap.allowed ? 'text-emerald-700' : 'text-red-700'}>
            {formatRupiah(Math.max(0, cap.sisaSetelah))}
          </strong>
        </>
      )}
      {!cap.allowed && additionalNominal > 0 && (
        <span className="block mt-1 font-semibold text-red-700">
          Melebihi plafon termin.
        </span>
      )}
    </p>
  );
};

interface SpkPembayaranPanelProps {
  spk: SpkData;
  canAjukan: boolean;
}

const SpkPembayaranPanel = ({ spk, canAjukan }: SpkPembayaranPanelProps) => {
  const { user } = useAuth();
  const { canUpdate: canUpdateSpk } = usePermission('SPK');
  const canEditKasbon = canUpdateSpk && user?.role !== 'MANDOR';

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [kasbonModalOpen, setKasbonModalOpen] = useState(false);
  const [kasbonEditModalOpen, setKasbonEditModalOpen] = useState(false);
  const [editingKasbon, setEditingKasbon] = useState<SpkPembayaranData | null>(null);
  const [editingKasbonIsBatch, setEditingKasbonIsBatch] = useState(false);
  const [kasbonBarisForm, setKasbonBarisForm] = useState<KasbonBarisForm[]>(() => [
    newKasbonBaris(),
  ]);
  const [kasbonLegacyKeterangan, setKasbonLegacyKeterangan] = useState('');
  const [kasbonLegacyNominal, setKasbonLegacyNominal] = useState<number | ''>('');
  const [kasbonLegacyTanggalPo, setKasbonLegacyTanggalPo] = useState(() => todayIso());
  const [upahModalOpen, setUpahModalOpen] = useState(false);
  const [upahEditModalOpen, setUpahEditModalOpen] = useState(false);
  const [editingUpah, setEditingUpah] = useState<SpkPembayaranData | null>(null);
  const [upahTanggalDari, setUpahTanggalDari] = useState(() => todayIso());
  const [upahTanggalSampai, setUpahTanggalSampai] = useState(() => todayIso());
  const [upahBaris, setUpahBaris] = useState<UpahBarisForm[]>(() => [newUpahBaris()]);

  const { data: pembayaranList = [], isLoading } = useGetSpkPembayaranBySpk(spk.id);
  const { data: tukangList = [] } = useGetTukangList(undefined, upahModalOpen || upahEditModalOpen);
  const createMutation = useCreateSpkPembayaranRequest();
  const updateKasbonMutation = useUpdateSpkKasbon();
  const updateUpahMutation = useUpdateSpkUpah();
  const deleteMutation = useDeleteSpkPengurangan();

  const calcRows = toCalcRows(pembayaranList);
  const pengurangRows: SpkPengurangTerminRow[] = useMemo(
    () =>
      pembayaranList.map((p) => ({
        id: p.id,
        jenis: p.jenis,
        nominal: p.nominal,
        mengurangiTermin: p.mengurangiTermin,
      })),
    [pembayaranList],
  );
  const statusRows = pembayaranList.map((p) => ({
    id: p.id,
    jenis: p.jenis,
    status: p.status,
    nominal: p.nominal,
    mengurangiTermin: p.mengurangiTermin,
  }));

  const spkInput = {
    nilaiKontrak: spk.nilaiKontrak,
    progress: Number(spk.progress ?? 0),
  };

  const kasbonItems = pembayaranList.filter((p) => p.jenis === 'KASBON');
  const upahItems = pembayaranList.filter((p) => p.jenis === 'UPAH');
  const pengurangCheck = canRequestKasbon(statusRows, spk.nilaiKontrak);

  const kasbonTotalPreview = useMemo(
    () =>
      kasbonBarisForm.reduce(
        (sum, row) => sum + (row.nominal === '' ? 0 : Number(row.nominal)),
        0,
      ),
    [kasbonBarisForm],
  );

  const upahTotalPreview = useMemo(
    () =>
      upahBaris.reduce(
        (sum, row) => sum + (row.nominal === '' ? 0 : Number(row.nominal)),
        0,
      ),
    [upahBaris],
  );

  const kasbonLegacyEditTotal =
    kasbonLegacyNominal === '' ? 0 : Number(kasbonLegacyNominal);

  const kasbonCreateOverPlafon =
    !!pengurangCheck.targetTermin &&
    kasbonTotalPreview > 0 &&
    !getPengurangTerminCapacity(
      spk.nilaiKontrak,
      pengurangRows,
      pengurangCheck.targetTermin,
      { additionalNominal: kasbonTotalPreview },
    ).allowed;

  const upahCreateOverPlafon =
    !!pengurangCheck.targetTermin &&
    upahTotalPreview > 0 &&
    !getPengurangTerminCapacity(
      spk.nilaiKontrak,
      pengurangRows,
      pengurangCheck.targetTermin,
      { additionalNominal: upahTotalPreview },
    ).allowed;

  const kasbonEditOverPlafon = useMemo(() => {
    if (!editingKasbon?.mengurangiTermin) return false;
    const total = editingKasbonIsBatch ? kasbonTotalPreview : kasbonLegacyEditTotal;
    if (total <= 0) return false;
    return !getPengurangTerminCapacity(
      spk.nilaiKontrak,
      pengurangRows,
      editingKasbon.mengurangiTermin,
      { excludeId: editingKasbon.id, additionalNominal: total },
    ).allowed;
  }, [
    editingKasbon,
    editingKasbonIsBatch,
    kasbonTotalPreview,
    kasbonLegacyEditTotal,
    pengurangRows,
    spk.nilaiKontrak,
  ]);

  const upahEditOverPlafon = useMemo(() => {
    if (!editingUpah?.mengurangiTermin) return false;
    if (upahTotalPreview <= 0) return false;
    return !getPengurangTerminCapacity(
      spk.nilaiKontrak,
      pengurangRows,
      editingUpah.mengurangiTermin,
      { excludeId: editingUpah.id, additionalNominal: upahTotalPreview },
    ).allowed;
  }, [editingUpah, upahTotalPreview, pengurangRows, spk.nilaiKontrak]);

  const handleUpahNominalChange = (key: string, value: number) => {
    setUpahBaris((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, nominal: value > 0 ? value : '' } : row,
      ),
    );
  };

  const handleAjukanTermin = async (jenis: SpkTerminPembayaranJenis) => {
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }
    if (
      !window.confirm(
        `Ajukan pembayaran ${SPK_PEMBAYARAN_JENIS_LABEL[jenis]} sebesar ${formatRupiah(check.nominal)}?`,
      )
    ) {
      return;
    }
    try {
      await createMutation.mutateAsync({ spkId: spk.id, body: { jenis } });
      alert('Pengajuan pembayaran berhasil dikirim ke finance.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const resetKasbonForm = () => {
    setKasbonBarisForm([newKasbonBaris()]);
  };

  const handleKasbonNominalChange = (key: string, value: number) => {
    setKasbonBarisForm((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, nominal: value > 0 ? value : '' } : row,
      ),
    );
  };

  const handleAjukanKasbon = async () => {
    const baris = parseKasbonBarisBody(kasbonBarisForm);
    if (!baris) {
      alert('Setiap baris kasbon wajib memiliki tanggal PO, keterangan, dan nominal lebih dari 0.');
      return;
    }
    if (!pengurangCheck.allowed) {
      alert(pengurangCheck.reason);
      return;
    }
    const targetLabel = pengurangCheck.targetTermin
      ? SPK_KASBON_TARGET_LABEL[pengurangCheck.targetTermin]
      : '';
    const total = baris.reduce((sum, b) => sum + b.nominal, 0);
    if (pengurangCheck.targetTermin) {
      const plafon = validatePengurangTerminNominal(
        spk.nilaiKontrak,
        pengurangRows,
        pengurangCheck.targetTermin,
        total,
      );
      if (!plafon.allowed) {
        alert(plafon.reason);
        return;
      }
    }
    if (
      !window.confirm(
        `Ajukan kasbon ${formatRupiah(total)} (${baris.length} item)?\nMengurangi: ${targetLabel}\nFinance dapat mengunggah 1– beberapa bukti transfer untuk seluruh item.`,
      )
    ) {
      return;
    }
    try {
      await createMutation.mutateAsync({
        spkId: spk.id,
        body: {
          jenis: 'KASBON',
          kasbonBaris: baris,
        },
      });
      setKasbonModalOpen(false);
      resetKasbonForm();
      alert('Pengajuan kasbon berhasil dikirim ke finance.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const resetUpahForm = () => {
    setUpahTanggalDari(todayIso());
    setUpahTanggalSampai(todayIso());
    setUpahBaris([newUpahBaris()]);
  };

  const handleAjukanUpah = async () => {
    const baris = parseUpahBarisBody(upahBaris);
    if (!upahTanggalDari || !upahTanggalSampai) {
      alert('Periode tanggal wajib diisi.');
      return;
    }
    if (upahTanggalDari > upahTanggalSampai) {
      alert('Tanggal dari tidak boleh setelah tanggal sampai.');
      return;
    }
    if (!baris) {
      alert('Setiap baris tukang wajib memiliki NIK, nama, dan nominal lebih dari 0.');
      return;
    }
    if (!pengurangCheck.allowed) {
      alert(pengurangCheck.reason);
      return;
    }
    const targetLabel = pengurangCheck.targetTermin
      ? SPK_KASBON_TARGET_LABEL[pengurangCheck.targetTermin]
      : '';
    const total = baris.reduce((sum, b) => sum + b.nominal, 0);
    if (pengurangCheck.targetTermin) {
      const plafon = validatePengurangTerminNominal(
        spk.nilaiKontrak,
        pengurangRows,
        pengurangCheck.targetTermin,
        total,
      );
      if (!plafon.allowed) {
        alert(plafon.reason);
        return;
      }
    }
    if (
      !window.confirm(
        `Ajukan upah ${formatRupiah(total)} untuk ${baris.length} tukang?\nPeriode: ${upahTanggalDari} s/d ${upahTanggalSampai}\nMengurangi: ${targetLabel}`,
      )
    ) {
      return;
    }
    try {
      await createMutation.mutateAsync({
        spkId: spk.id,
        body: {
          jenis: 'UPAH',
          tanggalDari: upahTanggalDari,
          tanggalSampai: upahTanggalSampai,
          baris,
        },
      });
      setUpahModalOpen(false);
      resetUpahForm();
      alert('Pengajuan upah berhasil dikirim ke finance.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleSelectTukang = (key: string, tukangId: number | '') => {
    const selected = tukangList.find((t) => t.id === Number(tukangId));
    setUpahBaris((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              tukangId,
              nik: selected?.nik ?? row.nik,
              nama: selected?.nama ?? row.nama,
            }
          : row,
      ),
    );
  };

  const rowHasBukti = (row: SpkPembayaranData) =>
    !!row.buktiPembayaran || (row.buktiPembayaranList?.length ?? 0) > 0;

  const canEditKasbonRow = (row: SpkPembayaranData) =>
    canEditKasbon && !rowHasBukti(row) && row.status !== 'SUDAH_DIBAYAR';

  const canEditUpahRow = (row: SpkPembayaranData) => canEditKasbonRow(row);

  const canDeletePenguranganRow = (row: SpkPembayaranData) => canEditKasbonRow(row);

  const handleHapusPengurangan = async (
    row: SpkPembayaranData,
    label: 'kasbon' | 'upah',
  ) => {
    if (
      !window.confirm(
        `Hapus pengajuan ${label} ${formatRupiah(row.nominal)}?\nHanya dapat dihapus jika belum terbayar dan belum ada bukti transfer.`,
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id: row.id, spkId: spk.id });
      alert(`Pengajuan ${label} berhasil dihapus.`);
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const openEditKasbon = (row: SpkPembayaranData) => {
    setEditingKasbon(row);
    const batch = isBatchKasbon(row);
    setEditingKasbonIsBatch(batch);
    if (batch) {
      const rows = kasbonBarisFromPembayaran(row);
      setKasbonBarisForm(rows.length ? rows : [newKasbonBaris()]);
    } else {
      setKasbonLegacyKeterangan(row.keterangan ?? '');
      setKasbonLegacyNominal(row.nominal);
      setKasbonLegacyTanggalPo(toDateInputValue(row.tanggalPo ?? row.createdAt));
    }
    setKasbonEditModalOpen(true);
  };

  const closeEditKasbonModal = () => {
    setKasbonEditModalOpen(false);
    setEditingKasbon(null);
    setEditingKasbonIsBatch(false);
  };

  const openEditUpah = (row: SpkPembayaranData) => {
    setEditingUpah(row);
    setUpahTanggalDari(toDateInputValue(row.tanggalDari ?? row.createdAt));
    setUpahTanggalSampai(toDateInputValue(row.tanggalSampai ?? row.createdAt));
    const rows = upahBarisFromPembayaran(row);
    setUpahBaris(rows.length ? rows : [newUpahBaris()]);
    setUpahEditModalOpen(true);
  };

  const closeEditUpahModal = () => {
    setUpahEditModalOpen(false);
    setEditingUpah(null);
  };

  const handleSimpanEditUpah = async () => {
    if (!editingUpah) return;
    const baris = parseUpahBarisBody(upahBaris);
    if (!upahTanggalDari || !upahTanggalSampai) {
      alert('Periode tanggal wajib diisi.');
      return;
    }
    if (upahTanggalDari > upahTanggalSampai) {
      alert('Tanggal dari tidak boleh setelah tanggal sampai.');
      return;
    }
    if (!baris) {
      alert('Setiap baris tukang wajib memiliki NIK, nama, dan nominal lebih dari 0.');
      return;
    }
    const total = baris.reduce((sum, b) => sum + b.nominal, 0);
    if (editingUpah.mengurangiTermin) {
      const plafon = validatePengurangTerminNominal(
        spk.nilaiKontrak,
        pengurangRows,
        editingUpah.mengurangiTermin,
        total,
        editingUpah.id,
      );
      if (!plafon.allowed) {
        alert(plafon.reason);
        return;
      }
    }
    if (
      !window.confirm(
        `Simpan perubahan upah?\nPeriode: ${upahTanggalDari} s/d ${upahTanggalSampai}\nTotal: ${formatRupiah(total)} (${baris.length} tukang)`,
      )
    ) {
      return;
    }
    try {
      await updateUpahMutation.mutateAsync({
        id: editingUpah.id,
        body: {
          tanggalDari: upahTanggalDari,
          tanggalSampai: upahTanggalSampai,
          baris,
        },
      });
      closeEditUpahModal();
      alert('Data upah berhasil diperbarui.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const handleSimpanEditKasbon = async () => {
    if (!editingKasbon) return;

    if (editingKasbonIsBatch) {
      const baris = parseKasbonBarisBody(kasbonBarisForm);
      if (!baris) {
        alert('Setiap baris kasbon wajib memiliki tanggal PO, keterangan, dan nominal lebih dari 0.');
        return;
      }
      const total = baris.reduce((sum, b) => sum + b.nominal, 0);
      if (editingKasbon.mengurangiTermin) {
        const plafon = validatePengurangTerminNominal(
          spk.nilaiKontrak,
          pengurangRows,
          editingKasbon.mengurangiTermin,
          total,
          editingKasbon.id,
        );
        if (!plafon.allowed) {
          alert(plafon.reason);
          return;
        }
      }
      if (
        !window.confirm(
          `Simpan perubahan kasbon?\nTotal: ${formatRupiah(total)} (${baris.length} item)`,
        )
      ) {
        return;
      }
      try {
        await updateKasbonMutation.mutateAsync({
          id: editingKasbon.id,
          body: { kasbonBaris: baris },
        });
        closeEditKasbonModal();
        alert('Data kasbon berhasil diperbarui.');
      } catch (err: unknown) {
        alert(handleApiError(err).message);
      }
      return;
    }

    const nominal =
      kasbonLegacyNominal === '' ? 0 : Number(kasbonLegacyNominal);
    if (!kasbonLegacyKeterangan.trim()) {
      alert('Keterangan kasbon wajib diisi.');
      return;
    }
    if (!nominal || nominal <= 0) {
      alert('Nominal kasbon harus lebih dari 0.');
      return;
    }
    if (!kasbonLegacyTanggalPo) {
      alert('Tanggal PO wajib diisi.');
      return;
    }
    if (editingKasbon.mengurangiTermin) {
      const plafon = validatePengurangTerminNominal(
        spk.nilaiKontrak,
        pengurangRows,
        editingKasbon.mengurangiTermin,
        nominal,
        editingKasbon.id,
      );
      if (!plafon.allowed) {
        alert(plafon.reason);
        return;
      }
    }
    if (
      !window.confirm(
        `Simpan perubahan kasbon?\nKeterangan: ${kasbonLegacyKeterangan.trim()}\nTanggal PO: ${kasbonLegacyTanggalPo}\nNominal: ${formatRupiah(nominal)}`,
      )
    ) {
      return;
    }
    try {
      await updateKasbonMutation.mutateAsync({
        id: editingKasbon.id,
        body: {
          keterangan: kasbonLegacyKeterangan.trim(),
          nominal,
          tanggalPo: kasbonLegacyTanggalPo,
        },
      });
      closeEditKasbonModal();
      alert('Data kasbon berhasil diperbarui.');
    } catch (err: unknown) {
      alert(handleApiError(err).message);
    }
  };

  const renderStatus = (
    existing: SpkPembayaranData | undefined,
    jenis: SpkTerminPembayaranJenis,
  ) => {
    if (existing) {
      const paid = existing.status === 'SUDAH_DIBAYAR';
      return (
        <span
          className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
            paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {paid ? 'Terbayar' : 'Menunggu'}
        </span>
      );
    }
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows);
    if (!canAjukan) {
      return <span className="text-slate-400 text-[10px]">Belum diajukan</span>;
    }
    if (!check.allowed) {
      return (
        <span className="text-[10px] text-amber-700" title={check.reason}>
          Belum bisa
        </span>
      );
    }
    return <span className="text-[10px] text-slate-500">Siap diajukan</span>;
  };

  const renderTerminAksi = (
    existing: SpkPembayaranData | undefined,
    jenis: SpkTerminPembayaranJenis,
  ) => {
    if (existing || !canAjukan) return null;
    const check = canRequestSpkPembayaran(jenis, spkInput, statusRows);
    return (
      <div className="flex flex-col items-start gap-0.5">
        <button
          type="button"
          disabled={!check.allowed || createMutation.isPending}
          title={check.reason}
          onClick={() => handleAjukanTermin(jenis)}
          className="px-2.5 py-1 text-[10px] font-bold rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 whitespace-nowrap"
        >
          Ajukan
        </button>
        {!check.allowed && check.reason && (
          <span className="text-[9px] text-amber-700 max-w-[140px] leading-tight">{check.reason}</span>
        )}
      </div>
    );
  };

  const renderJenisBadge = (jenis: SpkPembayaranJenis, extra?: string) => (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${JENIS_UI_COLOR[jenis].badge}`}
    >
      {jenis === 'KASBON'
        ? 'Kasbon'
        : jenis === 'UPAH'
          ? 'Upah'
          : SPK_PEMBAYARAN_JENIS_LABEL[jenis].split('(')[0]?.trim()}
      {extra ? ` · ${extra}` : ''}
    </span>
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        Memuat pembayaran...
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Termin &amp; Retensi
        </p>
        {canAjukan && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={!pengurangCheck.allowed || createMutation.isPending}
              title={pengurangCheck.reason}
              onClick={() => {
                resetKasbonForm();
                setKasbonModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40"
            >
              <Plus size={12} />
              Ajukan Kasbon
            </button>
            <button
              type="button"
              disabled={!pengurangCheck.allowed || createMutation.isPending}
              title={pengurangCheck.reason}
              onClick={() => {
                resetUpahForm();
                setUpahModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40"
            >
              <Plus size={12} />
              Ajukan Upah
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 mb-3">
        <table className="w-full text-xs border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className={thClass}>Jenis</th>
              <th className={thClass}>Nominal</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} w-16`}>Bukti</th>
              <th className={`${thClass} w-24`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {TERMIN_JENIS_ORDER.map((jenis) => {
              const existing = pembayaranList.find((p) => p.jenis === jenis);
              const nominal = calcSpkPembayaranNominal(jenis, spkInput, calcRows);
              const colors = JENIS_UI_COLOR[jenis];
              return (
                <tr key={jenis} className={`hover:bg-slate-50/80 ${colors.row}`}>
                  <td className={tdClass}>
                    {renderJenisBadge(jenis)}
                  </td>
                  <td className={tdClass}>
                    <p className={`font-bold whitespace-nowrap ${colors.text}`}>
                      {formatRupiah(existing?.nominal ?? nominal)}
                    </p>
                    <KalkulasiSingkat jenis={jenis} spk={spk} pembayaranList={pembayaranList} />
                  </td>
                  <td className={tdClass}>{renderStatus(existing, jenis)}</td>
                  <td className={tdClass}>
                    {existing?.buktiPembayaran ? (
                      <BuktiFileThumbnail
                        url={existing.buktiPembayaran}
                        onClick={() => setPreviewUrl(existing.buktiPembayaran!)}
                        className="w-10 h-7"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className={tdClass}>{renderTerminAksi(existing, jenis)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {kasbonItems.length > 0 && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Kasbon ({kasbonItems.length})
          </p>
          <div className="overflow-x-auto rounded-lg border border-orange-200">
            <table className="w-full text-xs border-collapse min-w-[720px]">
              <thead>
                <tr>
                  <th className={thClass}>Keterangan</th>
                  <th className={thClass}>Tanggal PO</th>
                  <th className={thClass}>Mengurangi</th>
                  <th className={thClass}>Nominal</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} w-16`}>Bukti</th>
                  {canEditKasbon && <th className={`${thClass} w-20`}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {kasbonItems.map((row) => {
                  const paid = row.status === 'SUDAH_DIBAYAR';
                  const editable = canEditKasbonRow(row);
                  const deletable = canDeletePenguranganRow(row);
                  const batch = isBatchKasbon(row);
                  const buktiCount =
                    (row.buktiPembayaranList?.length ?? 0) || (row.buktiPembayaran ? 1 : 0);
                  return (
                    <tr key={row.id} className={JENIS_UI_COLOR.KASBON.row}>
                      <td className={`${tdClass} max-w-[280px]`}>
                        {batch ? (
                          <ul className="space-y-0.5">
                            {(row.kasbonBaris ?? []).map((b) => (
                              <li key={b.id} className="text-[10px] leading-tight">
                                <span className="font-semibold text-slate-800">{b.keterangan}</span>
                                <span className="text-slate-500">
                                  {' '}
                                  · PO {formatDate(b.tanggalPo)} ·{' '}
                                </span>
                                <span className="font-bold text-orange-800">
                                  {formatRupiah(b.nominal)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="font-medium text-slate-800">{row.keterangan}</span>
                        )}
                        {buktiCount > 0 && paid && batch && (
                          <p className="text-[9px] text-slate-500 mt-1">
                            {buktiCount} bukti transfer (gabungan)
                          </p>
                        )}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-slate-600`}>
                        {batch
                          ? `${row.kasbonBaris!.length} item`
                          : formatDate(row.tanggalPo ?? row.createdAt)}
                      </td>
                      <td className={tdClass}>
                        {row.mengurangiTermin
                          ? SPK_KASBON_TARGET_LABEL[row.mengurangiTermin]
                          : '—'}
                      </td>
                      <td className={`${tdClass} font-bold ${JENIS_UI_COLOR.KASBON.text}`}>
                        {formatRupiah(row.nominal)}
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {paid ? 'Terbayar' : 'Menunggu'}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {row.buktiPembayaran ? (
                          <BuktiFileThumbnail
                            url={row.buktiPembayaran}
                            onClick={() => setPreviewUrl(row.buktiPembayaran!)}
                            className="w-10 h-7"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      {canEditKasbon && (
                        <td className={tdClass}>
                          {editable || deletable ? (
                            <div className="flex items-center gap-0.5">
                              {editable && (
                                <button
                                  type="button"
                                  title="Edit kasbon"
                                  onClick={() => openEditKasbon(row)}
                                  className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {deletable && (
                                <button
                                  type="button"
                                  title="Hapus kasbon"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => handleHapusPengurangan(row, 'kasbon')}
                                  className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {upahItems.length > 0 && (
        <>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 mt-3">
            Upah Tukang ({upahItems.length})
          </p>
          <div className="overflow-x-auto rounded-lg border border-teal-200">
            <table className="w-full text-xs border-collapse min-w-[860px]">
              <thead>
                <tr>
                  <th className={thClass}>Periode</th>
                  <th className={thClass}>Tukang</th>
                  <th className={thClass}>Mengurangi</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} w-16`}>Bukti</th>
                  {canEditKasbon && <th className={`${thClass} w-20`}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {upahItems.map((row) => {
                  const paid = row.status === 'SUDAH_DIBAYAR';
                  const editable = canEditUpahRow(row);
                  const deletable = canDeletePenguranganRow(row);
                  const buktiCount =
                    (row.buktiPembayaranList?.length ?? 0) || (row.buktiPembayaran ? 1 : 0);
                  return (
                    <tr key={row.id} className={JENIS_UI_COLOR.UPAH.row}>
                      <td className={`${tdClass} whitespace-nowrap text-slate-600`}>
                        {formatDate(row.tanggalDari ?? row.createdAt)} –{' '}
                        {formatDate(row.tanggalSampai ?? row.createdAt)}
                      </td>
                      <td className={`${tdClass} max-w-[280px]`}>
                        <ul className="space-y-0.5">
                          {(row.upahBaris ?? []).map((b) => (
                            <li key={b.id} className="text-[10px] leading-tight">
                              <span className="font-semibold text-slate-800">{b.nama}</span>
                              <span className="text-slate-500"> · {b.nik} · </span>
                              <span className="font-bold text-teal-800">{formatRupiah(b.nominal)}</span>
                            </li>
                          ))}
                        </ul>
                        {buktiCount > 0 && paid && (
                          <p className="text-[9px] text-slate-500 mt-1">
                            {buktiCount} bukti transfer (gabungan)
                          </p>
                        )}
                      </td>
                      <td className={tdClass}>
                        {row.mengurangiTermin
                          ? SPK_KASBON_TARGET_LABEL[row.mengurangiTermin]
                          : '—'}
                      </td>
                      <td className={`${tdClass} font-bold ${JENIS_UI_COLOR.UPAH.text}`}>
                        {formatRupiah(row.nominal)}
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {paid ? 'Terbayar' : 'Menunggu'}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {row.buktiPembayaran ? (
                          <BuktiFileThumbnail
                            url={row.buktiPembayaran}
                            onClick={() => setPreviewUrl(row.buktiPembayaran!)}
                            className="w-10 h-7"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      {canEditKasbon && (
                        <td className={tdClass}>
                          {editable || deletable ? (
                            <div className="flex items-center gap-0.5">
                              {editable && (
                                <button
                                  type="button"
                                  title="Edit upah"
                                  onClick={() => openEditUpah(row)}
                                  className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {deletable && (
                                <button
                                  type="button"
                                  title="Hapus upah"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => handleHapusPengurangan(row, 'upah')}
                                  className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pengurangCheck.targetTermin && canAjukan && (
        <p className="text-[10px] text-slate-500 mt-2">
          Kasbon/upah berikutnya akan mengurangi{' '}
          <span className="font-semibold text-orange-700">
            {SPK_KASBON_TARGET_LABEL[pengurangCheck.targetTermin]}
          </span>
          {pengurangCheck.sisaPengurang != null && (
            <>
              {' '}
              · Sisa plafon:{' '}
              <span className="font-semibold text-slate-700">
                {formatRupiah(pengurangCheck.sisaPengurang)}
              </span>
            </>
          )}
          .
        </p>
      )}

      <Modal
        isOpen={kasbonModalOpen}
        onClose={() => setKasbonModalOpen(false)}
        title="Ajukan Kasbon"
        size="lg"
      >
        <div className="space-y-4">
          {pengurangCheck.targetTermin && (
            <>
              <p className="text-xs text-orange-800 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                Total kasbon akan mengurangi nominal{' '}
                <strong>{SPK_KASBON_TARGET_LABEL[pengurangCheck.targetTermin]}</strong> (FIFO).
                Finance dapat mengunggah 1– beberapa bukti transfer untuk seluruh item.
              </p>
              <PengurangPlafonBanner
                nilaiKontrak={spk.nilaiKontrak}
                rows={pengurangRows}
                termin={pengurangCheck.targetTermin}
                additionalNominal={kasbonTotalPreview}
              />
            </>
          )}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className={thClass}>Tanggal PO</th>
                  <th className={thClass}>Keterangan</th>
                  <th className={thClass}>Nominal</th>
                  <th className={`${thClass} w-10`} />
                </tr>
              </thead>
              <tbody>
                {kasbonBarisForm.map((row) => (
                  <tr key={row.key}>
                    <td className={tdClass}>
                      <input
                        type="date"
                        value={row.tanggalPo}
                        onChange={(e) =>
                          setKasbonBarisForm((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, tanggalPo: e.target.value } : r,
                            ),
                          )
                        }
                        className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={row.keterangan}
                        onChange={(e) =>
                          setKasbonBarisForm((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, keterangan: e.target.value } : r,
                            ),
                          )
                        }
                        className="w-full min-w-[160px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                        placeholder="Contoh: Material bata"
                      />
                    </td>
                    <td className={tdClass}>
                      <CurrencyInput
                        compact
                        name={`kasbon-nominal-${row.key}`}
                        value={row.nominal === '' ? 0 : row.nominal}
                        onValueChange={(_, value) => handleKasbonNominalChange(row.key, value)}
                        placeholder="0"
                      />
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        disabled={kasbonBarisForm.length <= 1}
                        onClick={() =>
                          setKasbonBarisForm((prev) => prev.filter((r) => r.key !== row.key))
                        }
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                        title="Hapus baris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => setKasbonBarisForm((prev) => [...prev, newKasbonBaris()])}
            className="text-xs font-bold text-orange-700 hover:underline"
          >
            + Tambah kasbon
          </button>
          <p className="text-sm font-bold text-orange-800">
            Total diajukan: {formatRupiah(kasbonTotalPreview)}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setKasbonModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={createMutation.isPending || kasbonCreateOverPlafon}
              onClick={handleAjukanKasbon}
              title={
                kasbonCreateOverPlafon
                  ? 'Total kasbon melebihi sisa plafon termin'
                  : undefined
              }
              className="px-4 py-2 text-sm font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Ajukan ke Finance
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={kasbonEditModalOpen}
        onClose={closeEditKasbonModal}
        title={editingKasbonIsBatch ? 'Edit Kasbon (batch)' : 'Edit Kasbon'}
        size={editingKasbonIsBatch ? 'lg' : 'md'}
      >
        <div className="space-y-4">
          {editingKasbon?.mengurangiTermin && (
            <>
              <p className="text-xs text-orange-800 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                Kasbon ini mengurangi nominal{' '}
                <strong>{SPK_KASBON_TARGET_LABEL[editingKasbon.mengurangiTermin]}</strong>.
                Mengurangi termin tidak dapat diubah dari sini.
              </p>
              <PengurangPlafonBanner
                nilaiKontrak={spk.nilaiKontrak}
                rows={pengurangRows}
                termin={editingKasbon.mengurangiTermin}
                additionalNominal={
                  editingKasbonIsBatch ? kasbonTotalPreview : kasbonLegacyEditTotal
                }
                excludeId={editingKasbon.id}
              />
            </>
          )}
          {editingKasbonIsBatch ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr>
                      <th className={thClass}>Tanggal PO</th>
                      <th className={thClass}>Keterangan</th>
                      <th className={thClass}>Nominal</th>
                      <th className={`${thClass} w-10`} />
                    </tr>
                  </thead>
                  <tbody>
                    {kasbonBarisForm.map((row) => (
                      <tr key={row.key}>
                        <td className={tdClass}>
                          <input
                            type="date"
                            value={row.tanggalPo}
                            onChange={(e) =>
                              setKasbonBarisForm((prev) =>
                                prev.map((r) =>
                                  r.key === row.key ? { ...r, tanggalPo: e.target.value } : r,
                                ),
                              )
                            }
                            className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                          />
                        </td>
                        <td className={tdClass}>
                          <input
                            type="text"
                            value={row.keterangan}
                            onChange={(e) =>
                              setKasbonBarisForm((prev) =>
                                prev.map((r) =>
                                  r.key === row.key ? { ...r, keterangan: e.target.value } : r,
                                ),
                              )
                            }
                            className="w-full min-w-[160px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                          />
                        </td>
                        <td className={tdClass}>
                          <CurrencyInput
                            compact
                            name={`kasbon-edit-nominal-${row.key}`}
                            value={row.nominal === '' ? 0 : row.nominal}
                            onValueChange={(_, value) =>
                              handleKasbonNominalChange(row.key, value)
                            }
                            placeholder="0"
                          />
                        </td>
                        <td className={tdClass}>
                          <button
                            type="button"
                            disabled={kasbonBarisForm.length <= 1}
                            onClick={() =>
                              setKasbonBarisForm((prev) =>
                                prev.filter((r) => r.key !== row.key),
                              )
                            }
                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => setKasbonBarisForm((prev) => [...prev, newKasbonBaris()])}
                className="text-xs font-bold text-orange-700 hover:underline"
              >
                + Tambah kasbon
              </button>
              <p className="text-sm font-bold text-orange-800">
                Total: {formatRupiah(kasbonTotalPreview)}
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal PO</label>
                <input
                  type="date"
                  value={kasbonLegacyTanggalPo}
                  onChange={(e) => setKasbonLegacyTanggalPo(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keterangan</label>
                <textarea
                  value={kasbonLegacyKeterangan}
                  onChange={(e) => setKasbonLegacyKeterangan(e.target.value)}
                  className="text-black mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[72px]"
                />
              </div>
              <div>
                <CurrencyInput
                  label="Nominal"
                  name="kasbonLegacyNominal"
                  value={kasbonLegacyNominal === '' ? 0 : kasbonLegacyNominal}
                  onValueChange={(_, value) =>
                    setKasbonLegacyNominal(value > 0 ? value : '')
                  }
                  placeholder="0"
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeEditKasbonModal}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={updateKasbonMutation.isPending || kasbonEditOverPlafon}
              onClick={handleSimpanEditKasbon}
              title={
                kasbonEditOverPlafon
                  ? 'Total kasbon melebihi sisa plafon termin'
                  : undefined
              }
              className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={upahModalOpen}
        onClose={() => setUpahModalOpen(false)}
        title="Ajukan Upah Tukang"
        size="lg"
      >
        <div className="space-y-4">
          {pengurangCheck.targetTermin && (
            <>
              <p className="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                Total upah akan mengurangi nominal{' '}
                <strong>{SPK_KASBON_TARGET_LABEL[pengurangCheck.targetTermin]}</strong> (FIFO).
                Finance dapat mengunggah 1– beberapa bukti transfer untuk seluruh tukang.
              </p>
              <PengurangPlafonBanner
                nilaiKontrak={spk.nilaiKontrak}
                rows={pengurangRows}
                termin={pengurangCheck.targetTermin}
                additionalNominal={upahTotalPreview}
              />
            </>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Dari tanggal</label>
              <input
                type="date"
                value={upahTanggalDari}
                onChange={(e) => setUpahTanggalDari(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sampai tanggal</label>
              <input
                type="date"
                value={upahTanggalSampai}
                onChange={(e) => setUpahTanggalSampai(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs border-collapse min-w-[520px]">
              <thead>
                <tr>
                  <th className={thClass}>Pilih tukang</th>
                  <th className={thClass}>NIK</th>
                  <th className={thClass}>Nama</th>
                  <th className={thClass}>Nominal</th>
                  <th className={`${thClass} w-10`} />
                </tr>
              </thead>
              <tbody>
                {upahBaris.map((row) => (
                  <tr key={row.key}>
                    <td className={tdClass}>
                      <select
                        value={row.tukangId === '' ? '' : String(row.tukangId)}
                        onChange={(e) =>
                          handleSelectTukang(
                            row.key,
                            e.target.value ? Number(e.target.value) : '',
                          )
                        }
                        className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                      >
                        <option value="">Input manual</option>
                        {tukangList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nik} — {t.nama}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={row.nik}
                        onChange={(e) =>
                          setUpahBaris((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, nik: e.target.value, tukangId: '' } : r,
                            ),
                          )
                        }
                        className="w-full min-w-[100px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                        placeholder="NIK"
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={row.nama}
                        onChange={(e) =>
                          setUpahBaris((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, nama: e.target.value } : r,
                            ),
                          )
                        }
                        className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                        placeholder="Nama"
                      />
                    </td>
                    <td className={tdClass}>
                      <CurrencyInput
                        compact
                        name={`upah-nominal-${row.key}`}
                        value={row.nominal === '' ? 0 : row.nominal}
                        onValueChange={(_, value) => handleUpahNominalChange(row.key, value)}
                        placeholder="0"
                      />
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        disabled={upahBaris.length <= 1}
                        onClick={() =>
                          setUpahBaris((prev) => prev.filter((r) => r.key !== row.key))
                        }
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                        title="Hapus baris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => setUpahBaris((prev) => [...prev, newUpahBaris()])}
            className="text-xs font-bold text-teal-700 hover:underline"
          >
            + Tambah tukang
          </button>
          <p className="text-sm font-bold text-teal-800">
            Total diajukan: {formatRupiah(upahTotalPreview)}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setUpahModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={createMutation.isPending || upahCreateOverPlafon}
              onClick={handleAjukanUpah}
              title={
                upahCreateOverPlafon ? 'Total upah melebihi sisa plafon termin' : undefined
              }
              className="px-4 py-2 text-sm font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              Ajukan ke Finance
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={upahEditModalOpen}
        onClose={closeEditUpahModal}
        title="Edit Upah Tukang"
        size="lg"
      >
        <div className="space-y-4">
          {editingUpah?.mengurangiTermin && (
            <>
              <p className="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                Upah ini mengurangi nominal{' '}
                <strong>{SPK_KASBON_TARGET_LABEL[editingUpah.mengurangiTermin]}</strong>.
              </p>
              <PengurangPlafonBanner
                nilaiKontrak={spk.nilaiKontrak}
                rows={pengurangRows}
                termin={editingUpah.mengurangiTermin}
                additionalNominal={upahTotalPreview}
                excludeId={editingUpah.id}
              />
            </>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Dari tanggal</label>
              <input
                type="date"
                value={upahTanggalDari}
                onChange={(e) => setUpahTanggalDari(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sampai tanggal</label>
              <input
                type="date"
                value={upahTanggalSampai}
                onChange={(e) => setUpahTanggalSampai(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-black"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs border-collapse min-w-[520px]">
              <thead>
                <tr>
                  <th className={thClass}>Pilih tukang</th>
                  <th className={thClass}>NIK</th>
                  <th className={thClass}>Nama</th>
                  <th className={thClass}>Nominal</th>
                  <th className={`${thClass} w-10`} />
                </tr>
              </thead>
              <tbody>
                {upahBaris.map((row) => (
                  <tr key={row.key}>
                    <td className={tdClass}>
                      <select
                        value={row.tukangId === '' ? '' : String(row.tukangId)}
                        onChange={(e) =>
                          handleSelectTukang(
                            row.key,
                            e.target.value ? Number(e.target.value) : '',
                          )
                        }
                        className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                      >
                        <option value="">Input manual</option>
                        {tukangList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nik} — {t.nama}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={row.nik}
                        onChange={(e) =>
                          setUpahBaris((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, nik: e.target.value, tukangId: '' } : r,
                            ),
                          )
                        }
                        className="w-full min-w-[100px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={row.nama}
                        onChange={(e) =>
                          setUpahBaris((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, nama: e.target.value } : r,
                            ),
                          )
                        }
                        className="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded text-xs text-black"
                      />
                    </td>
                    <td className={tdClass}>
                      <CurrencyInput
                        compact
                        name={`upah-edit-nominal-${row.key}`}
                        value={row.nominal === '' ? 0 : row.nominal}
                        onValueChange={(_, value) => handleUpahNominalChange(row.key, value)}
                        placeholder="0"
                      />
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        disabled={upahBaris.length <= 1}
                        onClick={() =>
                          setUpahBaris((prev) => prev.filter((r) => r.key !== row.key))
                        }
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => setUpahBaris((prev) => [...prev, newUpahBaris()])}
            className="text-xs font-bold text-teal-700 hover:underline"
          >
            + Tambah tukang
          </button>
          <p className="text-sm font-bold text-teal-800">
            Total: {formatRupiah(upahTotalPreview)}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeEditUpahModal}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={updateUpahMutation.isPending || upahEditOverPlafon}
              onClick={handleSimpanEditUpah}
              title={
                upahEditOverPlafon ? 'Total upah melebihi sisa plafon termin' : undefined
              }
              className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Bukti Pembayaran"
        size="lg"
      >
        {previewUrl && (
          <div className="flex justify-center">
            {isBuktiPdfUrl(previewUrl) ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 text-red-600 font-bold"
              >
                <FileText size={48} />
                Buka PDF
              </a>
            ) : (
              <img src={previewUrl} alt="Bukti pembayaran" className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default SpkPembayaranPanel;
