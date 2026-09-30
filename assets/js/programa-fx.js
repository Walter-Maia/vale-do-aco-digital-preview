/* Programa Comércio Digital — controlador de movimento v3.5 (29/09/2026). Um arquivo, uma inicialização e uma limpeza
   (window.__vadFx.destroy()). Responsabilidades:
   1. reveals [data-rv]: arma (esconde) só o que ainda está abaixo da tela; revela uma vez ao entrar na área de leitura;
      o que já está visível na inicialização (ou acima, após rolagem restaurada) fica como está, sem repetir entrada;
   2. parallax [data-px] dentro da trilha [data-px-track] mais próxima, em todas as seções:
      transform independente de translate (reveal/centralização/flutuação). Caminho alternativo por rAF sem CSS scroll-driven
      (ou com ?fx=js, em qualquer largura). Planos lineares: A·(2p − 1); quadro: curva de ida/volta,
      com oclusão contínua pela foto e empilhamento fixo no CSS. Faixa "cover"; lê apenas os
      contêineres perto da tela, escreve depois de ler, um rAF por vez, nada roda parado ou em aba oculta;
   3. flutuação ambiente (.boia): liga .is-perto perto da tela e html.aba-oculta com a aba oculta (CSS pausa);
   4. magnetismo discreto (≤ 4 px) só no conteúdo interno das pílulas [data-magnet], só com ponteiro fino;
   5. ao vivo: movimento reduzido, capacidade de hover, resize/orientação (amplitudes relidas do CSS) e aba oculta.
   A abertura do mosaico é preparada no <head> (antes da primeira pintura), não aqui. ?fx=0 → nada roda. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, Q = location.search;
  if (/[?&]fx=0(&|$)/.test(Q)) { return; }
  var FORCE_JS = /[?&]fx=js(&|$)/.test(Q);
  var mqRM = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  var hasIO = 'IntersectionObserver' in window;
  var SDA = !FORCE_JS && !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()') &&
    CSS.supports('view-timeline-name: --px-cena') && CSS.supports('animation-range: cover 0% cover 100%'));
  var cleanups = [];
  function on(t, type, fn, o) { t.addEventListener(type, fn, o || false); cleanups.push(function () { t.removeEventListener(type, fn, o || false); }); }
  function onMq(m, fn) {
    if (m.addEventListener) { m.addEventListener('change', fn); cleanups.push(function () { m.removeEventListener('change', fn); }); }
    else if (m.addListener) { m.addListener(fn); cleanups.push(function () { m.removeListener(fn); }); }
  }
  root.classList.add('fx-on', SDA ? 'fx-sda' : 'fx-js');

  /* ---------------- 1. reveals ---------------- */
  var timers = [];
  function reveal(el, delay) {
    if (delay) { el.style.setProperty('--rv-d', delay + 'ms'); }
    el.classList.add('is-in');
    // terminada a entrada, a máscara de linha sai (nada de clip-path permanente)
    timers.push(setTimeout(function () { el.classList.remove('is-armed'); el.style.removeProperty('--rv-d'); }, 1800 + (delay || 0)));
  }
  var ioRv = hasIO ? new IntersectionObserver(function (entries) {
    var batch = [];
    entries.forEach(function (e) { if (e.isIntersecting) { batch.push(e.target); ioRv.unobserve(e.target); } });
    batch.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    batch.forEach(function (el, k) { reveal(el, k * 90); });   // itens que chegam juntos entram em ordem, 90 ms entre si
  }, { rootMargin: '0px 0px -12% 0px' }) : null;
  var vh0 = innerHeight, armados = [];
  [].forEach.call(d.querySelectorAll('[data-rv]'), function (el) {
    var ref = el.getAttribute('data-rv') ? el.querySelector(el.getAttribute('data-rv')) || el : el;
    // só arma o que está inteiramente abaixo da dobra: nada que já foi pintado na tela é escondido
    if (!ioRv || ref.getBoundingClientRect().top < vh0) { el.classList.add('is-in'); return; }
    el.classList.add('is-armed');
    armados.push(el);
    ioRv.observe(el);
  });
  // a entrada dispara 12 % acima da base da tela; se a rolagem PARAR com um item armado já aparecendo nessa faixa
  // (ou a aba voltar / a tela mudar de tamanho), ele é revelado — nada fica visível e vazio esperando mais rolagem
  var ocioso = 0;
  var revelaVisiveis = function () {
    var vh = innerHeight;
    armados = armados.filter(function (el) {
      if (el.classList.contains('is-in')) { return false; }
      if (el.getBoundingClientRect().top < vh - 2) { if (ioRv) { ioRv.unobserve(el); } reveal(el, 0); return false; }
      return true;
    });
  };
  var aoRolar = function () { clearTimeout(ocioso); if (armados.length) { ocioso = setTimeout(revelaVisiveis, 220); } };
  on(window, 'scroll', aoRolar, { passive: true });
  on(window, 'resize', aoRolar);
  on(d, 'visibilitychange', function () { if (!d.hidden) { aoRolar(); } });
  cleanups.push(function () { if (ioRv) { ioRv.disconnect(); } timers.forEach(clearTimeout); clearTimeout(ocioso); });

  /* ---------------- 2. parallax: caminho alternativo ---------------- */
  var tracks = [], raf = 0;
  if (!SDA) {
    var probe = d.createElement('div');
    probe.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;';
    d.body.appendChild(probe);
    cleanups.push(function () { probe.remove(); });
    var toPx = function (v) {   // "clamp(16px, 1.1vw, 22px)", "-5px", "16.5px" → px na largura atual
      if (!v) { return 0; }
      probe.style.marginLeft = v;
      var n = parseFloat(getComputedStyle(probe).marginLeft);
      probe.style.marginLeft = '';
      return isFinite(n) ? n : 0;
    };
    tracks = [].map.call(d.querySelectorAll('[data-px-track]'), function (box) {
      // Trilhas aninhadas (abertura > mosaico) não devem escrever duas vezes no mesmo alvo.
      var items = [].filter.call(box.querySelectorAll('[data-px]'), function (el) { return el.closest('[data-px-track]') === box; });
      return { box: box, near: !hasIO, items: items.map(function (el) { return { el: el, a: 0, last: null, arc: el.getAttribute('data-px-depth') === 'arc' }; }) };
    });
    var readAmps = function () {
      tracks.forEach(function (t) { t.items.forEach(function (it) { it.a = toPx(getComputedStyle(it.el).getPropertyValue('--px-a').trim()); }); });
    };
    var clearAll = function () {
      tracks.forEach(function (t) { t.items.forEach(function (it) { it.el.style.transform = ''; it.last = null; }); });
    };
    var depthCurve = [1, .707107, 0, -.707107, -1, -.707107, 0, .707107, 1];
    var frame = function () {
      raf = 0;
      if (mqRM.matches || d.hidden) { return; }
      var vh = innerHeight, reads = [];
      tracks.forEach(function (t) { if (t.near) { reads.push([t, t.box.getBoundingClientRect()]); } });   // leituras
      reads.forEach(function (x) {                                                                           // escritas
        var t = x[0], r = x[1], p = (vh - r.top) / (vh + r.height);
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        t.items.forEach(function (it) {
          var factor = 2 * p - 1;
          if (it.arc) {
            var pos = p * 8, ix = Math.min(7, Math.floor(pos));
            factor = depthCurve[ix] + (depthCurve[ix + 1] - depthCurve[ix]) * (pos - ix);
          }
          var s = it.a ? (it.a * factor).toFixed(2) : '0';
          if (s === it.last) { return; }
          it.el.style.transform = s === '0' ? '' : 'translate3d(0,' + s + 'px,0)';
          it.last = s;
        });
      });
    };
    var kick = function () { if (!raf && !d.hidden && !mqRM.matches) { raf = requestAnimationFrame(frame); } };
    readAmps();
    if (hasIO) {
      var ioPx = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var t = tracks.filter(function (x) { return x.box === e.target; })[0];
          if (!t) { return; }
          t.near = e.isIntersecting;
          t.items.forEach(function (it) { it.el.classList.toggle('px-near', t.near); });
        });
        kick();
      }, { rootMargin: '25% 0px' });
      tracks.forEach(function (t) { ioPx.observe(t.box); });
      cleanups.push(function () { ioPx.disconnect(); tracks.forEach(function (t) { t.items.forEach(function (it) { it.el.classList.remove('px-near'); }); }); });
    }
    on(window, 'scroll', kick, { passive: true });
    var rz = 0;
    on(window, 'resize', function () { clearTimeout(rz); rz = setTimeout(function () { readAmps(); tracks.forEach(function (t) { t.items.forEach(function (it) { it.last = null; }); }); kick(); }, 120); kick(); });
    on(d, 'visibilitychange', kick);
    onMq(mqRM, function () { if (mqRM.matches) { clearAll(); } else { readAmps(); kick(); } });
    cleanups.push(function () { cancelAnimationFrame(raf); clearTimeout(rz); clearAll(); });
    kick();
  }

  /* ---------------- 3. flutuação ambiente (v3.1): só roda perto da tela e com a aba visível ----------------
     As camadas .boia (quadro__placa, servicos, cta__boia) têm a animação CSS pausada por padrão; aqui só se liga
     .is-perto quando entram perto da tela e html.aba-oculta quando a aba some (pausar mantém a posição). */
  var boias = [].slice.call(d.querySelectorAll('.boia'));
  if (hasIO && boias.length) {
    var ioBoia = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-perto', e.isIntersecting); });
    }, { rootMargin: '15% 0px' });
    boias.forEach(function (b) { ioBoia.observe(b); });
    cleanups.push(function () { ioBoia.disconnect(); boias.forEach(function (b) { b.classList.remove('is-perto'); }); });
  } else { boias.forEach(function (b) { b.classList.add('is-perto'); }); }
  var aba = function () { root.classList.toggle('aba-oculta', d.hidden); };
  aba();
  on(d, 'visibilitychange', aba);
  cleanups.push(function () { root.classList.remove('aba-oculta'); });

  /* ---------------- 4. magnetismo interno das pílulas ---------------- */
  var mags = [];
  [].forEach.call(d.querySelectorAll('[data-magnet]'), function (a) {
    var inner = a.querySelector('.cta__mag');
    if (!inner) { return; }
    var m = { inner: inner, x: 0, y: 0, raf: 0 };
    var apply = function () { m.raf = 0; inner.style.translate = m.x || m.y ? m.x.toFixed(2) + 'px ' + m.y.toFixed(2) + 'px' : ''; };
    on(a, 'pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !mqFine.matches || mqRM.matches) { return; }
      var r = a.getBoundingClientRect();
      var nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      m.x = Math.max(-1, Math.min(1, nx)) * 4;
      m.y = Math.max(-1, Math.min(1, ny)) * 3;
      if (!m.raf) { m.raf = requestAnimationFrame(apply); }
    });
    on(a, 'pointerleave', function () { m.x = m.y = 0; if (!m.raf) { m.raf = requestAnimationFrame(apply); } });
    m.reset = function () { cancelAnimationFrame(m.raf); m.raf = 0; m.x = m.y = 0; inner.style.translate = ''; };
    mags.push(m);
  });
  var resetMags = function () { mags.forEach(function (m) { m.reset(); }); };
  onMq(mqRM, resetMags);
  onMq(mqFine, resetMags);
  cleanups.push(resetMags);

  /* ---------------- limpeza (para testes e para quem for trocar o script) ---------------- */
  window.__vadFx = {
    mode: SDA ? 'css-scroll-driven' : 'js',
    listeners: function () { return cleanups.length; },
    destroy: function () { cleanups.splice(0).forEach(function (fn) { fn(); }); root.classList.remove('fx-on', 'fx-sda', 'fx-js'); }
  };
})();
