export const DEFAULT_PERUMAHAN_NAME = 'Puri Safana';

export function resolveDefaultPerumahanId(
  list: { id: number; nama: string }[],
): number | undefined {
  const match = list.find(
    (p) => p.nama.trim().toLowerCase() === DEFAULT_PERUMAHAN_NAME.toLowerCase(),
  );
  return match?.id ?? list[0]?.id;
}
