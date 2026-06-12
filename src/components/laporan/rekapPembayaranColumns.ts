import type {
  RekapPembayaranBucket,
  RekapPembayaranReportItem,
} from '../../services/report.service';

export type RekapColumnDef = {
  key: string;
  label: string;
  getValue: (item: RekapPembayaranReportItem) => RekapPembayaranBucket;
};

export type RekapColumnGroup = {
  key: string;
  label: string;
  headerClassName: string;
  columns: RekapColumnDef[];
};

export const REKAP_PEMBAYARAN_COLUMN_GROUPS: RekapColumnGroup[] = [
  {
    key: 'pemasukan',
    label: 'Pemasukan Penjualan Kavling',
    headerClassName: 'bg-emerald-50/90 text-emerald-800',
    columns: [
      { key: 'booking', label: 'Booking', getValue: (i) => i.pemasukan.booking },
      { key: 'dp', label: 'DP', getValue: (i) => i.pemasukan.dp },
      {
        key: 'cicilanCashBertahap',
        label: 'Cicilan Cash Bertahap',
        getValue: (i) => i.pemasukan.cicilanCashBertahap,
      },
      {
        key: 'cicilanPencairanKpr',
        label: 'Cicilan Pencairan KPR',
        getValue: (i) => i.pemasukan.cicilanPencairanKpr,
      },
    ],
  },
  {
    key: 'notaris',
    label: 'Pengeluaran Notaris',
    headerClassName: 'bg-amber-50/90 text-amber-900',
    columns: [
      {
        key: 'biayaNotaris',
        label: 'Biaya Notaris',
        getValue: (i) => i.pengeluaranNotaris.biayaNotaris,
      },
      { key: 'bphtb', label: 'BPHTB', getValue: (i) => i.pengeluaranNotaris.bphtb },
      { key: 'pph', label: 'PPh', getValue: (i) => i.pengeluaranNotaris.pph },
    ],
  },
  {
    key: 'bank',
    label: 'Pengeluaran ke Bank',
    headerClassName: 'bg-blue-50/90 text-blue-900',
    columns: [
      { key: 'biayaKpr', label: 'Biaya KPR', getValue: (i) => i.pengeluaranBank.biayaKpr },
      {
        key: 'biayaAppraisal',
        label: 'Biaya Appraisal',
        getValue: (i) => i.pengeluaranBank.biayaAppraisal,
      },
    ],
  },
  {
    key: 'proyek',
    label: 'Pengeluaran Proyek',
    headerClassName: 'bg-violet-50/90 text-violet-900',
    columns: [
      { key: 'material', label: 'Material', getValue: (i) => i.pengeluaranProyek.material },
      { key: 'upah', label: 'Upah', getValue: (i) => i.pengeluaranProyek.upah },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    headerClassName: 'bg-rose-50/90 text-rose-900',
    columns: [
      {
        key: 'marketingFee',
        label: 'Marketing Fee',
        getValue: (i) => i.marketing.marketingFee,
      },
      {
        key: 'closingFee',
        label: 'Closing Fee',
        getValue: (i) => i.marketing.closingFee,
      },
      {
        key: 'netSetelahPotonganPph',
        label: 'Marketing + Closing − Pot. PPh',
        getValue: (i) => i.marketing.netSetelahPotonganPph,
      },
      {
        key: 'potonganPph',
        label: 'Potongan PPh',
        getValue: (i) => i.marketing.potonganPph,
      },
    ],
  },
];

export const REKAP_PEMBAYARAN_DATA_COLUMNS = REKAP_PEMBAYARAN_COLUMN_GROUPS.flatMap(
  (group) => group.columns,
);
