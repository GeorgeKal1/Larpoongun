interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

/** Minimal mark: a spear crossing diagonally over a simple fish silhouette. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="var(--blue-050)" stroke="var(--blue-500)" strokeWidth="2.5" />
      {/* fish */}
      <path d="M14 34c6-8 16-11 25-6l8-6v20l-8-6c-9 5-19 2-25-2z" fill="var(--blue-500)" />
      <circle cx="21" cy="32" r="1.8" fill="var(--blue-050)" />
      {/* spear */}
      <line x1="50" y1="10" x2="17" y2="52" stroke="var(--blue-900)" strokeWidth="3" strokeLinecap="round" />
      <path d="M51 8.5L48.6 18.2 41.9 13z" fill="var(--blue-900)" />
    </svg>
  );
}

export function Logo({ size = 40, withWordmark = true }: LogoProps) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="logo-word">
          Larpoon<strong>Gun</strong>
        </span>
      )}
    </span>
  );
}
