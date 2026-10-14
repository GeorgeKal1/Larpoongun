"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Fish, type FishKind } from "./Fish";

/** Depth (metres) reached at the very bottom of the page. */
export const MAX_DEPTH = 40;

interface FishSpec {
  kind: FishKind;
  color: string;
  width: number;
  /** Scroll progress window (0–1) in which this fish is visible. */
  from: number;
  to: number;
  /** Vertical position in vh at the centre of its window. */
  top: number;
  dir: 1 | -1;
  /** Seconds to cross the screen. */
  speed: number;
  /** Fraction of the swim cycle already elapsed at load, so fish start spread out. */
  phase: number;
}

const FISH: FishSpec[] = [
  // Sunlit reef, 0–10 m
  { kind: "reef", color: "#ffb347", width: 98, from: 0.02, to: 0.3, top: 38, dir: 1, speed: 22, phase: 0.3 },
  { kind: "reef", color: "#ffd65a", width: 76, from: 0.05, to: 0.32, top: 62, dir: -1, speed: 18, phase: 0.6 },
  { kind: "reef", color: "#ff7f6e", width: 67, from: 0.1, to: 0.38, top: 48, dir: 1, speed: 15, phase: 0.1 },
  { kind: "reef", color: "#7ee0d0", width: 84, from: 0.12, to: 0.4, top: 75, dir: -1, speed: 24, phase: 0.85 },
  // Open blue, 10–25 m
  { kind: "tuna", color: "#4f7fb0", width: 238, from: 0.3, to: 0.6, top: 34, dir: -1, speed: 14, phase: 0.2 },
  { kind: "tuna", color: "#3c6a9a", width: 182, from: 0.34, to: 0.62, top: 58, dir: 1, speed: 12, phase: 0.55 },
  { kind: "jelly", color: "#cfe9ff", width: 76, from: 0.38, to: 0.7, top: 70, dir: 1, speed: 60, phase: 0.4 },
  { kind: "tuna", color: "#5b8cbd", width: 154, from: 0.45, to: 0.72, top: 44, dir: -1, speed: 11, phase: 0.75 },
  // Twilight, 25–40 m
  { kind: "jelly", color: "#9ad8ff", width: 90, from: 0.6, to: 0.9, top: 30, dir: -1, speed: 70, phase: 0.15 },
  { kind: "angler", color: "#1d3557", width: 168, from: 0.66, to: 0.94, top: 52, dir: 1, speed: 30, phase: 0.5 },
  { kind: "jelly", color: "#b8fbff", width: 59, from: 0.72, to: 1.0, top: 40, dir: 1, speed: 80, phase: 0.8 },
];

/** Colour of the water at each depth fraction. */
const WATER: [number, [number, number, number]][] = [
  [0, [191, 233, 255]],
  [0.2, [111, 196, 238]],
  [0.45, [36, 125, 189]],
  [0.7, [13, 66, 120]],
  [1, [3, 22, 46]],
];

// Deterministic pseudo-random so server and client render the same bubbles.
function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// Rounded so the server and browser serialise identical style strings.
const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  left: Math.round(rand(i) * 100),
  size: Math.round(4 + rand(i + 50) * 10),
  duration: Math.round(7 + rand(i + 100) * 9),
  delay: -Math.round(rand(i + 150) * 16),
}));

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** The water is one tall gradient layer that slides up as you scroll (GPU-only, no repaints). */
const WATER_SPAN = 6;
const WATER_GRADIENT = `linear-gradient(180deg, ${WATER.map(([p, c]) => `rgb(${c.join(", ")}) ${p * 100}%`).join(", ")})`;

/** Tile heights of the particle layers; must match background-size in globals.css. */
const PARTICLE_TILES = [110, 190, 260];
const PARTICLE_SPEEDS = [0.15, 0.4, 0.65];

const HIT_AT = 0.985;
const SPEAR_LENGTH = 380;

export default function OceanScene() {
  const waterRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<(HTMLDivElement | null)[]>([]);
  const fishRefs = useRef<(HTMLDivElement | null)[]>([]);
  const seabedRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const spearRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const depthLabelRef = useRef<HTMLSpanElement>(null);
  const depthFillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Measured on resize only, so scrolling never forces a layout.
    let maxScroll = 1;

    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!vw || !vh) return; // not laid out yet (e.g. hidden tab)

      const scrollY = window.scrollY;
      const p = clamp(scrollY / maxScroll);

      // Water darkens with depth: slide the tall gradient up.
      if (waterRef.current) {
        waterRef.current.style.transform = `translate3d(0, ${-p * (WATER_SPAN - 1) * vh}px, 0)`;
      }
      if (surfaceRef.current) {
        surfaceRef.current.style.transform = `translate3d(0, ${-scrollY * 0.6}px, 0)`;
        surfaceRef.current.style.opacity = String(1 - smooth(0, 0.12, p));
      }
      if (raysRef.current) {
        raysRef.current.style.transform = `translate3d(0, ${-scrollY * 0.15}px, 0)`;
        raysRef.current.style.opacity = String(1 - smooth(0.05, 0.45, p));
      }
      if (darkRef.current) darkRef.current.style.opacity = String(smooth(0.4, 1, p) * 0.75);

      // Particle layers drift upward at different speeds (the parallax), wrapping every tile.
      particlesRef.current.forEach((el, i) => {
        if (el) el.style.transform = `translate3d(0, ${-((scrollY * PARTICLE_SPEEDS[i]) % PARTICLE_TILES[i])}px, 0)`;
      });

      // Fish fade in/out inside their depth window and rise past as you sink.
      FISH.forEach((f, i) => {
        const el = fishRefs.current[i];
        if (!el) return;
        const fade = 0.05;
        const opacity = smooth(f.from, f.from + fade, p) * (1 - smooth(f.to - fade, f.to, p));
        const centre = (f.from + f.to) / 2;
        const offset = (centre - p) * 1.6 * vh;
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
        el.style.visibility = opacity > 0.001 ? "visible" : "hidden";
      });

      // Seabed rises into view near the bottom.
      if (seabedRef.current) {
        seabedRef.current.style.transform = `translate3d(0, ${(1 - smooth(0.78, 1, p)) * 100}%, 0)`;
      }

      // The spear falls down a lane on the right, kept clear of the page content (see .home .container).
      const containerRight = Math.min(vw, (vw + 1160) / 2);
      const laneX = vw >= 1100 ? containerRight - 110 : vw - 56;
      const targetY = vh * 0.72;
      const hit = p >= HIT_AT;
      if (targetRef.current) {
        const show = smooth(0.7, 0.88, p);
        targetRef.current.style.opacity = show.toFixed(3);
        targetRef.current.style.transform = `translate3d(${laneX}px, ${targetY + (1 - show) * 0.3 * vh}px, 0) translate(-60%, -50%)`;
      }
      if (spearRef.current) {
        // Tip starts just above the viewport and ends inside the fish's body.
        const t = clamp(p / HIT_AT);
        // Starts with the tip just below the header, so it is visible from the first screen.
        const tipY = lerp(110, targetY + 10, t);
        const sway = hit ? 0 : Math.sin(p * 40) * 3 * (1 - t);
        spearRef.current.style.transform = `translate3d(${laneX}px, ${tipY - SPEAR_LENGTH}px, 0) translateX(-50%) rotate(${sway}deg)`;
      }
      frontRef.current?.classList.toggle("is-hit", hit);

      if (depthLabelRef.current) depthLabelRef.current.textContent = `${(p * MAX_DEPTH).toFixed(1)} m`;
      if (depthFillRef.current) depthFillRef.current.style.transform = `scaleY(${p})`;
    };

    const measure = () => {
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      update();
    };

    measure();
    // Browsers fire scroll at most once per frame, so update straight from the event.
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    // Page height can change after fonts/images load.
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <div className="ocean" aria-hidden="true">
        <div
          ref={waterRef}
          className="ocean-water"
          style={{ background: WATER_GRADIENT, height: `${WATER_SPAN * 100}%` }}
        />
        <div ref={raysRef} className="ocean-rays" />
        <div ref={surfaceRef} className="ocean-surface">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              className="wave wave-back"
              d="M0 60c120-30 240-30 360 0s240 30 360 0 240-30 360 0 240 30 360 0 240-30 360 0 240 30 360 0v60H0z"
            />
            <path
              className="wave wave-front"
              d="M0 70c120-25 240-25 360 0s240 25 360 0 240-25 360 0 240 25 360 0 240-25 360 0 240 25 360 0v50H0z"
            />
          </svg>
        </div>

        {[0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => {
              particlesRef.current[i] = el;
            }}
            className={`ocean-particles ocean-particles-${i}`}
          />
        ))}

        <div className="ocean-bubbles">
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              style={
                {
                  left: `${b.left}%`,
                  width: b.size,
                  height: b.size,
                  animationDuration: `${b.duration}s`,
                  animationDelay: `${b.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {FISH.map((f, i) => (
          <div
            key={i}
            ref={(el) => {
              fishRefs.current[i] = el;
            }}
            className="ocean-fish"
            style={{ top: `${f.top}vh`, opacity: 0, visibility: "hidden" }}
          >
            <div
              className={`fish-swim ${f.dir === 1 ? "swim-right" : "swim-left"} ${f.kind === "jelly" ? "is-jelly" : ""}`}
              style={{ animationDuration: `${f.speed}s`, animationDelay: `${-f.phase * f.speed}s` }}
            >
              <div className="fish-bob">
                <div style={{ transform: f.dir === -1 ? "scaleX(-1)" : undefined }}>
                  <Fish kind={f.kind} color={f.color} width={f.width} />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div ref={darkRef} className="ocean-dark" />

        <div ref={seabedRef} className="ocean-seabed">
          <svg viewBox="0 0 1440 260" preserveAspectRatio="none">
            <g className="seaweed">
              <path d="M140 260c-20-60 30-90 0-160 30 50 10 100 20 160z" />
              <path d="M180 260c10-50-30-80 0-130 0 40 30 80 14 130z" />
              <path d="M1180 260c-20-70 40-100 0-190 40 60 20 120 24 190z" />
              <path d="M1240 260c10-40-20-70 4-110 4 40 24 70 10 110z" />
              <path d="M620 260c-14-40 20-60 0-110 24 40 10 70 16 110z" />
            </g>
            <path className="rock" d="M60 260c20-70 90-90 150-60 40-40 110-20 120 60z" />
            <path className="rock" d="M1040 260c30-80 120-90 160-40 40-20 100 0 110 40z" />
            <path className="sand" d="M0 220c200-30 400-30 720-10s520 10 720-10v60H0z" />
          </svg>
        </div>

      </div>

      {/* In front of the page content so the drop is always visible. */}
      <div ref={frontRef} className="ocean-front" aria-hidden="true">
        <div ref={targetRef} className="target-fish">
          <div className="target-inner">
            <Fish kind="grouper" color="#e07a5f" width={240} />
          </div>
          <div className="hit-burst">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{ "--a": `${i * 36}deg` } as CSSProperties} />
            ))}
          </div>
          <div className="hit-ring" />
          <div className="hit-caption">Got one!</div>
        </div>

        <div ref={spearRef} className="spear" style={{ height: SPEAR_LENGTH }}>
          <svg viewBox="0 0 24 320" width="32" height={SPEAR_LENGTH} preserveAspectRatio="none">
            <rect x="10.5" y="0" width="3" height="292" rx="1.5" fill="#d9e6f2" />
            <rect x="10.5" y="0" width="3" height="292" rx="1.5" fill="url(#shaftShine)" />
            <path d="M12 320l-7-26h14z" fill="#e8f1f8" />
            <path d="M12 320l-2-26h2z" fill="#9fb8cc" />
            <path d="M12 300l-9-14 9 6z" fill="#c7d7e6" />
            <rect x="9" y="6" width="6" height="10" rx="2" fill="#1f6fb2" />
            <defs>
              <linearGradient id="shaftShine" x1="0" x2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
                <stop offset="1" stopColor="#5c7a95" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="spear-trail">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="depth-gauge" aria-hidden="true">
        <div className="depth-track">
          <div ref={depthFillRef} className="depth-fill" />
          {[0, 10, 20, 30, 40].map((m) => (
            <span key={m} className="depth-tick" style={{ top: `${(m / MAX_DEPTH) * 100}%` }}>
              {m}
            </span>
          ))}
        </div>
        <span ref={depthLabelRef} className="depth-label">
          0.0 m
        </span>
      </div>
    </>
  );
}
