export function validateReviewFiles(value: unknown): { files: { name: string; mimeType: string; dataBase64: string }[]; error?: string } {
  if (!Array.isArray(value) || value.length > 6) return { files: [], error: 'Submit no more than 6 files.' };
  const files: { name: string; mimeType: string; dataBase64: string }[] = [];
  let bytes = 0;
  for (const file of value) {
    if (!file || typeof file.name !== 'string' || typeof file.mimeType !== 'string' || typeof file.dataBase64 !== 'string' || !file.dataBase64.length || file.dataBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.dataBase64)) return { files: [], error: 'File data is empty or unreadable.' };
    bytes += file.dataBase64.length * 3 / 4 - (file.dataBase64.endsWith('==') ? 2 : file.dataBase64.endsWith('=') ? 1 : 0);
    if (bytes > 8 * 1024 * 1024) return { files: [], error: 'Combined files exceed 8 MB.' };
    files.push({ name: file.name.slice(0, 100), mimeType: file.mimeType, dataBase64: file.dataBase64 });
  }
  return { files };
}