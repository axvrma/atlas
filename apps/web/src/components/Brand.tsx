import { Link } from 'react-router-dom';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label="Atlas Studio home">
      <span className="brand-mark">
        <svg viewBox="0 0 28 28" width="24" height="24" aria-hidden="true">
          <path d="M4 23 14 4l10 19h-6l-4-8-4 8Z" fill="currentColor" />
          <circle cx="14" cy="23" r="2" fill="currentColor" opacity=".5" />
        </svg>
      </span>
      {!compact && (
        <span>
          Atlas<span className="brand-studio"> Studio</span>
        </span>
      )}
    </Link>
  );
}
