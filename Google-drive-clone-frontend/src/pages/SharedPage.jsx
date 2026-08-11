import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ItemExplorer } from '../components/ItemExplorer';
import { useItemActions } from '../hooks/useItemActions';
import { shareApi } from '../api/share';

export function SharedPage() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sharedFiles, sharedFolders] = await Promise.all([shareApi.getSharedFiles(), shareApi.getSharedFolders()]);
      setFiles(sharedFiles.filter(e => e.file).map(e => ({ ...e.file, _ownerLabel: e.sharedBy?.name })));
      setFolders(sharedFolders.filter(e => e.folder).map(e => ({ ...e.folder, _ownerLabel: e.sharedBy?.name })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shared items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { handlePreview, handleDownload } = useItemActions(load, setError);

  return (
    <Layout newDisabled>
      <ItemExplorer
        title="Shared with me"
        subtitle="Files and folders other people have shared with you."
        folders={folders}
        files={files}
        mode="shared"
        loading={loading}
        error={error}
        emptyMessage="Nothing has been shared with you yet."
        onPreview={handlePreview}
        onDownload={handleDownload}
      />
    </Layout>
  );
}
