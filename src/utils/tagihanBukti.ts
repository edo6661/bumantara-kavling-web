export type TagihanBuktiSource = {
  fileBukti?: string | null;
  fileBuktiList?: string[] | null;
};

export function getTagihanFileBuktiList(tagihan: TagihanBuktiSource): string[] {
  if (tagihan.fileBuktiList && tagihan.fileBuktiList.length > 0) {
    return tagihan.fileBuktiList.filter((url) => url.trim() !== "");
  }
  const single = tagihan.fileBukti?.trim();
  return single ? [single] : [];
}

export function appendFilesToFormData(
  formData: FormData,
  fieldName: string,
  files: File | File[],
) {
  const list = Array.isArray(files) ? files : [files];
  list.forEach((file) => formData.append(fieldName, file));
}
