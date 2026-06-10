export const DEFAULT_PERUMAHAN_NAME = 'Puri Safana';

export function resolveDefaultPerumahanId(
  list: { id: string | number; nama: string }[],
): number | undefined {
  const match = list.find(
    (p) => p.nama.trim().toLowerCase() === DEFAULT_PERUMAHAN_NAME.toLowerCase(),
  );
  const rawId = match?.id ?? list[0]?.id;
  if (rawId == null || rawId === '') return undefined;
  const id = Number(rawId);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}
