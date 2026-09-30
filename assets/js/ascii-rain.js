/* ascii-rain.js — chuva de caracteres monocromática atrás de "Você no digital" (proposta do designer, 25/09/2026).
   Vanilla, sem dependências. A frase é um horizonte: gotas de cima morrem ao tocá-la, gotas de baixo nascem dela.

   var rain = initAsciiRain(canvas, { avoid: document.querySelector('.m-you__words') });
   rain.start();              // liga observadores; com reduced motion desenha um quadro estático e para
   rain.setIntensity(0.7);    // 0..1, ligado ao progresso do scroll
   rain.stop();               // pausa e limpa
   rain.destroy();            // remove observadores e listeners
*/
function initAsciiRain(canvas, opts) {
  'use strict';

  var o = {
    color: '228, 224, 219',                 // #e4e0db (só a cor do site)
    chars: '0123456789·:.-+|',              // set discreto
    accent: 'vocenodigital',                // letras da frase, raras
    accentRate: 0.08,                       // frequência das letras
    font: 'ui-monospace, "SF Mono", Menlo, Consolas, "Roboto Mono", "DejaVu Sans Mono", monospace',
    cell: 0,                                // px; 0 = automático por largura
    density: 0,                             // fração máxima de colunas ativas; 0 = automático (0.55 desktop, 0.4 celular)
    speed: [6, 14],                         // linhas por segundo (mín, máx)
    tau: 0.55,                              // constante de tempo do rastro, em segundos
    headAlpha: 0.9,                         // alfa da cabeça com intensidade 1
    fps: 30,                                // teto de quadros por segundo
    flicker: 2,                             // células cintilando por quadro
    pad: 0.6,                               // respiro (em células) em volta da frase
    avoid: null,                            // elemento cuja faixa vertical fica vazia (a frase)
    reduced: 'static'                       // 'static' desenha um quadro parado; 'none' não desenha nada
  };
  for (var k in opts) { if (opts.hasOwnProperty(k) && opts[k] !== undefined) { o[k] = opts[k]; } }

  var ctx = canvas.getContext('2d', { alpha: true });
  var glyphs = o.chars.split(''), accents = o.accent.split('');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  var W = 0, H = 0, cell = 16, cols = 0, rows = 0, density = 0.55;
  var bandTop = 0, bandBot = 0;             // faixa da frase, em linhas
  var drops = [];                           // uma gota por coluna
  var running = false, inView = true, pageVisible = !document.hidden;
  var raf = 0, last = 0, target = 0, cur = 0, idle = 0;

  /* ---------- utilitários ---------- */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(v) { return 1 - Math.pow(1 - v, 3); }
  function pick() {
    var set = Math.random() < o.accentRate ? accents : glyphs;
    return set[(Math.random() * set.length) | 0];
  }
  function cellFor(w) { return w < 600 ? 12 : w < 1024 ? 14 : w < 1600 ? 16 : 18; }

  /* ---------- layout: mede o canvas, a faixa da frase e recria as colunas ---------- */
  function layout() {
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    var dpr = Math.min(W < 600 ? 1.5 : 2, window.devicePixelRatio || 1);
    cell = o.cell || cellFor(W);
    density = o.density || (W < 600 ? 0.4 : 0.55);

    canvas.width = Math.round(W * dpr);     // também limpa o canvas
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '400 ' + Math.round(cell * 0.88) + 'px ' + o.font;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    cols = Math.ceil(W / cell);
    rows = Math.ceil(H / cell);

    if (o.avoid) {                          // a frase só se move na horizontal, então a faixa vertical é estável
      var a = o.avoid.getBoundingClientRect();
      bandTop = Math.floor((a.top - r.top) / cell - o.pad);
      bandBot = Math.ceil((a.bottom - r.top) / cell + o.pad);
    } else {
      bandTop = Math.floor(rows * 0.42);
      bandBot = Math.ceil(rows * 0.58);
    }
    bandTop = Math.max(0, bandTop);
    bandBot = Math.min(rows, bandBot);

    drops = [];
    for (var j = 0; j < cols; j++) { drops.push({ on: false, top: false, y: 0, row: -1, v: 0, end: 0 }); }
  }

  /* ---------- desenho de uma célula ---------- */
  function draw(j, row, alpha) {
    var x = j * cell, y = row * cell;
    ctx.clearRect(x, y, cell, cell);        // evita sobreposição de glifos
    ctx.fillStyle = 'rgba(' + o.color + ',' + alpha.toFixed(3) + ')';
    ctx.fillText(pick(), x + cell / 2, y + cell * 0.06);
  }

  /* ---------- nascimento de uma gota ---------- */
  function spawn(d, allowTop) {
    d.on = true;
    d.top = allowTop && Math.random() < 0.5;
    d.v = o.speed[0] + Math.random() * (o.speed[1] - o.speed[0]);
    if (d.top) {                            // vem de fora da tela e morre ao tocar a frase
      d.y = -Math.random() * rows * 0.6;
      d.end = bandTop;
    } else {                                // nasce na borda inferior da frase e sai por baixo
      d.y = bandBot + Math.random() * 1.5;      // pequeno desalinhamento: gotas nascidas no mesmo quadro não formam linha
      d.end = rows + 1;
    }
    d.row = Math.floor(d.y) - 1;
  }

  /* ---------- um quadro ---------- */
  function frame(now) {
    raf = 0;
    if (!running || !inView || !pageVisible) { return; }

    var dt = Math.min(100, now - last);
    if (dt < 1000 / o.fps - 1) { raf = requestAnimationFrame(frame); return; }   // teto de fps
    last = now;

    cur += (target - cur) * Math.min(1, dt / 180);            // suaviza a intensidade vinda do scroll
    if (target === 0 && cur < 0.002) { cur = 0; }

    // rastro: apaga um pouco de tudo; independente da taxa de quadros
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,' + (1 - Math.exp(-dt / 1000 / o.tau)).toFixed(4) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    var s = dt / 1000, e = easeOut(cur);
    var alpha = o.headAlpha * (0.6 + 0.4 * cur);
    var want = Math.round(cols * density * e);                // quantas gotas queremos vivas
    var allowTop = cur > 0.5;                                 // a população de cima só entra na segunda metade
    var active = 0, j, d;

    for (j = 0; j < cols; j++) {
      d = drops[j];
      if (!d.on) { continue; }
      d.y += d.v * s;
      var row = Math.floor(d.y);
      if (row > d.row) {                                      // avançou pelo menos uma célula
        if (row >= 0 && row < d.end && row < rows) { draw(j, row, alpha); }
        d.row = row;
      }
      if (d.y >= d.end) { d.on = false; } else { active++; }
    }

    // nascimentos: no máximo 2 por quadro para a chuva "engrossar" em vez de aparecer de uma vez
    for (var n = 0; n < 2 && active < want; n++) {
      j = (Math.random() * cols) | 0;
      if (!drops[j].on) { spawn(drops[j], allowTop); active++; }
    }

    // cintilação: redesenha uma célula atrás de alguma cabeça, mais fraca
    if (o.flicker && cur > 0.3) {
      for (n = 0; n < o.flicker; n++) {
        j = (Math.random() * cols) | 0; d = drops[j];
        if (!d.on) { continue; }
        var back = d.row - 2 - ((Math.random() * 4) | 0);
        var floor = d.top ? 0 : bandBot;
        if (back >= floor && back < d.end && back < rows) { draw(j, back, alpha * 0.35); }
      }
    }

    // ocioso: sem intensidade e sem gotas, deixa o rastro sumir e suspende o loop
    if (cur === 0 && active === 0) {
      if (++idle > 45) { ctx.clearRect(0, 0, W, H); return; }
    } else { idle = 0; }

    raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (running && inView && pageVisible && !raf && !reduced.matches) {
      last = performance.now();
      idle = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function halt() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  /* ---------- quadro estático para reduced motion ---------- */
  function drawStatic() {
    layout();
    if (o.reduced !== 'static') { return; }
    var n = Math.round(cols * 0.22);
    for (var i = 0; i < n; i++) {
      var j = (Math.random() * cols) | 0, len = 3 + ((Math.random() * 5) | 0);
      var top = Math.random() < 0.5;
      var start = top ? Math.max(0, (Math.random() * (bandTop - len)) | 0)
                      : bandBot + ((Math.random() * Math.max(1, rows - bandBot - len)) | 0);
      for (var q = 0; q < len; q++) {
        var row = start + q;
        if ((top && row >= bandTop) || row >= rows) { break; }
        draw(j, row, 0.22 * (q + 1) / len);
      }
    }
  }

  /* ---------- observadores ---------- */
  var io = null, ro = null, resizeTimer = 0;

  function onResize() {
    cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(function () {
      if (reduced.matches) { if (running) { drawStatic(); } return; }
      layout();
      kick();
    });
  }
  function onVisibility() { pageVisible = !document.hidden; if (pageVisible) { kick(); } else { halt(); } }
  function onMotionChange() {
    halt();
    if (!running) { return; }
    if (reduced.matches) { drawStatic(); } else { layout(); kick(); }
  }

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) { kick(); } else { halt(); }
    }, { threshold: 0 });
    io.observe(canvas);
  }
  if ('ResizeObserver' in window) { ro = new ResizeObserver(onResize); ro.observe(canvas); }
  else { window.addEventListener('resize', onResize); }
  document.addEventListener('visibilitychange', onVisibility);
  if (reduced.addEventListener) { reduced.addEventListener('change', onMotionChange); }
  else if (reduced.addListener) { reduced.addListener(onMotionChange); }

  /* ---------- API ---------- */
  return {
    start: function () {
      running = true;
      if (reduced.matches) { drawStatic(); return; }
      layout();
      kick();
    },
    stop: function () {
      running = false;
      halt();
      ctx.clearRect(0, 0, W, H);
    },
    setIntensity: function (v) {
      target = clamp01(+v || 0);
      if (target > 0) { kick(); }
    },
    resize: onResize,
    destroy: function () {
      this.stop();
      if (io) { io.disconnect(); }
      if (ro) { ro.disconnect(); } else { window.removeEventListener('resize', onResize); }
      document.removeEventListener('visibilitychange', onVisibility);
      if (reduced.removeEventListener) { reduced.removeEventListener('change', onMotionChange); }
      else if (reduced.removeListener) { reduced.removeListener(onMotionChange); }
    }
  };
}
