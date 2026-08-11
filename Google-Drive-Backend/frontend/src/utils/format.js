// Fixed demo storage quota — this app has no billing/plan system, so usage
// (computed for real from uploaded file sizes) is shown against a flat cap.
export const STORAGE_QUOTA_BYTES = 15 * 1024 ** 3;

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function describeActivity(action) {
  const labels = {
    upload: 'uploaded',
    download: 'downloaded',
    delete: 'deleted',
    rename: 'renamed',
    move: 'moved',
    share: 'shared',
    unshare: 'unshared',
    create_folder: 'created folder',
    delete_folder: 'permanently deleted folder',
    trash: 'moved to trash',
    restore: 'restored',
    star: 'starred',
    unstar: 'unstarred'
  };
  return labels[action] ?? action;
}

// Maps a file's mimeType/name to a file-icon type used by ItemExplorer/DetailsPanel
// (drives which --file-* color token and extension badge to render).
export function getFileIconType(file) {
  const mime = file.mimeType || '';
  const ext = file.name?.split('.').pop()?.toLowerCase() || '';

  if (mime === 'application/pdf' || ext === 'pdf') return { type: 'pdf', label: 'PDF' };
  if (mime.startsWith('image/')) return { type: 'img', label: ext.slice(0, 3).toUpperCase() || 'IMG' };
  if (mime.startsWith('video/')) return { type: 'vid', label: ext.slice(0, 3).toUpperCase() || 'VID' };
  if (mime.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return { type: 'xls', label: 'XLS' };
  if (mime.includes('presentation') || ['ppt', 'pptx'].includes(ext)) return { type: 'ppt', label: 'PPT' };
  if (mime.includes('word') || ['doc', 'docx', 'txt'].includes(ext)) return { type: 'doc', label: 'DOC' };
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { type: 'zip', label: 'ZIP' };
  return { type: 'file', label: ext.slice(0, 3).toUpperCase() || 'FILE' };
}
