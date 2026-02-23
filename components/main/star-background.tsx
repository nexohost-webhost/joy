"use client";

import { useEffect, useRef } from "react";

/**
 * Professional cinematic star background — Canvas 2D.
 * Clean, minimal star field with realistic depth, colour temperature,
 * soft nebula glow, and rare elegant shooting stars.
 * Works on all hardware (no WebGL required).
 */

// ── Star colour palette (realistic stellar temperatures) ──────────────
const STAR_COLORS = [
  { r: 255, g: 255, b: 255 }, // White (main‑sequence)
  { r: 210, g: 220, b: 255 }, // Blue‑white (hot)
  { r: 170, g: 190, b: 255 }, // Blue (very hot)
  { r: 255, g: 240, b: 220 }, // Warm white
  { r: 255, g: 220, b: 180 }, // Yellow‑white
  { r: 200, g: 160, b: 255 }, // Soft purple accent
];

// ── Types ─────────────────────────────────────────────────────────────
interface Star {
  /** Position expressed as 0‑1 fraction of canvas so resize is free */
  nx: number;
  ny: number;
  /** 0 = farthest, 1 = nearest */
  depth: number;
  /** Base radius in CSS‑px */
  radius: number;
  /** Base max opacity */
  maxOpacity: number;
  /** Twinkle frequency & phase */
  twinkleFreq: number;
  twinklePhase: number;
  /** RGB colour */
  color: { r: number; g: number; b: number };
  /** Whether star gets a soft glow halo */
  hasGlow: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  active: boolean;
}

// ── Nebula cloud positions (normalised) ───────────────────────────────
interface NebulaCloud {
  nx: number;
  ny: number;
  radiusFactor: number; // fraction of min(w,h)
  r: number;
  g: number;
  b: number;
  baseAlpha: number;
}

const NEBULA_CLOUDS: NebulaCloud[] = [
  { nx: 0.15, ny: 0.25, radiusFactor: 0.35, r: 60, g: 30, b: 120, baseAlpha: 0.04 },
  { nx: 0.8, ny: 0.6, radiusFactor: 0.30, r: 20, g: 50, b: 100, baseAlpha: 0.035 },
  { nx: 0.5, ny: 0.85, radiusFactor: 0.25, r: 80, g: 20, b: 80, baseAlpha: 0.03 },
];

// ── Component ─────────────────────────────────────────────────────────
export const StarsCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // DPR‑aware sizing
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const applySize = () => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    applySize();

    // ── Generate stars ──────────────────────────────────────────────
    // Three layers: far (tiny/dim), mid, near (bright)
    const LAYER_CONFIG: { count: number; depthMin: number; depthMax: number; sizeMin: number; sizeMax: number; opacityMin: number; opacityMax: number; glowChance: number }[] = [
      { count: 90, depthMin: 0.0, depthMax: 0.3, sizeMin: 0.3, sizeMax: 0.7, opacityMin: 0.15, opacityMax: 0.35, glowChance: 0 },
      { count: 55, depthMin: 0.3, depthMax: 0.7, sizeMin: 0.6, sizeMax: 1.2, opacityMin: 0.3, opacityMax: 0.6, glowChance: 0.15 },
      { count: 25, depthMin: 0.7, depthMax: 1.0, sizeMin: 1.0, sizeMax: 1.8, opacityMin: 0.55, opacityMax: 0.9, glowChance: 0.5 },
    ];

    const stars: Star[] = [];

    for (const layer of LAYER_CONFIG) {
      for (let i = 0; i < layer.count; i++) {
        const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        stars.push({
          nx: Math.random(),
          ny: Math.random(),
          depth: layer.depthMin + Math.random() * (layer.depthMax - layer.depthMin),
          radius: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
          maxOpacity: layer.opacityMin + Math.random() * (layer.opacityMax - layer.opacityMin),
          twinkleFreq: 0.003 + Math.random() * 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
          hasGlow: Math.random() < layer.glowChance,
        });
      }
    }

    // ── Shooting stars ──────────────────────────────────────────────
    const shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2; // mostly diagonal
      const speed = 3 + Math.random() * 3;
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 60 + Math.random() * 60,
        life: 1,
        maxLife: 1,
        active: true,
      });
    };

    // Rare — every 6‑12 s
    const shootingInterval = setInterval(() => {
      if (shootingStars.length < 1 && Math.random() > 0.4) {
        spawnShootingStar();
      }
    }, 6000 + Math.random() * 6000);

    // ── Animation loop ──────────────────────────────────────────────
    let t = 0;

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, width, height);

      // ── Nebula glow ───────────────────────────────────────────
      for (const cloud of NEBULA_CLOUDS) {
        const cx = cloud.nx * width;
        const cy = cloud.ny * height;
        const r = cloud.radiusFactor * Math.min(width, height);
        // Gentle breathing
        const breathe = Math.sin(t * 0.001 + cloud.nx * 10) * 0.3 + 0.7;
        const alpha = cloud.baseAlpha * breathe;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${cloud.r},${cloud.g},${cloud.b},${alpha})`);
        grad.addColorStop(0.6, `rgba(${cloud.r},${cloud.g},${cloud.b},${alpha * 0.3})`);
        grad.addColorStop(1, `rgba(${cloud.r},${cloud.g},${cloud.b},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Stars ─────────────────────────────────────────────────
      for (const star of stars) {
        // Smooth twinkle
        const twinkle = Math.sin(t * star.twinkleFreq + star.twinklePhase);
        const twinkleNorm = twinkle * 0.5 + 0.5; // 0‑1
        const opacity = star.maxOpacity * (0.5 + twinkleNorm * 0.5);
        const radius = star.radius * (0.85 + twinkleNorm * 0.15);

        // Very subtle parallax drift
        const px = Math.sin(t * 0.00015 * (1 + star.depth)) * 1.5 * star.depth;
        const py = Math.cos(t * 0.0001 * (1 + star.depth)) * 1.0 * star.depth;

        const x = ((star.nx * width + px) % width + width) % width;
        const y = ((star.ny * height + py) % height + height) % height;

        const { r, g, b } = star.color;

        // Soft glow halo for select brighter stars
        if (star.hasGlow) {
          const glowRadius = radius * 5;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
          glow.addColorStop(0, `rgba(${r},${g},${b},${opacity * 0.25})`);
          glow.addColorStop(0.4, `rgba(${r},${g},${b},${opacity * 0.08})`);
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Star point
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Shooting stars ────────────────────────────────────────
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) {
          shootingStars.splice(i, 1);
          continue;
        }

        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.008;
        if (s.life <= 0 || s.x > width + 150 || s.y > height + 150) {
          s.active = false;
          continue;
        }

        const alpha = Math.max(0, s.life);
        const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.length;
        const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.length;

        // Trail gradient
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.5, `rgba(180,200,255,${alpha * 0.25})`);
        grad.addColorStop(1, `rgba(255,255,255,${alpha * 0.9})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Bright head dot
        const headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 3);
        headGlow.addColorStop(0, `rgba(255,255,255,${alpha})`);
        headGlow.addColorStop(1, `rgba(180,200,255,0)`);
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    // ── Resize handler ──────────────────────────────────────────────
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      applySize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(shootingInterval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="w-full h-auto fixed inset-0 -z-10">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "transparent",
        }}
      />
    </div>
  );
};
