/** Tampilan 3 digit nomor urut SPK (mis. 030), bukan nomor lengkap dengan path. */
export const formatShortNoSpk = (noSpk: string): string => {
  const trimmed = noSpk.trim();
  if (!trimmed) return '';

  const pad3 = (digits: string) => {
    const d = digits.replace(/\D/g, '');
    if (!d) return '';
    return d.length <= 3 ? d.padStart(3, '0') : d.slice(-3);
  };

  if (trimmed.includes('/')) {
    const head = pad3(trimmed.split('/')[0] ?? '');
    if (head) return head;
  }

  const digitGroups = trimmed.match(/\d+/g);
  if (digitGroups?.length) {
    const seq =
      digitGroups.find((g) => g.length >= 2 && g.length <= 3)
      ?? digitGroups.find((g) => g.length === 1)
      ?? digitGroups.find((g) => !(g.length === 4 && /^20\d{2}$/.test(g)))
      ?? digitGroups[0];
    const short = pad3(seq);
    if (short) return short;
  }

  return trimmed.slice(0, 3);
};
