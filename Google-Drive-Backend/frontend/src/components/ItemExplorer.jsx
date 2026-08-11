import { useEffect, useMemo, useState } from 'react';
import { useLayoutSearch } from './Layout';
import { FileIcon } from './FileIcon';
import { DetailsPanel } from './DetailsPanel';
import { formatBytes, formatDate, getFileIconType } from '../utils/format';

const CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'folder', label: 'Folders' },
  { key: 'doc', label: 'Documents' },
  { key: 'xls', label: 'Spreadsheets' },
  { key: 'img', label: 'Images' },
  { key: 'pdf', label: 'PDFs' },
  { key: 'vid', label: 'Videos' }
];

// The reusable file/folder list+grid used by every drive-related page.
// `mode` controls which actions are offered per item:
//   'drive'  — open/preview, download, share, rename, star, move to trash
//   'trash'  — restore, delete forever
//   'shared' — read-only (preview/download on files only, no selection)
export function ItemExplorer({
  folders = [],
  files = [],
  mode = 'drive',
  title,
  subtitle,
  headerActions,
  breadcrumbs,
  loading = false,
  error = null,
  emptyMessage = 'No items to show here.',
  onOpenFolder,
  onStar,
  onShare,
  onRename,
  onTrash,
  onRestore,
  onPermanentDelete,
  onPreview,
  onDownload
}) {
  const search = useLayoutSearch();
  const [viewMode, setViewMode] = useState('list');
  const [sort, setSort] = useState('name');
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [activeItem, setActiveItem] = useState(null);
  const [activeKind, setActiveKind] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!e.target.closest('.item-menu') && !e.target.closest('.more-btn')) setOpenMenuId(null);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Reset transient UI state (selection, open panel/menu) whenever the
  // underlying data set changes — e.g. navigating into a different folder.
  useEffect(() => {
    setSelected(new Set());
    setActiveItem(null);
    setActiveKind(null);
    setDetailsOpen(false);
    setOpenMenuId(null);
  }, [folders, files]);

  const visibleItems = useMemo(() => {
    let items = [
      ...folders.map(item => ({ ...item, kind: 'folder' })),
      ...files.map(item => ({ ...item, kind: 'file' }))
    ];

    if (filterType !== 'all') {
      items = filterType === 'folder'
        ? items.filter(i => i.kind === 'folder')
        : items.filter(i => i.kind === 'file' && getFileIconType(i).type === filterType);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }

    items = [...items];
    if (sort === 'name') {
      items.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'folder' ? -1 : 1));
    } else if (sort === 'modified') {
      items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sort === 'size') {
      items.sort((a, b) => (b.size || 0) - (a.size || 0));
    }
    return items;
  }, [folders, files, filterType, search, sort]);

  const toggleSelected = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleMenu = (id) => setOpenMenuId(prev => (prev === id ? null : id));

  const handleRowClick = (item) => {
    if (item.kind === 'folder' && onOpenFolder) {
      onOpenFolder(item);
      return;
    }
    setActiveItem(item);
    setActiveKind(item.kind);
    setDetailsOpen(true);
  };

  function renderItemMenu(item) {
    if (mode === 'trash') {
      return (
        <div className="item-menu">
          <button className="item-menu__item" onClick={() => { onRestore?.(item, item.kind); setOpenMenuId(null); }}>↩️ Restore</button>
          <button className="item-menu__item is-danger" onClick={() => { onPermanentDelete?.(item, item.kind); setOpenMenuId(null); }}>🗑️ Delete forever</button>
        </div>
      );
    }
    if (mode === 'shared') {
      if (item.kind !== 'file') return null;
      return (
        <div className="item-menu">
          <button className="item-menu__item" onClick={() => { onPreview?.(item); setOpenMenuId(null); }}>👁️ Preview</button>
          <button className="item-menu__item" onClick={() => { onDownload?.(item); setOpenMenuId(null); }}>⬇️ Download</button>
        </div>
      );
    }
    return (
      <div className="item-menu">
        {item.kind === 'folder' ? (
          <button className="item-menu__item" onClick={() => { onOpenFolder?.(item); setOpenMenuId(null); }}>📂 Open</button>
        ) : (
          <>
            <button className="item-menu__item" onClick={() => { onPreview?.(item); setOpenMenuId(null); }}>👁️ Preview</button>
            <button className="item-menu__item" onClick={() => { onDownload?.(item); setOpenMenuId(null); }}>⬇️ Download</button>
          </>
        )}
        <button className="item-menu__item" onClick={() => { onShare?.(item, item.kind); setOpenMenuId(null); }}>🔗 Share</button>
        <button className="item-menu__item" onClick={() => { onRename?.(item, item.kind); setOpenMenuId(null); }}>✏️ Rename</button>
        <button className="item-menu__item" onClick={() => { onStar?.(item, item.kind); setOpenMenuId(null); }}>{item.starred ? '☆ Unstar' : '★ Star'}</button>
        <button className="item-menu__item is-danger" onClick={() => { onTrash?.(item, item.kind); setOpenMenuId(null); }}>🗑️ Move to trash</button>
      </div>
    );
  }

  function renderSelectionActions() {
    const items = visibleItems.filter(i => selected.has(i._id));
    if (mode === 'trash') {
      return (
        <>
          <button className="icon-btn small" aria-label="Restore" title="Restore" onClick={() => { items.forEach(i => onRestore?.(i, i.kind)); setSelected(new Set()); }}>↩️</button>
          <button className="icon-btn small" aria-label="Delete forever" title="Delete forever" onClick={() => { items.forEach(i => onPermanentDelete?.(i, i.kind)); setSelected(new Set()); }}>🗑️</button>
        </>
      );
    }
    return (
      <>
        <button className="icon-btn small" aria-label="Star" title="Star" onClick={() => { items.forEach(i => onStar?.(i, i.kind)); setSelected(new Set()); }}>★</button>
        {items.length === 1 && (
          <button className="icon-btn small" aria-label="Rename" title="Rename" onClick={() => { onRename?.(items[0], items[0].kind); setSelected(new Set()); }}>✏️</button>
        )}
        <button className="icon-btn small" aria-label="Move to trash" title="Move to trash" onClick={() => { items.forEach(i => onTrash?.(i, i.kind)); setSelected(new Set()); }}>🗑️</button>
      </>
    );
  }

  function renderRow(item) {
    const isSelected = selected.has(item._id);
    const menu = renderItemMenu(item);
    return (
      <div
        key={item._id}
        className={`file-row${isSelected ? ' is-selected' : ''}`}
        tabIndex={0}
        role="row"
        aria-selected={isSelected}
        onClick={() => handleRowClick(item)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(item); } }}
      >
        {mode !== 'shared' && (
          <span className="file-row__check" onClick={e => e.stopPropagation()}>
            <input type="checkbox" aria-label={`Select ${item.name}`} checked={isSelected} onChange={() => toggleSelected(item._id)} />
          </span>
        )}
        <span className="file-row__name">
          <FileIcon kind={item.kind} file={item} />
          <span className="file-row__title">{item.name}</span>
          {item.starred && <span className="file-row__badges" aria-hidden="true">★</span>}
        </span>
        <span className="file-row__owner">{item._ownerLabel || 'You'}</span>
        <span className="file-row__modified">{formatDate(item.updatedAt)}</span>
        <span className="file-row__size">{item.kind === 'folder' ? '—' : formatBytes(item.size)}</span>
        <span className="file-row__actions" onClick={e => e.stopPropagation()}>
          {menu && (
            <>
              <button className="icon-btn small more-btn" aria-label={`More actions for ${item.name}`} aria-haspopup="true" aria-expanded={openMenuId === item._id} onClick={() => toggleMenu(item._id)}>⋮</button>
              {openMenuId === item._id && menu}
            </>
          )}
        </span>
      </div>
    );
  }

  function renderCard(item) {
    const isSelected = selected.has(item._id);
    const menu = renderItemMenu(item);
    return (
      <div
        key={item._id}
        className={`file-card${isSelected ? ' is-selected' : ''}`}
        tabIndex={0}
        role="row"
        aria-selected={isSelected}
        onClick={() => handleRowClick(item)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(item); } }}
      >
        <div className="file-card__top">
          {mode !== 'shared' ? (
            <span className="file-row__check" onClick={e => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select ${item.name}`} checked={isSelected} onChange={() => toggleSelected(item._id)} />
            </span>
          ) : <span />}
          {menu && (
            <span style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button className="icon-btn small more-btn" aria-label={`More actions for ${item.name}`} aria-haspopup="true" aria-expanded={openMenuId === item._id} onClick={() => toggleMenu(item._id)}>⋮</button>
              {openMenuId === item._id && menu}
            </span>
          )}
        </div>
        <div className="file-card__icon-wrap"><FileIcon kind={item.kind} file={item} size="large" /></div>
        <div className="file-card__name">{item.name}{item.starred ? ' ★' : ''}</div>
        <div className="file-card__meta">{formatDate(item.updatedAt)}</div>
      </div>
    );
  }

  return (
    <section className="view">
      <div className="view-header">
        <div className="view-header__top">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="view-subtitle">{subtitle}</p>}
          </div>
          <div className="view-controls">
            {headerActions}
            <div className="view-toggle" role="group" aria-label="Switch between list and grid view">
              <button className={`view-toggle__btn${viewMode === 'list' ? ' is-active' : ''}`} aria-label="List view" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
              <button className={`view-toggle__btn${viewMode === 'grid' ? ' is-active' : ''}`} aria-label="Grid view" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/></svg>
              </button>
            </div>
            <label className="visually-hidden" htmlFor="sortSelect">Sort by</label>
            <select id="sortSelect" className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="name">Name</option>
              <option value="modified">Last modified</option>
              <option value="size">Size</option>
            </select>
            <button className="icon-btn" aria-label="Toggle details panel" aria-pressed={detailsOpen} title="Details" onClick={() => setDetailsOpen(o => !o)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 11V16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
            </button>
          </div>
        </div>

        {breadcrumbs}

        <div className="chip-row" role="group" aria-label="Filter by type">
          {CHIPS.map(c => (
            <button key={c.key} className={`chip${filterType === c.key ? ' is-active' : ''}`} onClick={() => setFilterType(c.key)}>{c.label}</button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="selection-bar">
            <div className="selection-bar__left">
              <button className="icon-btn small" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <span>{selected.size} selected</span>
            </div>
            <div className="selection-bar__actions">{renderSelectionActions()}</div>
          </div>
        )}
      </div>

      <div className="content-split">
        <section className="file-area">
          {viewMode === 'list' && (
            <div className="table-head">
              <span className="col-check"></span>
              <span className="col-name">Name</span>
              <span className="col-owner">Owner</span>
              <span className="col-modified">Last modified</span>
              <span className="col-size">Size</span>
              <span className="col-actions"></span>
            </div>
          )}
          {loading ? (
            <p className="page-loading">Loading…</p>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : visibleItems.length === 0 ? (
            <p className="empty-state">{emptyMessage}</p>
          ) : (
            <div className={`file-list${viewMode === 'grid' ? ' is-grid' : ''}`}>
              {viewMode === 'list' ? visibleItems.map(renderRow) : visibleItems.map(renderCard)}
            </div>
          )}
        </section>

        <DetailsPanel
          item={activeItem}
          kind={activeKind}
          owner={activeItem?._ownerLabel || 'You'}
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
        />
      </div>
    </section>
  );
}
