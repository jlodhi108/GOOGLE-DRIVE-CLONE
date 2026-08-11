import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { activityApi } from '../api/activity';
import { formatDate, describeActivity } from '../utils/format';

export function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    activityApi.list(page, 20)
      .then(res => {
        setActivities(res.activities);
        setTotalPages(res.totalPages);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load activity'))
      .finally(() => setLoading(false));
  }, [page]);

  const handleMarkRead = async (activity) => {
    try {
      await activityApi.markAsRead(activity._id);
      setActivities(prev => prev.map(a => (a._id === activity._id ? { ...a, isRead: true } : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity');
    }
  };

  return (
    <Layout newDisabled>
      <h2>Activity</h2>
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="page-loading">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="empty-state">No activity yet.</p>
      ) : (
        <>
          <ul className="activity-list">
            {activities.map(activity => {
              const targetName = typeof activity.target === 'object' && activity.target ? activity.target.name : undefined;
              return (
                <li key={activity._id} className={activity.isRead ? 'activity-item read' : 'activity-item'}>
                  <span>
                    You {describeActivity(activity.action)} {targetName ?? `a ${activity.targetModel.toLowerCase()}`}
                  </span>
                  <span className="activity-time">{formatDate(activity.createdAt)}</span>
                  {!activity.isRead && (
                    <button className="btn-ghost" onClick={() => handleMarkRead(activity)}>Mark read</button>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}
    </Layout>
  );
}
