import { createContext, useContext, useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

// Lets any page underneath a <Layout> read the topbar's search box value
// without every page having to lift search state itself.
const SearchContext = createContext('');
export function useLayoutSearch() {
  return useContext(SearchContext);
}

export function Layout({ children, onCreateFolder, onUploadFile, newDisabled }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <div className="app-shell">
      <Topbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        searchValue={search}
        onSearchChange={setSearch}
      />
      <div className="app-body">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onCreateFolder={onCreateFolder}
          onUploadFile={onUploadFile}
          newDisabled={newDisabled}
        />
        <main className="main">
          <SearchContext.Provider value={search}>{children}</SearchContext.Provider>
        </main>
      </div>
      <footer className="statusbar">
        <span>Drive Clone</span>
        <span className="statusbar__divider" aria-hidden="true">&middot;</span>
        <span>v1.0.0</span>
        <span className="statusbar__divider" aria-hidden="true">&middot;</span>
        <a href="#" className="statusbar__link">Help</a>
      </footer>
    </div>
  );
}
