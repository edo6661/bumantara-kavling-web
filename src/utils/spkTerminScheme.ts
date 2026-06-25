import type { SpkJenis } from '../services/spk.service';

export type SpkTerminPembayaranJenis =
  | 'TERMIN_55'
  | 'TERMIN_100'
  | 'TERMIN_INFRA_20_1'
  | 'TERMIN_INFRA_20_2'
  | 'TERMIN_INFRA_20_3'
  | 'TERMIN_INFRA_20_4'
  | 'TERMIN_INFRA_15'
  | 'RETENSI';

export type SpkKasbonTargetTermin = Exclude<SpkTerminPembayaranJenis, 'RETENSI'>;

export interface SpkTerminStepConfig {
  jenis: SpkTerminPembayaranJenis;
  minProgress: number;
  kontrakFraction: number;
  label: string;
  shortLabel: string;
  kasbonTargetLabel: string;
}

export const SPK_TERMIN_SCHEME_RUMAH: SpkTerminStepConfig[] = [
  {
    jenis: 'TERMIN_55',
    minProgress: 55,
    kontrakFraction: 0.5,
    label: 'Termin 55% (50% kontrak)',
    shortLabel: '55%',
    kasbonTargetLabel: 'Termin 55%',
  },
  {
    jenis: 'TERMIN_100',
    minProgress: 100,
    kontrakFraction: 0.45,
    label: 'Termin 100% (45% kontrak)',
    shortLabel: '100%',
    kasbonTargetLabel: 'Termin 100%',
  },
  {
    jenis: 'RETENSI',
    minProgress: 100,
    kontrakFraction: 0.05,
    label: 'Retensi (5% kontrak)',
    shortLabel: 'Ret.',
    kasbonTargetLabel: '',
  },
];

export const SPK_TERMIN_SCHEME_INFRA: SpkTerminStepConfig[] = [
  {
    jenis: 'TERMIN_INFRA_20_1',
    minProgress: 20,
    kontrakFraction: 0.2,
    label: 'Termin 20% (progress ≥ 20%)',
    shortLabel: '20%·1',
    kasbonTargetLabel: 'Termin 20% (1)',
  },
  {
    jenis: 'TERMIN_INFRA_20_2',
    minProgress: 40,
    kontrakFraction: 0.2,
    label: 'Termin 20% (progress ≥ 40%)',
    shortLabel: '20%·2',
    kasbonTargetLabel: 'Termin 20% (2)',
  },
  {
    jenis: 'TERMIN_INFRA_20_3',
    minProgress: 60,
    kontrakFraction: 0.2,
    label: 'Termin 20% (progress ≥ 60%)',
    shortLabel: '20%·3',
    kasbonTargetLabel: 'Termin 20% (3)',
  },
  {
    jenis: 'TERMIN_INFRA_20_4',
    minProgress: 80,
    kontrakFraction: 0.2,
    label: 'Termin 20% (progress ≥ 80%)',
    shortLabel: '20%·4',
    kasbonTargetLabel: 'Termin 20% (4)',
  },
  {
    jenis: 'TERMIN_INFRA_15',
    minProgress: 100,
    kontrakFraction: 0.15,
    label: 'Termin 15% (progress 100%)',
    shortLabel: '15%',
    kasbonTargetLabel: 'Termin 15%',
  },
  {
    jenis: 'RETENSI',
    minProgress: 100,
    kontrakFraction: 0.05,
    label: 'Retensi (5% kontrak)',
    shortLabel: 'Ret.',
    kasbonTargetLabel: '',
  },
];

export function getSpkTerminScheme(spkJenis: SpkJenis = 'RUMAH'): SpkTerminStepConfig[] {
  return spkJenis === 'INFRASTRUKTUR'
    ? SPK_TERMIN_SCHEME_INFRA
    : SPK_TERMIN_SCHEME_RUMAH;
}

export function getSpkTerminJenisOrder(spkJenis: SpkJenis = 'RUMAH'): SpkTerminPembayaranJenis[] {
  return getSpkTerminScheme(spkJenis).map((step) => step.jenis);
}

export function getKasbonTargetSteps(
  scheme: SpkTerminStepConfig[],
): Array<SpkTerminStepConfig & { jenis: SpkKasbonTargetTermin }> {
  return scheme.filter(
    (step): step is SpkTerminStepConfig & { jenis: SpkKasbonTargetTermin } =>
      step.jenis !== 'RETENSI',
  );
}

export function getTerminStep(
  scheme: SpkTerminStepConfig[],
  jenis: SpkTerminPembayaranJenis,
): SpkTerminStepConfig | undefined {
  return scheme.find((step) => step.jenis === jenis);
}

export function getPrerequisiteTerminJenis(
  scheme: SpkTerminStepConfig[],
  jenis: SpkTerminPembayaranJenis,
): SpkTerminPembayaranJenis | null {
  const index = scheme.findIndex((step) => step.jenis === jenis);
  if (index <= 0) return null;
  return scheme[index - 1]!.jenis;
}

export function buildSpkPembayaranJenisLabel(
  spkJenis: SpkJenis = 'RUMAH',
): Record<SpkTerminPembayaranJenis | 'KASBON' | 'UPAH', string> {
  const labels = {
    KASBON: 'Kasbon',
    UPAH: 'Upah tukang',
  } as Record<SpkTerminPembayaranJenis | 'KASBON' | 'UPAH', string>;

  for (const step of getSpkTerminScheme(spkJenis)) {
    labels[step.jenis] = step.label;
  }

  return labels;
}

export function buildSpkKasbonTargetLabel(
  spkJenis: SpkJenis = 'RUMAH',
): Record<SpkKasbonTargetTermin, string> {
  const labels = {} as Record<SpkKasbonTargetTermin, string>;
  for (const step of getKasbonTargetSteps(getSpkTerminScheme(spkJenis))) {
    labels[step.jenis] = step.kasbonTargetLabel;
  }
  return labels;
}

export function buildAllSpkPembayaranJenisLabel(): Record<
  SpkTerminPembayaranJenis | 'KASBON' | 'UPAH',
  string
> {
  return {
    ...buildSpkPembayaranJenisLabel('RUMAH'),
    ...buildSpkPembayaranJenisLabel('INFRASTRUKTUR'),
  };
}

export function buildAllSpkKasbonTargetLabel(): Record<SpkKasbonTargetTermin, string> {
  return {
    ...buildSpkKasbonTargetLabel('RUMAH'),
    ...buildSpkKasbonTargetLabel('INFRASTRUKTUR'),
  };
}

export function buildTerminUiColors(
  spkJenis: SpkJenis = 'RUMAH',
): Record<
  SpkTerminPembayaranJenis,
  { badge: string; row: string; text: string }
> {
  const infraPalette = [
    { badge: 'bg-sky-100 text-sky-800 border-sky-200', row: 'bg-sky-50/60', text: 'text-sky-700' },
    { badge: 'bg-cyan-100 text-cyan-800 border-cyan-200', row: 'bg-cyan-50/60', text: 'text-cyan-700' },
    { badge: 'bg-teal-100 text-teal-800 border-teal-200', row: 'bg-teal-50/60', text: 'text-teal-700' },
    { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', row: 'bg-emerald-50/60', text: 'text-emerald-700' },
    { badge: 'bg-lime-100 text-lime-800 border-lime-200', row: 'bg-lime-50/60', text: 'text-lime-700' },
  ];

  const colors = {} as Record<
    SpkTerminPembayaranJenis,
    { badge: string; row: string; text: string }
  >;

  getSpkTerminScheme(spkJenis).forEach((step, index) => {
    if (step.jenis === 'RETENSI') {
      colors.RETENSI = {
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        row: 'bg-amber-50/60',
        text: 'text-amber-800',
      };
      return;
    }

    if (spkJenis === 'RUMAH') {
      if (step.jenis === 'TERMIN_55') {
        colors.TERMIN_55 = {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          row: 'bg-blue-50/60',
          text: 'text-blue-700',
        };
      } else if (step.jenis === 'TERMIN_100') {
        colors.TERMIN_100 = {
          badge: 'bg-violet-100 text-violet-800 border-violet-200',
          row: 'bg-violet-50/60',
          text: 'text-violet-700',
        };
      }
      return;
    }

    const palette = infraPalette[index] ?? infraPalette[infraPalette.length - 1]!;
    colors[step.jenis] = palette;
  });

  return colors;
}
