import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ItemExplorer } from '../components/ItemExplorer';
import { PromptDialog } from '../components/PromptDialog';
import { ShareDialog } from '../components/ShareDialog';
import { useItemActions } from '../hooks/useItemActions';
import { filesApi } from '../api/files';
import { foldersApi } from '../api/folders';

export function StarredPage() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [starredFolders, starredFiles] = await Promise.all([foldersApi.starred(), filesApi.starred()]);
      setFolders(starredFolders);
      setFiles(starredFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load starred items');
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
        title="Starred"
        subtitle="Files and folders you've marked as important."
        folders={folders}
        files={files}
        mode="drive"
        loading={loading}
        error={error}
        emptyMessage="Nothing starred yet — star a file or folder to see it here."
        onStar={handleStar}
        onTrash={handleTrash}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onShare={(item, kind) => setShareTarget({ kind, id: item._id, name: item.name })}
        onRename={(item, kind) => setRenameTarget({ kind, id: item._id, name: item.name })}
      />

      {renameTarget && (
        <PromptDialog
          title={`Rename ${renameTarget.kind}`}
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
