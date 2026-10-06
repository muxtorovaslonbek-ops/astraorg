import { useEffect, useRef } from 'react';

type Layer = { x: number; y: number; r: number; s: number; d: number; hue: number; flare: boolean };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number; len: number; hot: boolean };
type Warp = { x: number; y: number; z: number; pz: number; hue: number };

/**
 * mode undefined — calm page background: parallax stars, flares, many shooting stars.
 * mode "idle"    — intro before the user starts: slow flight through space.
 * mode "jump"    — intro playing: stars accelerate into a hyperspace jump.
 */
export function StarField({ mode }: { mode?: 'idle' | 'jump' }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const jumpStart = useRef<number | null>(null);
  modeRef.current = mode;

  useEffect(() => {
    if (mode === 'jump' && jumpStart.current === null) jumpStart.current = performance.now();
  }, [mode]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const style = getComputedStyle(canvas);
    const starColor = style.color || '#fff';
    let width = 0, height = 0, raf = 0, last = performance.now();
    let mx = 0, my = 0, smx = 0, smy = 0;

    const layers: Layer[] = Array.from({ length: 260 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.2, s: Math.random() * 6,
      d: Math.random() * 0.9 + 0.2, hue: [200, 190, 255, 45, 320][Math.floor(Math.random() * 5)] ?? 200,
      flare: Math.random() < 0.05,
    }));
    const warp: Warp[] = Array.from({ length: 420 }, () => ({ x: 0, y: 0, z: 0, pz: 0, hue: 200 }));
    const respawn = (w: Warp, far = false) => {
      const a = Math.random() * Math.PI * 2;
      const rad = Math.pow(Math.random(), 0.6) * 1.6 + 0.05;
      w.x = Math.cos(a) * rad; w.y = Math.sin(a) * rad;
      w.z = far ? 1 : Math.random(); w.pz = w.z;
      w.hue = [200, 210, 260, 190, 45][Math.floor(Math.random() * 5)] ?? 200;
    };
    warp.forEach((w) => respawn(w));
    const meteors: Meteor[] = [];

    const spawnMeteor = () => {
      if (meteors.length >= 7) return;
      const fromLeft = Math.random() > 0.35;
      const speed = Math.random() * 6 + 9;
      const ang = (Math.random() * 22 + 14) * Math.PI / 180;
      meteors.push({
        x: fromLeft ? -30 : width * (Math.random() * 0.6 + 0.3),
        y: Math.random() * height * 0.5 - 30,
        vx: Math.cos(ang) * speed * (fromLeft ? 1 : -1), vy: Math.sin(ang) * speed,
        life: 0, max: 60 + Math.random() * 60, len: 120 + Math.random() * 120, hot: Math.random() < 0.25,
      });
    };

    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    };
    resize();

    const drawLayers = (time: number) => {
      for (const s of layers) {
        const px = reduced ? 0 : smx * s.d * 26;
        const py = reduced ? 0 : smy * s.d * 26;
        const y = (((s.y * height + (reduced ? 0 : time * 0.006 * s.d) + py) % height) + height) % height;
        const x = (((s.x * width + px) % width) + width) % width;
        const tw = reduced ? 0.6 : 0.2 + (Math.sin(time / 900 * (0.5 + s.d) + s.s) + 1) * 0.38;
        ctx.globalAlpha = tw;
        ctx.fillStyle = s.r > 1 ? `hsl(${s.hue} 90% 80%)` : starColor;
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
        if (s.flare) {
          const f = (1 + Math.sin(time / 700 + s.s)) * 0.5;
          ctx.globalAlpha = tw * 0.7;
          ctx.strokeStyle = `hsl(${s.hue} 90% 85%)`; ctx.lineWidth = 0.8;
          const l = 5 + f * 9;
          ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x + l, y); ctx.moveTo(x, y - l); ctx.lineTo(x, y + l); ctx.stroke();
        }
      }
    };

    const drawMeteors = (dt: number, rate: number) => {
      if (!reduced && Math.random() < dt * rate) spawnMeteor();
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        if (!m) continue;
        m.x += m.vx * dt; m.y += m.vy * dt; m.life += dt;
        const fade = Math.min(1, m.life / 8) * Math.max(0, 1 - m.life / m.max);
        if (fade <= 0 || m.x < -240 || m.y > height + 240 || m.x > width + 240) { meteors.splice(i, 1); continue; }
        const k = m.len / (Math.hypot(m.vx, m.vy) || 1);
        const tx = m.x - m.vx * k, ty = m.y - m.vy * k;
        const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
        const core = m.hot ? '255,214,150' : '255,255,255';
        const tail = m.hot ? '255,160,90' : '150,215,255';
        grad.addColorStop(0, `rgba(${core},${0.95 * fade})`);
        grad.addColorStop(0.3, `rgba(${tail},${0.55 * fade})`);
        grad.addColorStop(1, `rgba(${tail},0)`);
        ctx.globalAlpha = 1; ctx.strokeStyle = grad; ctx.lineWidth = m.hot ? 2.4 : 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.shadowColor = `rgba(${tail},1)`; ctx.shadowBlur = 12;
        ctx.fillStyle = `rgba(${core},${fade})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.hot ? 2.4 : 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const drawWarp = (dt: number, speed: number, now: number) => {
      const cx = width / 2 + smx * 40, cy = height / 2 + smy * 40;
      const f = Math.max(width, height) * 0.55;
      const streak = 1 + speed * 14;
      for (const w of warp) {
        w.pz = w.z + speed * 0.012 * streak * dt * 0.5;
        w.z -= speed * 0.012 * dt;
        if (w.z <= 0.015) { respawn(w, true); continue; }
        const sx = cx + (w.x / w.z) * f * 0.35, sy = cy + (w.y / w.z) * f * 0.35;
        const px = cx + (w.x / Math.min(1.2, w.pz)) * f * 0.35, py = cy + (w.y / Math.min(1.2, w.pz)) * f * 0.35;
        if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) { respawn(w, true); continue; }
        const near = 1 - w.z;
        ctx.globalAlpha = Math.min(1, 0.25 + near * 1.1);
        ctx.strokeStyle = `hsl(${w.hue} 90% ${72 + near * 24}%)`;
        ctx.lineWidth = 0.5 + near * (1.2 + speed * 2.2);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      }
      if (speed > 0.35) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.5);
        g.addColorStop(0, `rgba(120,190,255,${0.22 * speed})`);
        g.addColorStop(0.35, `rgba(90,110,255,${0.1 * speed})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
      }
      void now;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) * 60; last = now;
      smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
      ctx.clearRect(0, 0, width, height);
      const m = modeRef.current;
      if (m === 'jump') {
        const t = (now - (jumpStart.current ?? now)) / 1000;
        // accelerate 0-2.6s, cruise, brake in the last second
        const speed = t < 2.6 ? Math.pow(t / 2.6, 2.2) : t > 5.4 ? Math.max(0.15, 1 - (t - 5.4) * 0.9) : 1;
        drawWarp(dt, Math.max(0.06, speed) * 3, now);
        drawMeteors(dt, 0);
      } else if (m === 'idle') {
        drawLayers(now);
        drawWarp(dt, 0.12, now);
        drawMeteors(dt, 0.025);
      } else {
        drawLayers(now);
        drawMeteors(dt, 0.04);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => { mx = e.clientX / width - 0.5; my = e.clientY / height - 0.5; };
    const onResize = () => { resize(); if (reduced) { ctx.clearRect(0, 0, width, height); drawLayers(0); ctx.globalAlpha = 1; } };
    if (reduced) { drawLayers(0); ctx.globalAlpha = 1; } else raf = requestAnimationFrame(frame);
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} className="star-field" aria-hidden="true" />;
}
