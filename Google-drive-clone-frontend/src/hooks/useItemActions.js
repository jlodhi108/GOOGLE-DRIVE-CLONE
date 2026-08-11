import { useState } from 'react';
import { filesApi } from '../api/files';
import { foldersApi } from '../api/folders';
import { shareApi } from '../api/share';

// Shared star/trash/restore/preview/download/rename/share handlers used by
// every page that renders an <ItemExplorer>. `reload` is called after any
// mutation so the page's item list stays in sync with the server.
export function useItemActions(reload, onError) {
  const [renameTarget, setRenameTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const report = (err, fallback) => onError?.(err instanceof Error ? err.message : fallback);

  const api = (kind) => (kind === 'folder' ? foldersApi : filesApi);

  const handleStar = async (item, kind) => {
    try {
      await api(kind).star(item._id);
      await reload();
    } catch (err) { report(err, 'Failed to update star'); }
  };

  const handleTrash = async (item, kind) => {
    if (!confirm(`Move "${item.name}" to trash?`)) return;
    try {
      await api(kind).remove(item._id);
      await reload();
    } catch (err) { report(err, 'Failed to move to trash'); }
  };

  const handleRestore = async (item, kind) => {
    try {
      await api(kind).restore(item._id);
      await reload();
    } catch (err) { report(err, 'Failed to restore'); }
  };

  const handlePermanentDelete = async (item, kind) => {
    if (!confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await api(kind).permanentDelete(item._id);
      await reload();
    } catch (err) { report(err, 'Failed to permanently delete'); }
  };

  const handlePreview = async (file) => {
    try {
      const { downloadUrl } = await filesApi.getDownloadUrl(file._id, 'view');
      window.open(downloadUrl, '_blank');
    } catch (err) { report(err, 'Failed to open preview'); }
  };

  const handleDownload = async (file) => {
    try {
      const { downloadUrl } = await filesApi.getDownloadUrl(file._id, 'download');
      window.open(downloadUrl, '_blank');
    } catch (err) { report(err, 'Failed to generate download link'); }
  };

  const handleRenameSubmit = async (value) => {
    if (!renameTarget) return;
    await api(renameTarget.kind).rename(renameTarget.id, value);
    await reload();
  };

  const handleShareSubmit = async (email, permissions) => {
    if (!shareTarget) return;
    if (shareTarget.kind === 'file') await shareApi.shareFile(shareTarget.id, email, permissions);
    else await shareApi.shareFolder(shareTarget.id, email, permissions);
  };

  return {
    handleStar,
    handleTrash,
    handleRestore,
    handlePermanentDelete,
    handlePreview,
    handleDownload,
    renameTarget,
    setRenameTarget,
    shareTarget,
    setShareTarget,
    handleRenameSubmit,
    handleShareSubmit
  };
}
