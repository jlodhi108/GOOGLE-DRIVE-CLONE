import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';

export function Topbar({ sidebarOpen, onToggleSidebar, searchValue, onSearchChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, toggleDarkMode] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="icon-btn hamburger"
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar"
          onClick={onToggleSidebar}
        >
          <span className="hamburger__bar"></span>
          <span className="hamburger__bar"></span>
          <span className="hamburger__bar"></span>
        </button>
        <Link to="/" className="brand">
          <span className="brand__logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 7C4 5.34315 5.34315 4 7 4H12L14 7H17C18.6569 7 20 8.34315 20 10V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
          </span>
          <span>Drive Clone</span>
        </Link>
      </div>

      <div className="topbar__center">
        <label className="search" htmlFor="globalSearch">
          <svg className="search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input
            type="search"
            id="globalSearch"
            className="search__input"
            placeholder="Search this view"
            aria-label="Search files and folders"
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
          />
        </label>
        <button
          className="icon-btn search-toggle"
          aria-label="Open search"
          aria-expanded={mobileSearchOpen}
          onClick={() => setMobileSearchOpen(o => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="topbar__right" ref={menuRef}>
        <button
          className="icon-btn"
          aria-label="Toggle dark mode"
          aria-pressed={isDark}
          title="Toggle dark mode"
          onClick={toggleDarkMode}
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.5C18.79 15.06 17.44 15.37 16.02 15.37C10.9 15.37 6.75 11.22 6.75 6.1C6.75 4.68 7.06 3.33 7.62 2.12C4.29 3.55 2 6.86 2 10.7C2 15.9 6.2 20.1 11.4 20.1C15.24 20.1 18.55 17.81 20 14.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2.5V5M12 19V21.5M4.2 4.2L6 6M18 18L19.8 19.8M2.5 12H5M19 12H21.5M4.2 19.8L6 18M18 6L19.8 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          )}
        </button>

        <button
          className="avatar"
          aria-label="Open user menu"
          aria-haspopup="true"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          {(user?.name || '?').slice(0, 2).toUpperCase()}
        </button>

        {menuOpen && (
          <div className="user-menu">
            <div className="user-menu__header">
              <div className="user-menu__name">{user?.name}</div>
              <div className="user-menu__email">{user?.email}</div>
            </div>
            <Link className="user-menu__item" to="/activity" onClick={() => setMenuOpen(false)}>
              Activity log
            </Link>
            <button className="user-menu__item is-danger" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>

      {mobileSearchOpen && (
        <div className="mobile-search-row">
          <label className="search" htmlFor="mobileSearch">
            <svg className="search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <input
              type="search"
              id="mobileSearch"
              className="search__input"
              placeholder="Search this view"
              aria-label="Search files and folders"
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
            />
          </label>
        </div>
      )}
    </header>
  );
}
