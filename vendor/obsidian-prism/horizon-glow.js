// Obsidian Prism — Brand Horizon Glow (2D renderer), vendored for DSH.
//
// Source: https://github.com/RMvdesi/obsidian-prism (ripple-core.js, upstream 1.0.8-beta.1)
// Copyright (c) 2026 RMvdesi and Obsidian Prism contributors.
// License: GPL-3.0-only (see LICENSE / NOTICE in this repository).
//
// Modified for DSH: the functions below are copied verbatim from upstream and
// re-wrapped in this module. The WebGL2 renderer, glyph field, ripple and
// spectrum-detection code paths are NOT included — this module only keeps the
// 2D horizon glow used behind the conversation. Modified: 2026-12-01.

(function (root, factory) {
  const api = factory()
  if (root) root.__agHorizonGlow = api
  if (typeof module === 'object' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict'

  function hash(a, b) {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function valueNoise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = hash(x0, y0) + (hash(x0 + 1, y0) - hash(x0, y0)) * sx;
    const bottom = hash(x0, y0 + 1) + (hash(x0 + 1, y0 + 1) - hash(x0, y0 + 1)) * sx;
    return top + (bottom - top) * sy;
  }
  function smooth(value) {
    const clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * (3 - 2 * clamped);
  }
  const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  function clampFinite(val, fallback, min, max) {
    const n = Number(val);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }
  function isCanvasDocHidden(canvas) {
    const owner = canvas && canvas.ownerDocument;
    if (owner && typeof owner.hidden === 'boolean') return owner.hidden;
    return typeof document !== 'undefined' && Boolean(document && document.hidden === true);
  }
  const DEFAULT_HORIZON_AURA = Object.freeze({
    reach: 0.47,
    prism: 0,
    surge: 0,
    speed: 1,
  });
  const HORIZON_PRISM_STOPS = [
    [66, 133, 244],
    [155, 114, 203],
    [234, 67, 53],
    [251, 188, 4],
    [92, 198, 252],
  ];
  // 白昼高透水彩棱镜折射五阶闭合光谱（Royal Cobalt #2563EB / Iris #7C3AED / Coral #EA4335 / Amber #D97706 / Cerulean #0284C7）
  const HORIZON_DAYLIGHT_STOPS = [
    [37, 99, 235],
    [124, 58, 237],
    [234, 67, 53],
    [217, 119, 6],
    [2, 132, 199],
  ];
  function horizonPrismRgb(t, out, dark = true) {
    const stops = dark === false ? HORIZON_DAYLIGHT_STOPS : HORIZON_PRISM_STOPS;
    let f = (t - Math.floor(t)) * 5;
    const i = Math.min(4, Math.floor(f));
    f = smooth(f - i);
    const a = stops[i];
    const b = stops[(i + 1) % 5];
    out[0] = a[0] + (b[0] - a[0]) * f;
    out[1] = a[1] + (b[1] - a[1]) * f;
    out[2] = a[2] + (b[2] - a[2]) * f;
    return out;
  }
  function createBrandHorizon2DRenderer(canvas) {
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return null;
    let image = null;
    let pixels = null;
    const prismRgb = [0, 0, 0];
    const surgeRgb = [0, 0, 0];
    const toneRgb = [0, 0, 0];
    function ensureImage(w, h) {
      if (!image || image.width !== w || image.height !== h) {
        image = ctx.createImageData(w, h);
        pixels = new Uint32Array(image.data.buffer);
      }
    }
    return {
      mode: '2d',
      build() {},
      clear() {
        if (typeof ctx.clearRect === 'function') {
          ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
        } else if (canvas.width > 0 && canvas.height > 0) {
          ensureImage(canvas.width, canvas.height);
          pixels.fill(0);
          ctx.putImageData(image, 0, 0);
        }
      },
      draw(w, h, dpr, timeSec, dark, intensity, presence, reach = DEFAULT_HORIZON_AURA.reach, prism = 0, surge = 0, speed = 1, spectrumCode = 0, semanticCode = 0) {
        if (!w || !h) return;
        ensureImage(w, h);
        pixels.fill(0);
        const rEff = Math.max(0.01, reach);
        const stretchScale = 1 + 0.08 * (speed - 1);
        const surgeUp = Math.max(0, surge);
        const effPrism = spectrumCode === 5 ? prism * 0.28 : prism;
        const hasPrism = effPrism > 0.0001;
        const hasSurge = Math.abs(surge) > 0.0001;
        const customMode = spectrumCode > 0 || semanticCode > 0;
        const cssW = w / Math.max(0.5, dpr);
        const cssH = h / Math.max(0.5, dpr);
        const step = Math.max(1, Math.round(dpr));
        const effPresL = dark ? presence : Math.pow(Math.max(0, Math.min(1, presence)), 0.68);
        const washGainL = dark ? 1 : (1.02 + 0.60 * Math.max(0, Math.min(1, intensity)));
        const darkBreathMod = dark ? (0.68 + 0.56 * Math.max(0, Math.min(1, intensity))) : 1;
        for (let py = 0; py < h; py += step) {
          const uvY = 1 - py / h;
          const yNorm = uvY / rEff;
          if (yNorm > 1.48 + 0.25 * surgeUp) continue;
          const persp = 1 / (0.55 + uvY);
          const gyBase = cssH * Math.log(0.55 + uvY);
          for (let px = 0; px < w; px += step) {
            const uvX = px / w;
            const cssX = px / Math.max(0.5, dpr);
            const waveA = Math.sin(uvX * 5.2 - timeSec * 0.68);
            const waveB = Math.sin(uvX * 8.6 + timeSec * 0.46 + 1.4);
            const curtain = 0.5 + 0.32 * waveA + 0.18 * waveB;
            const jut = (valueNoise(cssX / 220 + timeSec * 0.18, timeSec * 0.11) - 0.5) * 0.68 + (waveA * 0.65 + waveB * 0.35) * 0.24;
            const hJut = Math.max(0, yNorm + 0.25 * stretchScale * jut);
            const edgeFade = (uvX < 0.3 ? 0.35 + 0.65 * smooth(uvX / 0.3) : uvX > 0.7 ? 0.35 + 0.65 * smooth((1 - uvX) / 0.3) : 1);
            const gVal = Math.exp(-hJut * hJut * 4.0) * (0.76 + 0.42 * curtain) * edgeFade;
            let field = dark
              ? Math.min(1, gVal * 1.12 * darkBreathMod * presence)
              : Math.min(1, gVal * 1.12);
            if (!hasSurge && (dark ? field < 0.008 : field * effPresL < 0.008)) continue;
            const mixSky = 0.5 + 0.5 * Math.sin(uvX * 3.2 + timeSec * 0.48);
            const pPhase = uvX * 1.18 - timeSec * 0.18 + 0.28 * valueNoise(uvX * 3.1 + 1.7, yNorm * 1.6 - timeSec * 0.12) + 0.14 * yNorm;
            let baseR;
            let baseG;
            let baseB;
            let dotR = 0;
            let dotG = 0;
            let dotB = 0;
            if (dark) {
              if (customMode) {
                sampleHorizonTone2D(spectrumCode, semanticCode, true, uvX * 0.8 + timeSec * 0.12, toneRgb);
                baseR = toneRgb[0];
                baseG = toneRgb[1];
                baseB = toneRgb[2];
              } else {
                baseR = 49 + (92 - 49) * mixSky;
                baseG = 134 + (198 - 134) * mixSky;
                baseB = 255 + (252 - 255) * mixSky;
              }
            } else if (customMode) {
              sampleHorizonTone2D(spectrumCode, semanticCode, false, pPhase, prismRgb);
              sampleHorizonTone2D(spectrumCode, semanticCode, false, uvX * 0.5 + timeSec * 0.08, toneRgb);
              const causticsL = 0.48 + 0.52 * smooth((jut + 0.24) / 0.5);
              const dichroicW = Math.min(0.94, (0.48 + 0.46 * effPrism) * (0.58 + 0.42 * causticsL));
              baseR = toneRgb[0] + (prismRgb[0] - toneRgb[0]) * dichroicW;
              baseG = toneRgb[1] + (prismRgb[1] - toneRgb[1]) * dichroicW;
              baseB = toneRgb[2] + (prismRgb[2] - toneRgb[2]) * dichroicW;
              const dotMix = Math.min(0.9, 0.26 + effPrism * 0.64);
              dotR = toneRgb[0] * 0.86 * (1 - dotMix) + prismRgb[0] * 0.92 * dotMix;
              dotG = toneRgb[1] * 0.86 * (1 - dotMix) + prismRgb[1] * 0.92 * dotMix;
              dotB = toneRgb[2] * 0.86 * (1 - dotMix) + prismRgb[2] * 0.92 * dotMix;
            } else {
              // 白昼高透水彩棱镜折射（2D 分支镜像：Royal Cobalt #2563EB + 四色宝石彩墨，零泛白）
              horizonPrismRgb(pPhase, prismRgb, false);
              const cobR = 37 + (2 - 37) * mixSky;
              const cobG = 99 + (132 - 99) * mixSky;
              const cobB = 235 + (199 - 235) * mixSky;
              const causticsL = 0.48 + 0.52 * smooth((jut + 0.24) / 0.5);
              const dichroicW = Math.min(0.94, (0.48 + 0.46 * prism) * (0.58 + 0.42 * causticsL));
              baseR = cobR + (prismRgb[0] - cobR) * dichroicW;
              baseG = cobG + (prismRgb[1] - cobG) * dichroicW;
              baseB = cobB + (prismRgb[2] - cobB) * dichroicW;
              const dotMix = Math.min(0.9, 0.26 + prism * 0.64);
              dotR = 32 * (1 - dotMix) + prismRgb[0] * 0.92 * dotMix;
              dotG = 85 * (1 - dotMix) + prismRgb[1] * 0.92 * dotMix;
              dotB = 202 * (1 - dotMix) + prismRgb[2] * 0.92 * dotMix;
            }
            let dotBoost = 0;
            if (hasPrism || hasSurge) {
              if (dark && hasPrism) {
                sampleHorizonTone2D(spectrumCode, semanticCode, true, pPhase + 0.18, prismRgb);
                const wing = smooth((field - 0.04) / 0.32) * (1 - 0.5 * smooth((field - 0.68) / 0.28));
                const caustics = 0.52 + 0.48 * smooth((jut + 0.24) / 0.5);
                const wPrism = Math.min(0.68, effPrism * 1.2 * wing * caustics);
                baseR += (prismRgb[0] - baseR) * wPrism;
                baseG += (prismRgb[1] - baseG) * wPrism;
                baseB += (prismRgb[2] - baseB) * wPrism;
              }
              if (surge > 0.0001) {
                const sp = Math.min(1, surge);
                const sEnv = Math.sin(sp * Math.PI) * (1 - 0.32 * sp);
                const xRel = (uvX - 0.5) * 2;
                const xSpan = smooth(uvX / 0.22) * (1 - smooth((uvX - 0.78) / 0.22));
                const frontY = 1.15 * (1 - Math.pow(1 - sp, 1.45)) - 0.15 * xRel * xRel + 0.06 * jut;
                const dy = yNorm - frontY;
                const arc = (dy >= 0 ? Math.exp(-dy * dy * 24) : Math.exp(-dy * dy * 5.2)) * sEnv * xSpan;
                field = Math.min(1, field + arc * 0.52 * (dark ? presence : 1));
                sampleHorizonTone2D(spectrumCode, semanticCode, dark, pPhase + dy * 1.3 - sp * 0.35, surgeRgb);
                const leadR = customMode ? surgeRgb[0] : (dark ? 92 : 37);
                const leadG = customMode ? surgeRgb[1] : (dark ? 198 : 99);
                const leadB = customMode ? surgeRgb[2] : (dark ? 252 : 235);
                const sr = leadR * 0.34 + surgeRgb[0] * 0.66;
                const sg = leadG * 0.34 + surgeRgb[1] * 0.66;
                const sb = leadB * 0.34 + surgeRgb[2] * 0.66;
                const wArc = Math.min(0.88, arc * 0.82);
                baseR += (sr - baseR) * wArc;
                baseG += (sg - baseG) * wArc;
                baseB += (sb - baseB) * wArc;
                dotBoost += arc * 0.58 * (dark ? presence : 1);
              } else if (surge < -0.0001) {
                const cp = Math.min(1, -surge);
                const cEnv = Math.sin(cp * Math.PI) * (1 - 0.28 * cp);
                const rx = Math.abs(uvX - 0.5);
                const ringR = 0.04 + 0.43 * (1 - Math.pow(1 - cp, 1.35));
                const dr = (rx - ringR) / 0.135;
                const hRip = Math.exp(-dr * dr) + 0.32 * (1 - cp) * expClamp(rx * rx * 18);
                const setY = 0.70 * Math.pow(1 - cp, 1.35) + 0.04;
                const dsy = yNorm - setY;
                const vSet = Math.exp(-dsy * dsy * 13.5) * (1 - smooth((yNorm - 1.05) / 0.3));
                const chime = hRip * vSet * cEnv;
                field = Math.min(1, field + chime * 0.46 * (dark ? presence : 1));
                sampleHorizonTone2D(spectrumCode, semanticCode, dark, uvX * 1.5 + rx * 2 - cp * 0.35, surgeRgb);
                const cr = customMode ? surgeRgb[0] : (dark ? (214 * 0.78 + surgeRgb[0] * 0.22) : (2 * 0.55 + surgeRgb[0] * 0.45));
                const cg = customMode ? surgeRgb[1] : (dark ? (238 * 0.78 + surgeRgb[1] * 0.22) : (132 * 0.55 + surgeRgb[1] * 0.45));
                const cb = customMode ? surgeRgb[2] : (dark ? (255 * 0.78 + surgeRgb[2] * 0.22) : (199 * 0.55 + surgeRgb[2] * 0.45));
                const wChime = Math.min(0.88, chime * 0.84);
                baseR += (cr - baseR) * wChime;
                baseG += (cg - baseG) * wChime;
                baseB += (cb - baseB) * wChime;
                dotBoost += chime * 0.42 * (dark ? presence : 1);
              }
            }
            if (dark ? field < 0.008 : field * effPresL < 0.008) continue;
            const gx = (cssX - cssW * 0.5) * persp;
            const gy = gyBase + 10 * Math.sin(gx * 0.007 + timeSec * 0.42) - timeSec * 1.4;
            const cellX = gx / 7 - Math.floor(gx / 7) - 0.5;
            const cellY = gy / 7 - Math.floor(gy / 7) - 0.5;
            const dist = Math.sqrt(cellX * cellX + cellY * cellY);
            const band = Math.min(1, smooth((field - 0.25) / 0.25) * (1 - smooth((field - 0.72) / 0.26)) + dotBoost);
            let fillA;
            let dotA;
            let R;
            let G;
            let B;
            if (dark) {
              dotA = dist < 0.26 ? (1 - smooth((dist - 0.12) / 0.14)) * band * 0.65 : 0;
              fillA = field * 0.48;
              const dLift = spectrumCode === 5 ? 36 : 56;
              R = Math.round(Math.min(255, Math.max(0, baseR + dotA * (spectrumCode === 5 ? 36 : 72)))) & 255;
              G = Math.round(Math.min(255, Math.max(0, baseG + dotA * dLift))) & 255;
              B = Math.round(Math.min(255, Math.max(0, baseB + dotA * (spectrumCode === 5 ? 38 : 24)))) & 255;
            } else {
              fillA = Math.min(0.84, field * 0.66 * washGainL * effPresL);
              dotA = dist < 0.24 ? Math.min(0.88, (1 - smooth((dist - 0.14) / 0.1)) * band * (0.52 + 0.44 * Math.sqrt(fillA)) * effPresL) : 0;
              const hotL = 0.24 * smooth((field - 0.65) / 0.35);
              const ancR = customMode ? baseR * 0.85 : 46;
              const ancG = customMode ? baseG * 0.85 : 92;
              const ancB = customMode ? baseB * 0.85 : 235;
              const inkR = baseR * (1 - hotL) + ancR * hotL;
              const inkG = baseG * (1 - hotL) + ancG * hotL;
              const inkB = baseB * (1 - hotL) + ancB * hotL;
              const compA = fillA + dotA * (1 - fillA);
              if (compA <= 0.002) continue;
              const wFill = (fillA * (1 - dotA)) / compA;
              const wDot = dotA / compA;
              R = Math.round(Math.min(255, Math.max(0, inkR * wFill + dotR * wDot))) & 255;
              G = Math.round(Math.min(255, Math.max(0, inkG * wFill + dotG * wDot))) & 255;
              B = Math.round(Math.min(255, Math.max(0, inkB * wFill + dotB * wDot))) & 255;
            }
            const outA = Math.max(0, Math.min(1, fillA + dotA * (1 - fillA)));
            const A = Math.round(outA * 255) & 255;
            if (A === 0) continue;
            const packed = LITTLE_ENDIAN ? ((A << 24) | (B << 16) | (G << 8) | R) >>> 0 : ((R << 24) | (G << 16) | (B << 8) | A) >>> 0;
            for (let sy = 0; sy < step && py + sy < h; sy++) {
              const rowOff = (py + sy) * w + px;
              for (let sx = 0; sx < step && px + sx < w; sx++) {
                pixels[rowOff + sx] = packed;
              }
            }
          }
        }
        ctx.putImageData(image, 0, 0);
      },
      dispose() {},
    };
  }
  function expClamp(v) {
    return v > 40 ? 0 : Math.exp(-v);
  }

  /**
   * Mount the 2D horizon glow on a canvas. Mirrors the adapter surface the
   * upstream conversation-aura controller expects, minus the WebGL path.
   */
  function mount(canvas) {
    const renderer = createBrandHorizon2DRenderer(canvas)
    const state = { cssW: 0, cssH: 0, dpr: 0 }

    function resize(w, h, dpr) {
      const nw = Math.max(0, Math.round(Number(w) || 0))
      const nh = Math.max(0, Math.round(Number(h) || 0))
      const nd = Math.max(0.5, Math.min(1.75, Number(dpr) || 1))
      if (!nw || !nh) return false
      if (nw === state.cssW && nh === state.cssH && nd === state.dpr) return true
      state.cssW = nw
      state.cssH = nh
      state.dpr = nd
      canvas.width = Math.max(1, Math.round(nw * nd))
      canvas.height = Math.max(1, Math.round(nh * nd))
      return true
    }

    return {
      mode: renderer ? '2d' : 'none',
      resize,
      clear() {
        if (renderer) renderer.clear()
      },
      draw(timeSec, dark, intensity, presence, reach) {
        if (!renderer || !canvas.width || !canvas.height) return false
        if (typeof document !== 'undefined' && document.hidden) return false
        renderer.draw(
          canvas.width,
          canvas.height,
          state.dpr,
          timeSec,
          dark,
          intensity,
          presence,
          reach === undefined ? DEFAULT_HORIZON_AURA.reach : reach,
        )
        return true
      },
      dispose() {},
    }
  }

  return { mount, DEFAULT_HORIZON_AURA }
})
