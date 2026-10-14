import type { ArtKind } from "@/lib/products";

/** Placeholder product illustrations until real photography exists. */
export function ProductArt({ art, accent }: { art: ArtKind; accent: string }) {
  return (
    <svg viewBox="0 0 200 140" className="product-art" role="img" aria-label={art}>
      <defs>
        <radialGradient id={`bg-${art}-${accent.slice(1)}`} cx="50%" cy="40%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d6efff" />
        </radialGradient>
      </defs>
      <rect width="200" height="140" fill={`url(#bg-${art}-${accent.slice(1)})`} />
      {renderArt(art, accent)}
    </svg>
  );
}

function renderArt(art: ArtKind, c: string) {
  const dark = "#0a2540";
  switch (art) {
    case "speargun":
      return (
        <g transform="rotate(-12 100 70)">
          <rect x="22" y="64" width="160" height="9" rx="4" fill={c} />
          <rect x="10" y="66.5" width="186" height="3" rx="1.5" fill="#c9d6e2" />
          <path d="M196 68l-8-5v10z" fill="#c9d6e2" />
          <path d="M60 73h18l-4 30c-1 5-10 5-11 0z" fill={dark} />
          <path d="M80 73c0 8 4 12 10 12" stroke={dark} strokeWidth="3" fill="none" />
          <path d="M170 64c-14-12-34-10-44 0" stroke="#ffb347" strokeWidth="3.5" fill="none" />
          <path d="M22 64c-6 0-10 5-10 9h10z" fill={dark} />
        </g>
      );
    case "shaft":
      return (
        <g transform="rotate(-20 100 70)">
          <rect x="14" y="68" width="160" height="4" rx="2" fill="#b7c7d6" />
          <path d="M174 64l18 6-18 6z" fill="#e2ebf3" />
          <path d="M150 72l-14 8 4-8z" fill={c} />
          <rect x="30" y="64" width="6" height="12" rx="1" fill={c} />
          <rect x="44" y="64" width="6" height="12" rx="1" fill={c} />
        </g>
      );
    case "wetsuit":
      return (
        <g>
          <path d="M78 20h44l18 18-10 28-6-4v62H76V62l-6 4-10-28z" fill={c} />
          <path d="M88 20c4 10 20 10 24 0" fill={dark} />
          <path d="M80 50c12 6 28 6 40 0M80 80c12 6 28 6 40 0" stroke="#fff" strokeOpacity="0.3" strokeWidth="5" fill="none" />
          <rect x="88" y="44" width="24" height="16" rx="5" fill={dark} opacity="0.6" />
        </g>
      );
    case "fins":
      return (
        <g>
          <path d="M60 22c10-4 22-4 28 4l-4 104c-10 4-26 4-34 0z" fill={c} />
          <path d="M110 22c10-4 22-4 28 4l-4 104c-10 4-26 4-34 0z" fill={c} opacity="0.85" />
          <path d="M58 20h32v22H58zM108 20h32v22h-32z" fill={dark} />
        </g>
      );
    case "mask":
      return (
        <g>
          <path d="M40 76c0-24 120-24 120 0" stroke={dark} strokeWidth="6" fill="none" />
          <path d="M56 50h88c8 0 12 6 10 14l-6 22c-2 6-8 8-14 8h-14c-8 0-10-12-20-12s-12 12-20 12H66c-6 0-12-2-14-8l-6-22c-2-8 2-14 10-14z" fill={dark} />
          <path d="M62 58h32l-2 26H70c-4 0-6-2-7-6zM106 58h32l-1 20c-1 4-3 6-7 6h-22z" fill={c} opacity="0.8" />
          <path d="M66 62l10 0-8 14z" fill="#fff" opacity="0.5" />
        </g>
      );
    case "knife":
      return (
        <g transform="rotate(-25 100 70)">
          <path d="M96 62h80c-6 10-30 16-80 16z" fill="#d4dde6" />
          <path d="M96 62h80c-6 4-30 7-80 7z" fill="#f4f8fb" />
          <rect x="30" y="60" width="66" height="20" rx="9" fill={dark} />
          <rect x="40" y="64" width="46" height="12" rx="5" fill={c} />
        </g>
      );
    case "float":
      return (
        <g>
          <rect x="30" y="74" width="140" height="40" rx="20" fill="#ff8c42" />
          <rect x="30" y="74" width="140" height="14" rx="7" fill="#fff" opacity="0.3" />
          <rect x="98" y="20" width="4" height="56" fill={dark} />
          <path d="M102 22h40v26h-40z" fill="#e63946" />
          <path d="M102 22l40 26" stroke="#fff" strokeWidth="5" />
          <path d="M60 114c0 10-6 14-6 22" stroke={c} strokeWidth="3" fill="none" />
        </g>
      );
    case "gloves":
      return (
        <g>
          <path d="M52 120V64c0-6 10-6 10 0V40c0-6 10-6 10 0v-6c0-6 10-6 10 0v6c0-6 10-6 10 0v40l8-10c4-4 12 0 8 6l-16 24v20z" fill={dark} />
          <path d="M104 120V64c0-6 10-6 10 0V40c0-6 10-6 10 0v-6c0-6 10-6 10 0v6c0-6 10-6 10 0v40l8-10c4-4 12 0 8 6l-16 24v20z" fill={c} />
        </g>
      );
  }
}
