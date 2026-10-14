export type FishKind = "reef" | "tuna" | "grouper" | "angler" | "jelly";

interface FishProps {
  kind: FishKind;
  color: string;
  width: number;
  className?: string;
}

/** Simple stylised sea creatures. All face right; flip the parent to face left. */
export function Fish({ kind, color, width, className }: FishProps) {
  switch (kind) {
    case "reef":
      return (
        <svg className={className} width={width} viewBox="0 0 120 60" aria-hidden="true">
          <g className="fish-tail">
            <path d="M26 30L4 10l6 20-6 20z" fill={color} opacity="0.85" />
          </g>
          <path d="M20 30C35 8 80 6 106 30 80 54 35 52 20 30z" fill={color} />
          <path d="M52 12c-3 12-3 24 0 36M72 11c-3 13-3 25 0 38" stroke="#fff" strokeWidth="5" opacity="0.55" fill="none" />
          <path d="M58 14c6-8 16-10 22-8-4 3-8 6-10 10z" fill={color} />
          <circle cx="92" cy="26" r="3.6" fill="#fff" />
          <circle cx="93" cy="26" r="1.8" fill="#0a2540" />
        </svg>
      );
    case "tuna":
      return (
        <svg className={className} width={width} viewBox="0 0 160 60" aria-hidden="true">
          <g className="fish-tail">
            <path d="M34 30L8 4l12 26L8 56z" fill={color} />
          </g>
          <path d="M28 30C52 10 112 8 152 31 112 50 52 50 28 30z" fill={color} />
          <path d="M30 31c40 6 80 6 120 1-30 14-90 16-120-1z" fill="#dff3ff" opacity="0.7" />
          <path d="M78 14l12-12 4 13zM80 46l10 10 3-11z" fill={color} />
          <path d="M44 22l4 4M52 20l4 4M44 38l4-4M52 40l4-4" stroke="#ffd65a" strokeWidth="2.5" />
          <circle cx="136" cy="27" r="3.4" fill="#fff" />
          <circle cx="137" cy="27" r="1.7" fill="#0a2540" />
        </svg>
      );
    case "grouper":
      return (
        <svg className={className} width={width} viewBox="0 0 140 70" aria-hidden="true">
          <g className="fish-tail">
            <path d="M26 35L2 14c4 8 4 34 0 42z" fill={color} />
          </g>
          <path d="M20 36C28 8 104 2 132 32c-16 30-90 34-112 4z" fill={color} />
          <path d="M44 12c12-8 40-10 56-2-18 2-34 4-56 2z" fill={color} />
          <g fill="#0a2540" opacity="0.25">
            <circle cx="50" cy="28" r="4" />
            <circle cx="66" cy="40" r="5" />
            <circle cx="84" cy="24" r="4" />
            <circle cx="96" cy="44" r="4" />
            <circle cx="40" cy="44" r="3" />
          </g>
          <path d="M120 40c5 2 9 1 12-2" stroke="#0a2540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="114" cy="27" r="4.6" fill="#fff" />
          <circle cx="115.5" cy="27" r="2.4" fill="#0a2540" />
        </svg>
      );
    case "angler":
      return (
        <svg className={className} width={width} viewBox="0 0 120 90" aria-hidden="true">
          <path d="M78 34C70 14 76 4 92 2" stroke={color} strokeWidth="2" fill="none" />
          <circle className="angler-lure" cx="94" cy="3" r="5" fill="#b8fbff" />
          <g className="fish-tail">
            <path d="M24 52L2 34l6 18-6 18z" fill={color} />
          </g>
          <path d="M18 52c0-24 22-36 50-34 26 2 40 16 44 30-6 20-30 32-56 30-24-2-38-10-38-26z" fill={color} />
          <path d="M80 50c10-2 22 0 32-2-4 12-18 18-34 14z" fill="#03101f" />
          <path d="M84 50l3 6 3-6 3 6 3-6 3 6 3-6M86 62l3-5 3 5 3-5 3 5" stroke="#e6f7ff" strokeWidth="1.5" fill="none" />
          <circle cx="78" cy="36" r="4" fill="#b8fbff" opacity="0.9" />
          <circle cx="79" cy="36" r="1.8" fill="#03101f" />
        </svg>
      );
    case "jelly":
      return (
        <svg className={className} width={width} viewBox="0 0 80 110" aria-hidden="true">
          <path d="M6 40C6 16 22 4 40 4s34 12 34 36c-8 4-60 4-68 0z" fill={color} opacity="0.75" />
          <g className="jelly-tentacles" stroke={color} strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round">
            <path d="M16 44c-4 14 6 24 0 40M30 46c-4 18 6 30 0 52M44 46c4 18-6 30 0 52M58 44c4 14-6 24 0 40" />
          </g>
        </svg>
      );
  }
}
