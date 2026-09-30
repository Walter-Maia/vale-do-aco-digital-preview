/* movimento-fx.js — efeitos-assinatura das webzinhas do index "movimento" (proposta do designer, 25/09/2026).
   fxCanvas: laço comum (DPR, resize, pausa fora da tela e em aba oculta, teto de fps).
   initAsciiSpiral (OneX), initFiber (BR net), initGlobe (Siteflux), initPixelBuild (AR-WEB), initWatch (Servicom).
   No fim, window.VAD_CASE_FX registra, por id de empresa, a função que movimento.js chama ao abrir a webzinha. */

function fxCanvas(canvas, o, make) {
  'use strict';
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, raf = 0, last = 0, t = 0, running = false, inView = true, api = null;
  var fps = o.fps || 30;

  function layout() {
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    var dpr = Math.min(W < 600 ? 1.5 : 2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (api && api.resize) { api.resize(W, H, dpr); }
    if (running && api) { api.draw(ctx, W, H, t, 0); }          // sem "piscar" ao redimensionar
  }
  function frame(now) {
    raf = 0;
    if (!running || !inView || document.hidden) { return; }
    var dt = Math.min(100, now - last);
    if (dt < 1000 / fps - 1) { raf = requestAnimationFrame(frame); return; }
    last = now; t += dt / 1000;
    api.draw(ctx, W, H, t, dt / 1000);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (running && inView && !document.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function halt() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function onVis() { if (document.hidden) { halt(); } else { kick(); } }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (e) { inView = e[0].isIntersecting; if (inView) { kick(); } else { halt(); } }) : null;
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { layout(); }) : null;
  if (io) { io.observe(canvas); }
  if (ro) { ro.observe(canvas); } else { window.addEventListener('resize', layout); }
  document.addEventListener('visibilitychange', onVis);

  api = make(ctx, canvas, o);
  layout();
  return {
    start: function () { running = true; kick(); },
    stop: function () { running = false; halt(); ctx.clearRect(0, 0, W, H); },
    still: function () { layout(); api.draw(ctx, W, H, 0.001, 0); },      // um quadro parado (reduced motion)
    destroy: function () {
      this.stop();
      if (io) { io.disconnect(); }
      if (ro) { ro.disconnect(); } else { window.removeEventListener('resize', layout); }
      document.removeEventListener('visibilitychange', onVis);
      if (api.destroy) { api.destroy(); }
    }
  };
}

/* ---------- OneX: espiral logarítmica desenhada em caracteres; a crista fica laranja ---------- */
function initAsciiSpiral(canvas, opts) {
  'use strict';
  var o = {
    chars: ' ·:-=+x#', color: '228,224,219', accent: '242,138,27',
    arms: 2, twist: 0.55, speed: 0.35, follow: true, fps: 24, cell: 0,
    font: 'ui-monospace, "SF Mono", Menlo, Consolas, "Roboto Mono", monospace'
  };
  for (var k in opts) { if (opts.hasOwnProperty(k) && opts[k] !== undefined) { o[k] = opts[k]; } }
  var glyphs = o.chars.split(''), n = glyphs.length;

  return fxCanvas(canvas, o, function (ctx, cv) {
    var cell = 16, cols = 0, rows = 0, prev = null, sprites = [];
    var cx = 0, cy = 0, tx = -1, ty = -1;

    function sprite(ch, rgb, dpr) {
      var c = document.createElement('canvas'), g = c.getContext('2d');
      c.width = c.height = Math.ceil(cell * dpr);
      g.scale(dpr, dpr);
      g.font = '400 ' + Math.round(cell * 0.9) + 'px ' + o.font;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(' + rgb + ',0.9)';
      g.fillText(ch, cell / 2, cell / 2 + 1);
      return c;
    }
    function makeSprites(dpr) {
      sprites = [];
      for (var i = 0; i < n; i++) { sprites.push([sprite(glyphs[i], o.color, dpr), sprite(glyphs[i], o.accent, dpr)]); }
    }
    function resize(W, H, dpr) {
      cell = o.cell || (W < 600 ? 12 : W < 1200 ? 14 : 16);
      cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
      prev = new Int16Array(cols * rows); for (var p = 0; p < prev.length; p++) { prev[p] = -1; }
      cx = W / 2; cy = H / 2;
      makeSprites(dpr);
    }
    function onMove(e) { var r = cv.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }
    function onLeave() { tx = -1; ty = -1; }
    if (o.follow) { cv.parentNode.addEventListener('pointermove', onMove); cv.parentNode.addEventListener('pointerleave', onLeave); }

    function draw(ctx, W, H, t, dt) {
      var gx = tx >= 0 ? tx : W / 2 + Math.sin(t * 0.13) * W * 0.08;
      var gy = ty >= 0 ? ty : H / 2 + Math.cos(t * 0.11) * H * 0.08;
      var f = 1 - Math.exp(-dt * 2.5);
      cx += (gx - cx) * f; cy += (gy - cy) * f;

      var rmax = Math.hypot(W, H) * 0.55 / cell, ph = t * o.speed, k = 5.5 * o.twist;
      var ccx = cx / cell, ccy = cy / cell;
      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var dx = i + 0.5 - ccx, dy = j + 0.5 - ccy;
          var r = Math.sqrt(dx * dx + dy * dy) + 0.5;
          var v = 0.5 + 0.5 * Math.sin(o.arms * Math.atan2(dy, dx) + k * Math.log(r) - ph);
          v *= Math.max(0, 1 - r / rmax);
          var idx = Math.round(v * (n - 1));
          var code = idx * 2 + (v > 0.93 ? 1 : 0);
          var p = j * cols + i;
          if (prev[p] === code) { continue; }
          prev[p] = code;
          ctx.clearRect(i * cell, j * cell, cell, cell);
          if (idx > 0) { ctx.drawImage(sprites[idx][code & 1], i * cell, j * cell, cell, cell); }
        }
      }
    }
    return {
      draw: draw, resize: resize,
      destroy: function () { if (o.follow) { cv.parentNode.removeEventListener('pointermove', onMove); cv.parentNode.removeEventListener('pointerleave', onLeave); } }
    };
  });
}

/* ---------- BR net: feixe de fios que convergem no centro; pulsos correm por eles ---------- */
function initFiber(canvas, opts) {
  'use strict';
  var o = { strands: 18, samples: 120, color: '13,14,19', accent: '229,32,27', lineAlpha: 0.14, fps: 30 };
  for (var k in opts) { if (opts.hasOwnProperty(k) && opts[k] !== undefined) { o[k] = opts[k]; } }

  return fxCanvas(canvas, o, function () {
    var S = [], off = null, offW = 0, offH = 0;
    function bez(p0, p1, p2, p3, u) {
      var m = 1 - u, a = m * m * m, b = 3 * m * m * u, c = 3 * m * u * u, d = u * u * u;
      return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
    }
    function resize(W, H, dpr) {
      S = [];
      for (var i = 0; i < o.strands; i++) {
        var y0 = H * (0.12 + 0.76 * Math.random()), y1 = H * (0.12 + 0.76 * Math.random());
        var j = (i / (o.strands - 1) - 0.5) * H * 0.16;
        var p0 = [-20, y0], p1 = [W * 0.42, H / 2 + j], p2 = [W * 0.58, H / 2 + j], p3 = [W + 20, y1];
        var pts = [];
        for (var s = 0; s <= o.samples; s++) { pts.push(bez(p0, p1, p2, p3, s / o.samples)); }
        S.push({ pts: pts, p: -Math.random() * 1.5, v: 0.22 + Math.random() * 0.33, len: 6 + ((Math.random() * 6) | 0) });
      }
      off = document.createElement('canvas'); offW = W; offH = H;
      off.width = Math.round(W * dpr); off.height = Math.round(H * dpr);
      var g = off.getContext('2d'); g.scale(dpr, dpr);
      g.strokeStyle = 'rgba(' + o.color + ',' + o.lineAlpha + ')'; g.lineWidth = 1;
      S.forEach(function (st) {
        g.beginPath(); g.moveTo(st.pts[0][0], st.pts[0][1]);
        for (var q = 1; q < st.pts.length; q++) { g.lineTo(st.pts[q][0], st.pts[q][1]); }
        g.stroke();
      });
    }
    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      if (off) { ctx.drawImage(off, 0, 0, offW, offH); }
      ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      S.forEach(function (st) {
        st.p += st.v * dt;
        if (st.p > 1.15) { st.p = -0.2 - Math.random() * 1.6; st.v = 0.22 + Math.random() * 0.33; }
        var head = Math.round(st.p * o.samples);
        for (var q = 1; q <= st.len; q++) {
          var a = head - q, b = a + 1;
          if (a < 0 || b > o.samples) { continue; }
          ctx.strokeStyle = 'rgba(' + o.accent + ',' + (1 - (q - 1) / st.len).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(st.pts[a][0], st.pts[a][1]); ctx.lineTo(st.pts[b][0], st.pts[b][1]); ctx.stroke();
        }
      });
    }
    return { draw: draw, resize: resize };
  });
}

/* ---------- Siteflux: globo em arame; o lado de trás fica mais fraco; a inclinação segue o ponteiro ---------- */
function initGlobe(canvas, opts) {
  'use strict';
  var o = { color: '228,224,219', meridians: 12, parallels: 7, speed: 0.12, tilt: 0.35, steps: 48, fps: 30 };
  for (var k in opts) { if (opts.hasOwnProperty(k) && opts[k] !== undefined) { o[k] = opts[k]; } }

  return fxCanvas(canvas, o, function (ctx, cv) {
    var ry = 0, tilt = o.tilt, tiltTarget = o.tilt, lines = [];
    for (var m = 0; m < o.meridians; m++) {
      var phi = Math.PI * m / o.meridians, pts = [];
      for (var s = 0; s <= o.steps; s++) {
        var th = 2 * Math.PI * s / o.steps;
        pts.push([Math.sin(th) * Math.cos(phi), Math.cos(th), Math.sin(th) * Math.sin(phi)]);
      }
      lines.push(pts);
    }
    for (var p = 1; p <= o.parallels; p++) {
      var lat = Math.PI * p / (o.parallels + 1), r = Math.sin(lat), y = Math.cos(lat), pp = [];
      for (var q = 0; q <= o.steps; q++) { var a = 2 * Math.PI * q / o.steps; pp.push([r * Math.cos(a), y, r * Math.sin(a)]); }
      lines.push(pp);
    }
    function onMove(e) { var b = cv.getBoundingClientRect(); tiltTarget = o.tilt + ((e.clientY - b.top) / b.height - 0.5) * 0.6; }
    function onLeave() { tiltTarget = o.tilt; }
    cv.parentNode.addEventListener('pointermove', onMove);
    cv.parentNode.addEventListener('pointerleave', onLeave);

    function draw(ctx, W, H, t, dt) {
      ry += o.speed * dt; tilt += (tiltTarget - tilt) * Math.min(1, dt * 3);
      var R = Math.min(W, H) * 0.36, cx = W / 2, cy = H / 2;
      var cyy = Math.cos(ry), sy = Math.sin(ry), ct = Math.cos(tilt), st = Math.sin(tilt);
      ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
      lines.forEach(function (pts) {
        var prev = null;
        pts.forEach(function (v) {
          var x = v[0] * cyy + v[2] * sy, z = -v[0] * sy + v[2] * cyy;
          var yy = v[1] * ct - z * st; z = v[1] * st + z * ct;
          var P = [cx + x * R, cy + yy * R, z];
          if (prev) {
            ctx.strokeStyle = 'rgba(' + o.color + ',' + (0.1 + 0.55 * (z + 1) / 2).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
          }
          prev = P;
        });
      });
      ctx.strokeStyle = 'rgba(' + o.color + ',0.5)';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    }
    return {
      draw: draw,
      destroy: function () { cv.parentNode.removeEventListener('pointermove', onMove); cv.parentNode.removeEventListener('pointerleave', onLeave); }
    };
  });
}

/* ---------- AR-WEB: amostra a logo numa grade grossa e a acende célula a célula, segura, dissolve e recomeça ---------- */
function initPixelBuild(canvas, opts) {
  'use strict';
  var o = { src: '', cols: 44, color: '255,255,255', build: 1.6, hold: 2.4, fade: 0.8, width: 0.6, fps: 24 };
  for (var k in opts) { if (opts.hasOwnProperty(k) && opts[k] !== undefined) { o[k] = opts[k]; } }

  return fxCanvas(canvas, o, function () {
    var map = null, rows = 0, on = [], img = new Image();
    function index() { on = []; for (var p = 0; p < map.length; p++) { if (map[p]) { on.push(p); } } }
    function fallback() {
      rows = 9; map = new Uint8Array(o.cols * rows);
      for (var j = 0; j < rows; j++) { for (var i = 0; i < o.cols; i++) { map[j * o.cols + i] = ((i + j) % 6 < 3) ? 1 : 0; } }
      index();
    }
    img.onload = function () {
      try {
        rows = Math.max(1, Math.round(o.cols * img.naturalHeight / img.naturalWidth));
        var c = document.createElement('canvas'); c.width = o.cols; c.height = rows;
        var g = c.getContext('2d'); g.drawImage(img, 0, 0, o.cols, rows);
        var d = g.getImageData(0, 0, o.cols, rows).data;
        map = new Uint8Array(o.cols * rows);
        for (var p = 0; p < map.length; p++) { map[p] = d[p * 4 + 3] > 110 ? 1 : 0; }
        index();
      } catch (e) { fallback(); }
    };
    img.onerror = fallback;
    if (o.src) { img.src = o.src; } else { fallback(); }

    function draw(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      if (!map) { return; }
      var cw = W * o.width / o.cols, gx = (W - cw * o.cols) / 2, gy = (H - cw * rows) / 2;
      var cycle = o.build + o.hold + o.fade, ph = t % cycle, N = on.length;
      ctx.fillStyle = 'rgba(' + o.color + ',0.08)';
      for (var j = 0; j < rows; j++) { for (var i = 0; i < o.cols; i++) { ctx.fillRect(gx + i * cw, gy + j * cw, cw - 1, cw - 1); } }
      for (var q = 0; q < N; q++) {
        var vis, hot = false;
        if (ph < o.build) { var a = ph / o.build * N; vis = q < a; hot = q >= a - 3 && vis; }
        else if (ph < o.build + o.hold) { vis = true; }
        else { var b = (1 - (ph - o.build - o.hold) / o.fade) * N; vis = q < b; }
        if (!vis) { continue; }
        var p = on[q], i2 = p % o.cols, j2 = (p / o.cols) | 0;
        ctx.fillStyle = 'rgba(' + o.color + ',' + (hot ? 0.55 : 1) + ')';
        ctx.fillRect(gx + i2 * cw, gy + j2 * cw, cw - 1, cw - 1);
      }
    }
    return { draw: draw };
  });
}

/* ---------- Servicom: anel de 24 marcas com ponteiro em varredura; as marcas recém-passadas esfriam do laranja ---------- */
function initWatch(canvas, opts) {
  'use strict';
  var o = { color: '255,255,255', accent: '237,107,19', ticks: 24, period: 24, fps: 30 };
  for (var k in opts) { if (opts.hasOwnProperty(k) && opts[k] !== undefined) { o[k] = opts[k]; } }
  var TAU = Math.PI * 2;

  return fxCanvas(canvas, o, function () {
    function draw(ctx, W, H, t) {
      var R = Math.min(W, H) * 0.36, cx = W / 2, cy = H / 2, a = (t / o.period) * TAU - Math.PI / 2;
      ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(' + o.color + ',0.16)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      for (var i = 0; i < o.ticks; i++) {
        var ta = i / o.ticks * TAU - Math.PI / 2, big = i % 6 === 0, len = big ? R * 0.09 : R * 0.045;
        var age = (((a - ta) % TAU) + TAU) % TAU / TAU;
        var warm = Math.max(0, 1 - age * 4);
        ctx.strokeStyle = warm > 0 ? 'rgba(' + o.accent + ',' + (0.35 + 0.65 * warm).toFixed(3) + ')' : 'rgba(' + o.color + ',' + (big ? 0.55 : 0.3) + ')';
        ctx.lineWidth = big ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ta) * (R - len), cy + Math.sin(ta) * (R - len));
        ctx.lineTo(cx + Math.cos(ta) * R, cy + Math.sin(ta) * R); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(' + o.accent + ',0.9)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, -Math.PI / 2, a); ctx.stroke();
      ctx.strokeStyle = 'rgba(' + o.accent + ',0.22)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R, a - 0.5, a); ctx.stroke();
      ctx.strokeStyle = 'rgba(' + o.color + ',0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    }
    return { draw: draw };
  });
}

/* ---------- registro: movimento.js chama VAD_CASE_FX[id](caseEl, reduced) ao abrir a webzinha ---------- */
(function () {
  'use strict';
  var makers = {
    onex: function (c) { return initAsciiSpiral(c, {}); },
    brnet: function (c) { return initFiber(c, {}); },
    siteflux: function (c) { return initGlobe(c, {}); },
    arweb: function (c) { return initPixelBuild(c, { src: 'assets/img/parceiros/logo-arweb-azul.png' }); },
    servicom: function (c) { return initWatch(c, {}); }
  };
  window.VAD_CASE_FX = {};
  Object.keys(makers).forEach(function (id) {
    window.VAD_CASE_FX[id] = function (caseEl, reducedMotion) {
      var visual = caseEl.querySelector('.m-case__visual');
      var c = document.createElement('canvas');
      c.className = 'm-case__fx'; c.setAttribute('aria-hidden', 'true');
      visual.insertBefore(c, visual.firstChild);
      var fx = makers[id](c);
      return {
        start: function () { if (reducedMotion) { fx.still(); } else { fx.start(); } },
        stop: function () { fx.stop(); },
        destroy: function () { fx.destroy(); if (c.parentNode) { c.parentNode.removeChild(c); } }
      };
    };
  });
})();
