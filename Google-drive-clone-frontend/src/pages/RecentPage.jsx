import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ItemExplorer } from '../components/ItemExplorer';
import { PromptDialog } from '../components/PromptDialog';
import { ShareDialog } from '../components/ShareDialog';
import { useItemActions } from '../hooks/useItemActions';
import { filesApi } from '../api/files';

export function RecentPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await filesApi.recent());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const {
    handleStar, handleTrash, handlePreview, handleDownload,
    renameTarget, setRenameTarget, shareTarget, setShareTarget,
    handleRenameSubmit, handleShareSubmit
  } = useItemActions(load, setError);

  return (
    <Layout newDisabled>
      <ItemExplorer
        title="Recent"
        subtitle="Files you've recently opened or edited."
        files={files}
        mode="drive"
        loading={loading}
        error={error}
        emptyMessage="No recent files yet."
        onStar={handleStar}
        onTrash={handleTrash}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onShare={(item) => setShareTarget({ kind: 'file', id: item._id, name: item.name })}
        onRename={(item) => setRenameTarget({ kind: 'file', id: item._id, name: item.name })}
      />

      {renameTarget && (
        <PromptDialog
          title="Rename file"
          label="Name"
          initialValue={renameTarget.name}
          confirmLabel="Rename"
          onSubmit={handleRenameSubmit}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {shareTarget && (
        <ShareDialog
          targetName={shareTarget.name}
          onShare={handleShareSubmit}
          onClose={() => setShareTarget(null)}
        />
      )}
    </Layout>
  );
}
