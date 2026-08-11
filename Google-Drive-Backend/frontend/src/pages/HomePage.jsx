import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ItemExplorer } from '../components/ItemExplorer';
import { PromptDialog } from '../components/PromptDialog';
import { ShareDialog } from '../components/ShareDialog';
import { useItemActions } from '../hooks/useItemActions';
import { useAuth } from '../context/AuthContext';
import { foldersApi } from '../api/folders';
import { filesApi } from '../api/files';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleCreateFolder = async (name) => {
    await foldersApi.create(name, null);
    navigate('/drive');
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await filesApi.upload(file, null);
      navigate('/drive');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Layout onCreateFolder={() => setShowNewFolder(true)} onUploadFile={() => fileInputRef.current?.click()}>
      <input ref={fileInputRef} type="file" hidden onChange={handleFilePicked} />

      <div className="quick-actions">
        <button className="quick-action" onClick={() => setShowNewFolder(true)}>
          <span className="quick-action__icon" aria-hidden="true">📁</span>
          <span className="quick-action__text"><strong>New folder</strong><small>Create in My Drive</small></span>
        </button>
        <button className="quick-action" onClick={() => fileInputRef.current?.click()}>
          <span className="quick-action__icon" aria-hidden="true">⬆️</span>
          <span className="quick-action__text"><strong>Upload file</strong><small>Add to My Drive</small></span>
        </button>
        <button className="quick-action" onClick={() => navigate('/storage')}>
          <span className="quick-action__icon" aria-hidden="true">💾</span>
          <span className="quick-action__text"><strong>View storage</strong><small>See usage details</small></span>
        </button>
      </div>

      <ItemExplorer
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle="Here's what you've been working on recently."
        files={files}
        mode="drive"
        loading={loading}
        error={error}
        emptyMessage="No recent files yet — upload something to get started."
        onStar={handleStar}
        onTrash={handleTrash}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onShare={(item) => setShareTarget({ kind: 'file', id: item._id, name: item.name })}
        onRename={(item) => setRenameTarget({ kind: 'file', id: item._id, name: item.name })}
      />

      {showNewFolder && (
        <PromptDialog
          title="New folder"
          label="Folder name"
          confirmLabel="Create"
          onSubmit={handleCreateFolder}
          onClose={() => setShowNewFolder(false)}
        />
      )}

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
