import { useCallback, useEffect, useState } from 'react';
import {
  getFilesFromClipboard,
  isUploadableFile,
  PASTE_UPLOAD_ROW_CLASS,
} from '../utils/clipboardFilePaste';

interface UseRowPasteUploadOptions<T extends { id: number }> {
  canSelect?: (row: T) => boolean;
  /** Return false agar baris tetap terpilih setelah paste gagal. */
  onPasteFiles: (row: T, files: File[]) => boolean | void | Promise<boolean | void>;
}

export function useRowPasteUpload<T extends { id: number }>({
  canSelect,
  onPasteFiles,
}: UseRowPasteUploadOptions<T>) {
  const [pasteTarget, setPasteTarget] = useState<T | null>(null);

  const selectRow = useCallback(
    (row: T) => {
      if (canSelect && !canSelect(row)) return;
      setPasteTarget((prev) => (prev?.id === row.id ? null : row));
    },
    [canSelect],
  );

  const clearSelection = useCallback(() => setPasteTarget(null), []);

  const isSelected = useCallback(
    (id: number) => pasteTarget?.id === id,
    [pasteTarget],
  );

  const getRowClassName = useCallback(
    (row: T) => (isSelected(row.id) ? PASTE_UPLOAD_ROW_CLASS : ''),
    [isSelected],
  );

  const handlePasteEvent = useCallback(
    (e: ClipboardEvent | React.ClipboardEvent) => {
      if (!pasteTarget) return;

      const files = getFilesFromClipboard(e).filter(isUploadableFile);
      if (!files.length) return;

      e.preventDefault();
      e.stopPropagation();

      void (async () => {
        const shouldClear = await onPasteFiles(pasteTarget, files);
        if (shouldClear !== false) setPasteTarget(null);
      })();
    },
    [pasteTarget, onPasteFiles],
  );

  useEffect(() => {
    if (!pasteTarget) return;

    document.addEventListener('paste', handlePasteEvent, true);
    return () => document.removeEventListener('paste', handlePasteEvent, true);
  }, [pasteTarget, handlePasteEvent]);

  return {
    pasteTarget,
    selectRow,
    clearSelection,
    isSelected,
    getRowClassName,
  };
}
