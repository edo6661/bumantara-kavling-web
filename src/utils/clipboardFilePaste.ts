/** Ambil file gambar/PDF dari event clipboard (paste). */
export function getFilesFromClipboard(
  e: ClipboardEvent | React.ClipboardEvent,
): File[] {
  const dt = e.clipboardData;
  if (!dt) return [];

  const files: File[] = [];
  const seen = new Set<string>();

  const pushFile = (file: File | null) => {
    if (!file?.size) return;
    const key = `${file.name}|${file.size}|${file.type}|${file.lastModified}`;
    if (seen.has(key)) return;
    seen.add(key);
    files.push(file);
  };

  if (dt.files?.length) {
    for (let i = 0; i < dt.files.length; i++) {
      pushFile(dt.files[i] ?? null);
    }
  }

  const items = dt.items;
  if (items?.length) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || item.kind !== 'file') continue;
      pushFile(item.getAsFile());
    }
  }

  return files;
}

export function isUploadableFile(file: File): boolean {
  if (file.type.startsWith('image/') || file.type === 'application/pdf') {
    return true;
  }
  const name = file.name?.toLowerCase() ?? '';
  if (/\.(png|jpe?g|gif|webp|bmp|heic|pdf)$/i.test(name)) {
    return true;
  }
  // Screenshot dari clipboard Windows kadang tanpa MIME type
  if (!file.type && file.size > 0) {
    return true;
  }
  return false;
}

export const PASTE_UPLOAD_ROW_CLASS =
  'ring-2 ring-inset ring-blue-500 bg-blue-50/70';
