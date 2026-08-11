import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { filesApi } from '../api/files';
import { formatBytes, STORAGE_QUOTA_BYTES } from '../utils/format';

export function StoragePage() {
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    filesApi.storageUsage()
      .then(setUsage)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load storage usage'));
  }, []);

  const usedBytes = usage?.usedBytes ?? 0;
  const percent = Math.min(100, (usedBytes / STORAGE_QUOTA_BYTES) * 100);

  return (
    <Layout newDisabled>
      <div className="view-header">
        <div className="view-header__top">
          <div>
            <h1>Storage</h1>
            <p className="view-subtitle">Track how much space your files are using.</p>
          </div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__icon" aria-hidden="true">💾</span>
          <div className="stat-card__value">{formatBytes(usedBytes)}</div>
          <div className="stat-card__label">Used of {formatBytes(STORAGE_QUOTA_BYTES)}</div>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon" aria-hidden="true">📄</span>
          <div className="stat-card__value">{usage?.fileCount ?? '—'}</div>
          <div className="stat-card__label">Files stored</div>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon" aria-hidden="true">📈</span>
          <div className="stat-card__value">{percent.toFixed(1)}%</div>
          <div className="stat-card__label">Of quota used</div>
        </div>
      </div>

      <div className="panel storage-panel" style={{ marginTop: 16 }}>
        <div className="panel__header"><h2>Storage overview</h2></div>
        <div className="storage-meter storage-meter--wide">
          <div className="storage-meter__bar"><div className="storage-meter__fill" style={{ width: `${percent}%` }} /></div>
          <p className="storage-meter__label">
            {formatBytes(usedBytes)} of {formatBytes(STORAGE_QUOTA_BYTES)} used &middot; {formatBytes(Math.max(0, STORAGE_QUOTA_BYTES - usedBytes))} free
          </p>
        </div>
        <Link to="/trash" className="btn-ghost">Go to Trash to free up space</Link>
      </div>
    </Layout>
  );
}
