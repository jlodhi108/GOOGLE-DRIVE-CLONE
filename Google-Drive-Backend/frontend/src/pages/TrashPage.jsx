import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ItemExplorer } from '../components/ItemExplorer';
import { useItemActions } from '../hooks/useItemActions';
import { filesApi } from '../api/files';
import { foldersApi } from '../api/folders';

export function TrashPage() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [trashedFolders, trashedFiles] = await Promise.all([foldersApi.trashList(), filesApi.trashList()]);
      setFolders(trashedFolders);
      setFiles(trashedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { handleRestore, handlePermanentDelete } = useItemActions(load, setError);

  const handleEmptyTrash = async () => {
    if (folders.length === 0 && files.length === 0) return;
    if (!confirm('Permanently delete everything in trash? This cannot be undone.')) return;
    try {
      await Promise.all([
        ...folders.map(f => foldersApi.permanentDelete(f._id)),
        ...files.map(f => filesApi.permanentDelete(f._id))
      ]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to empty trash');
    }
  };

  return (
    <Layout newDisabled>
      <ItemExplorer
        title="Trash"
        subtitle="Items here are deleted permanently after you empty the trash."
        headerActions={
          <button className="btn-ghost" onClick={handleEmptyTrash} disabled={folders.length === 0 && files.length === 0}>
            Empty trash
          </button>
        }
        folders={folders}
        files={files}
        mode="trash"
        loading={loading}
        error={error}
        emptyMessage="Trash is empty."
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />
    </Layout>
  );
}
