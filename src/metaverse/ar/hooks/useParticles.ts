// ────────────────────────────────────────────────────────────
// src/metaverse/ar/hooks/useParticles.ts
// Pure Canvas2D particle system. No external dependencies.
// Controlled entirely by the ParticleConfig from ar_config.
// If config is undefined or config.image_url is empty → inactive.
// ────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { ParticleConfig } from '../../types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  size: number;
}

export function useParticles(config: ParticleConfig | undefined) {
  const active = !!(config?.enabled && config?.image_url);

  const stateRef = useRef<{
    particles: Particle[];
    sprite: HTMLImageElement | null;
    frameCount: number;
  }>({ particles: [], sprite: null, frameCount: 0 });

  // Load sprite image once when config.image_url changes
  useEffect(() => {
    if (!active || !config?.image_url) {
      stateRef.current.sprite = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = config.image_url;
    img.onload = () => { stateRef.current.sprite = img; };
    return () => { stateRef.current.sprite = null; };
  }, [config?.image_url, active]);

  /**
   * Spawn `n` particles radiating outward from (x, y).
   * Call this when a head-movement threshold is exceeded.
   */
  const triggerBurst = (x: number, y: number) => {
    if (!active || !stateRef.current.sprite) return;
    const n = config!.count ?? 15;
    const state = stateRef.current;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,  // slight upward bias
        alpha: 0.9 + Math.random() * 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        size: 14 + Math.random() * 22,
      });
    }
    // Keep array bounded
    const max = (config!.count ?? 15) * 5;
    if (state.particles.length > max) {
      state.particles = state.particles.slice(-max);
    }
  };

  /**
   * Call once per render frame AFTER drawing video and AR elements,
   * BEFORE drawing the marco overlay.
   * Handles both 'always' (random spawn) and 'movement' (burst-only) modes.
   */
  const drawFrame = (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
    const state = stateRef.current;
    if (!active || !state.sprite) return;

    state.frameCount++;

    // Auto-spawn for 'always' trigger mode
    if (config!.trigger === 'always' && state.frameCount % 18 === 0) {
      const n = Math.max(1, Math.ceil((config!.count ?? 15) / 4));
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 1.8;
        state.particles.push({
          x: Math.random() * cw,
          y: Math.random() * ch * 0.8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          alpha: 0.8 + Math.random() * 0.2,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.08,
          size: 10 + Math.random() * 18,
        });
      }
    }

    // Simulate + draw
    state.particles = state.particles.filter((p) => p.alpha > 0.03);

    for (const p of state.particles) {
      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;         // gravity
      p.alpha -= 0.016;
      p.rotation += p.rotSpeed;

      // Draw sprite
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.drawImage(state.sprite!, -p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  };

  return { active, triggerBurst, drawFrame };
}
