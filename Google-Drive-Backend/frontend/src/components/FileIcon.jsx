import { getFileIconType } from '../utils/format';

// Renders the colored folder/file-type badge used across list rows, grid
// cards, and the details panel.
export function FileIcon({ kind, file, size }) {
  const sizeClass = size === 'large' ? ' large' : '';

  if (kind === 'folder') {
    return (
      <span className={`file-icon file-icon--folder${sizeClass}`} aria-hidden="true">
        <svg width={size === 'large' ? 26 : 18} height={size === 'large' ? 26 : 18} viewBox="0 0 24 24" fill="none">
          <path d="M4 7C4 5.9 4.9 5 6 5H10.5L12.5 7H18C19.1 7 20 7.9 20 9V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  const { type, label } = getFileIconType(file);
  return (
    <span className={`file-icon file-icon--${type}${sizeClass}`} aria-hidden="true">
      {label}
    </span>
  );
}
