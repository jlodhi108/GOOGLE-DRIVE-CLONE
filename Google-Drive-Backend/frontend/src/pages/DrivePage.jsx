import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ItemExplorer } from '../components/ItemExplorer';
import { PromptDialog } from '../components/PromptDialog';
import { ShareDialog } from '../components/ShareDialog';
import { useItemActions } from '../hooks/useItemActions';
import { foldersApi } from '../api/folders';
import { filesApi } from '../api/files';

export function DrivePage() {
  const [trail, setTrail] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const currentFolderId = trail.length > 0 ? trail[trail.length - 1].id : null;

  const load = useCallback(async (folderId) => {
    setLoading(true);
    setError(null);
    try {
      if (folderId === null) {
        const [folderList, fileList] = await Promise.all([foldersApi.list(null), filesApi.list(null)]);
        setSubfolders(folderList);
        setFiles(fileList);
      } else {
        const data = await foldersApi.getContents(folderId);
        setSubfolders(data.contents.subfolders);
        setFiles(data.contents.files);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currentFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const {
    handleStar, handleTrash, handlePreview, handleDownload,
    renameTarget, setRenameTarget, shareTarget, setShareTarget,
    handleRenameSubmit, handleShareSubmit
  } = useItemActions(() => load(currentFolderId), setError);

  const openFolder = (folder) => setTrail(prev => [...prev, folder]);

  const navigateBreadcrumb = (index) => {
    setTrail(prev => (index === -1 ? [] : prev.slice(0, index + 1)));
  };

  const handleCreateFolder = async (name) => {
    await foldersApi.create(name, currentFolderId);
    await load(currentFolderId);
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await filesApi.upload(file, currentFolderId);
      await load(currentFolderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Layout
      onCreateFolder={() => setShowNewFolder(true)}
      onUploadFile={() => fileInputRef.current?.click()}
    >
      <input ref={fileInputRef} type="file" hidden onChange={handleFilePicked} />

      <ItemExplorer
        title="My Drive"
        subtitle={uploading ? 'Uploading…' : undefined}
        breadcrumbs={<Breadcrumbs trail={trail} onNavigate={navigateBreadcrumb} />}
        folders={subfolders}
        files={files}
        mode="drive"
        loading={loading}
        error={error}
        emptyMessage="This folder is empty."
        onOpenFolder={openFolder}
        onStar={handleStar}
        onShare={(item, kind) => setShareTarget({ kind, id: item.id, name: item.name })}
        onRename={(item, kind) => setRenameTarget({ kind, id: item.id, name: item.name })}
        onTrash={handleTrash}
        onPreview={handlePreview}
        onDownload={handleDownload}
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
