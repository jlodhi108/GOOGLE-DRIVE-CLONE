import { useEffect, useState } from 'react';
import { activityApi } from '../api/activity';
import { formatBytes, formatDate, describeActivity } from '../utils/format';
import { FileIcon } from './FileIcon';

export function DetailsPanel({ item, kind, owner = 'You', isOpen, onClose }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!item) {
      setActivities([]);
      return;
    }
    activityApi.resource(item._id)
      .then(data => setActivities(data.activities || []))
      .catch(() => setActivities([]));
  }, [item]);

  return (
    <aside className={`details-panel${isOpen ? ' is-open' : ''}`} aria-label="Item details">
      <div className="details-panel__header">
        <h2>Details</h2>
        <button className="icon-btn small" aria-label="Close details panel" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className="details-panel__body">
        {!item ? (
          <p className="details-empty">Select a file or folder to see its details and activity.</p>
        ) : (
          <>
            <div className="details-preview">
              <FileIcon kind={kind} file={item} size="large" />
              <span className="details-preview__name">{item.name}</span>
            </div>
            <dl className="details-meta">
              <div className="details-meta__row"><dt>Owner</dt><dd>{owner}</dd></div>
              <div className="details-meta__row"><dt>Last modified</dt><dd>{formatDate(item.updatedAt)}</dd></div>
              <div className="details-meta__row"><dt>Size</dt><dd>{kind === 'folder' ? '—' : formatBytes(item.size)}</dd></div>
              {kind === 'folder' && (
                <div className="details-meta__row"><dt>Sharing</dt><dd>{item.isShared ? 'Shared' : 'Private'}</dd></div>
              )}
            </dl>
            <div className="details-activity">
              <h3>Activity</h3>
              {activities.length === 0 ? (
                <p className="details-empty">No recorded activity yet.</p>
              ) : (
                <ul>
                  {activities.map(a => (
                    <li key={a._id}>You {describeActivity(a.action)} this {kind} &mdash; {formatDate(a.createdAt)}</li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
