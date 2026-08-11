import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { filesApi } from '../api/files';
import { formatBytes, STORAGE_QUOTA_BYTES } from '../utils/format';

const NAV_SECTIONS = [
  { to: '/', label: 'Home', end: true },
  { to: '/drive', label: 'My Drive' },
  { to: '/shared', label: 'Shared with me' },
  { to: '/recent', label: 'Recent' },
  { to: '/starred', label: 'Starred' },
  { to: '/trash', label: 'Trash' },
  { to: '/storage', label: 'Storage' }
];

export function Sidebar({ isOpen, onClose, onCreateFolder, onUploadFile, newDisabled }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [usage, setUsage] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    filesApi.storageUsage().then(setUsage).catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  const usedBytes = usage?.usedBytes ?? 0;
  const percent = Math.min(100, (usedBytes / STORAGE_QUOTA_BYTES) * 100);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside id="sidebar" className={`sidebar${isOpen ? ' is-open' : ''}`}>
        <div className="sidebar__top">
          <div className="new-menu-wrap" ref={menuRef}>
            <button
              className="btn-primary new-btn"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              disabled={newDisabled}
              onClick={() => setMenuOpen(o => !o)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>
              <span>New</span>
            </button>
            {menuOpen && (
              <div className="new-menu">
                <button
                  className="new-menu__item"
                  onClick={() => { setMenuOpen(false); onCreateFolder?.(); }}
                >
                  <span aria-hidden="true">📁</span> New folder
                </button>
                <button
                  className="new-menu__item"
                  onClick={() => { setMenuOpen(false); onUploadFile?.(); }}
                >
                  <span aria-hidden="true">⬆️</span> File upload
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          <ul className="side-nav-list">
            {NAV_SECTIONS.map(section => (
              <li key={section.to}>
                <NavLink to={section.to} end={section.end} className="side-nav-link" onClick={onClose}>
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <div className="storage-meter">
            <div className="storage-meter__bar">
              <div className="storage-meter__fill" style={{ width: `${percent}%` }} />
            </div>
            <p className="storage-meter__label">
              {formatBytes(usedBytes)} of {formatBytes(STORAGE_QUOTA_BYTES)} used
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
