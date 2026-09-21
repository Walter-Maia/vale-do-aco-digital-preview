/* Vale do Aço Digital — camada "exo" (v1.0): navegação, entradas graduais e deslocamento leve no scroll.
   Independente de main.js. Sem este arquivo a página segue completa e parada (nada é escondido sem .x-on). */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------
     Navegação: cor conforme a seção atrás da barra; some ao descer e volta ao subir.
     Uma medição por quadro, não por evento.
     ------------------------------------------------------------------ */
  var header = document.querySelector('.x-header');
  var hero = document.getElementById('hero');
  var zones = $$('main > section, main > figure, .x-foot');
  var navLinks = $$('.x-nav a[href^="#"]');
  var lastY = window.pageYOffset, tick = 0;

  function zoneAt(y) { // última zona cujo topo já passou da linha y
    var found = zones[0];
    for (var i = 0; i < zones.length; i++) {
      if (zones[i].getBoundingClientRect().top <= y) { found = zones[i]; } else { break; }
    }
    return found;
  }
  function syncHeader() {
    tick = 0;
    var y = window.pageYOffset;
    // sobre o hero: barra transparente, sem marca e só com "Menu" (a assinatura central ocupa o meio)
    root.classList.toggle('hero-top', !!hero && hero.getBoundingClientRect().bottom > header.offsetHeight + 8);
    header.setAttribute('data-theme', zoneAt(header.offsetHeight / 2).getAttribute('data-nav-theme') || 'light');
    if (Math.abs(y - lastY) > 6) {
      header.classList.toggle('is-away', y > lastY && y > window.innerHeight * 0.6 && !menuIsOpen());
      lastY = y;
    }
    var mid = zoneAt(window.innerHeight / 2);
    navLinks.forEach(function (a) {
      if (a.getAttribute('href') === '#' + mid.id) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
    });
    if (floats.length) { syncFloats(); }
    if (clipped.length) { syncClipped(); }
    if (tracks.length) { syncTracks(); }
  }
  function queue() { if (!tick) { tick = requestAnimationFrame(syncHeader); } }
  header.addEventListener('focusin', function () { header.classList.remove('is-away'); });

  /* menu em tela cheia (telas estreitas e, em qualquer largura, sobre o hero) */
  var menuBtn = document.querySelector('.x-menu-btn');
  var menu = document.getElementById('x-menu');
  var menuLabel = menuBtn.querySelector('span');
  function menuIsOpen() { return menuBtn.getAttribute('aria-expanded') === 'true'; }
  function setMenu(open, returnFocus) {
    menuBtn.setAttribute('aria-expanded', String(open));
    // a página trava atrás do menu; mede a barra de rolagem antes de ela sumir para o botão ficar no lugar
    if (open) { root.style.setProperty('--sbw', (window.innerWidth - root.clientWidth) + 'px'); }
    menu.classList.toggle('is-open', open);
    root.classList.toggle('x-menu-open', open);
    menuLabel.textContent = open ? 'Fechar' : 'Menu';
    if (open) { header.classList.remove('is-away'); }
    if (!open && returnFocus) { menuBtn.focus(); }
  }
  menuBtn.addEventListener('click', function () { setMenu(!menuIsOpen(), false); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false, false); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuIsOpen()) { setMenu(false, true); } });

  /* ------------------------------------------------------------------
     Deslocamento leve no scroll (só ponteiro fino, tela larga e sem reduced motion).
     Cada elemento recebe --py; o CSS decide como usar.
     ------------------------------------------------------------------ */
  var floats = [];
  var canFloat = window.matchMedia('(min-width: 940px) and (hover: hover) and (pointer: fine)');
  function setupFloats() {
    floats.forEach(function (f) { f.el.style.removeProperty('--py'); });
    floats = [];
    if (reduced.matches || !canFloat.matches) { return; }
    $$('[data-speed]').forEach(function (el) { floats.push({ el: el, speed: parseFloat(el.getAttribute('data-speed')) || 0 }); });
    [['.x-case--b', -0.09], ['.x-mov__copy', -0.06], ['.x-quem__note', -0.05]].forEach(function (pair) {
      var el = document.querySelector(pair[0]);
      if (el) { el.setAttribute('data-float', ''); floats.push({ el: el, speed: pair[1] }); }
    });
  }
  function syncFloats() {
    var vh = window.innerHeight;
    floats.forEach(function (f) {
      var r = f.el.parentNode.getBoundingClientRect(); // o pai não se move: a leitura não realimenta o deslocamento
      if (r.bottom < -200 || r.top > vh + 200) { return; }
      var offset = (r.top + r.height / 2) - vh / 2;
      f.el.style.setProperty('--py', (offset * f.speed).toFixed(1) + 'px');
    });
  }

  /* ------------------------------------------------------------------
     Linhas da identidade que acompanham a leitura ([data-progress]): a linha enche conforme o bloco atravessa a tela
     (--p de 0 a 1) e cada nó acende quando ela chega nele. Sem JS ou com reduced motion a linha já nasce cheia.
     ------------------------------------------------------------------ */
  var tracks = [];
  function setupTracks() {
    tracks = [];
    if (reduced.matches || !root.classList.contains('x-on')) { return; }
    $$('[data-progress]').forEach(function (el) {
      var nodes = $$('li', el), rail = el.classList.contains('x-rail');
      // verbos: o nó fica no meio de cada linha; trilho: no começo de cada etapa
      tracks.push({ el: el, nodes: nodes, at: nodes.map(function (n, i) { return rail ? i / nodes.length + 0.02 : (i + 0.5) / nodes.length; }), p: -1 });
    });
  }
  function syncTracks() {
    var vh = window.innerHeight;
    tracks.forEach(function (t) {
      var r = t.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) { return; }
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      p = Math.round(p * 500) / 500;
      if (p === t.p) { return; }
      t.p = p;
      t.el.style.setProperty('--p', p);
      t.nodes.forEach(function (n, i) { n.classList.toggle('is-lit', p >= t.at[i]); });
    });
  }

  /* pilares: o botão alterna desenho e fotografia (no mouse o hover já faz isso; aqui é o caminho de toque e teclado) */
  $$('.x-case__toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.parentNode.classList.toggle('is-photo');
      btn.setAttribute('aria-pressed', String(on));
    });
  });

  /* ------------------------------------------------------------------
     Texto por linhas: embrulha cada palavra, agrupa por linha (offsetTop) e atrasa a subida por linha.
     Ao terminar, devolve o HTML original — nada de spans sobrando, e o texto volta a quebrar livremente.
     ------------------------------------------------------------------ */
  function wrapWords(node) {
    $$('*', node).concat([node]).forEach(function (el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (child) {
        if (child.nodeType !== 3 || !child.nodeValue.trim()) { return; }
        var frag = document.createDocumentFragment();
        child.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) { return; }
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'x-w';
          var inner = document.createElement('span'); inner.textContent = part;
          w.appendChild(inner); frag.appendChild(w);
        });
        el.replaceChild(frag, child);
      });
    });
  }
  function playSplit(el) {
    var original = el.innerHTML;
    wrapWords(el);
    var line = -1, top = null;
    $$('.x-w', el).forEach(function (w) {
      if (w.offsetTop !== top) { top = w.offsetTop; line++; }
      w.style.setProperty('--ln', line);
    });
    el.classList.add('is-split');
    void el.offsetWidth; // fixa o estado inicial antes de soltar a transição
    el.classList.add('is-in');
    setTimeout(function () {
      el.innerHTML = original;
      el.classList.add('is-done');
      el.classList.remove('is-split');
    }, 1300 + (line + 1) * 90);
  }

  /* ------------------------------------------------------------------
     Entradas: cada [data-in] entra uma vez, ao chegar à tela.
     ------------------------------------------------------------------ */
  var items = $$('[data-in]');
  var clipped = [];
  function syncClipped() {
    var line = window.innerHeight * 0.9;
    clipped = clipped.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > line || r.bottom < 0) { return true; }
      enter(el); return false;
    });
  }
  function enter(el) {
    if (el.getAttribute('data-in') === 'split') { playSplit(el); return; }
    el.classList.add('is-in');
    if (el.getAttribute('data-in') === 'media') { setTimeout(function () { el.classList.add('is-settled'); }, 2000); }
  }
  if (hasIO && !reduced.matches) {
    root.classList.add('x-on');
    // quem entra por recorte (clip-path) começa 100% recortado, e o observador desconta o recorte: nunca "apareceria".
    // Esses são medidos no laço de scroll (getBoundingClientRect ignora o recorte); são poucos e saem da lista ao entrar.
    var CLIPPED = { media: 1, tile: 1, row: 1 };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        io.unobserve(entry.target);
        enter(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    items.forEach(function (el) {
      if (CLIPPED[el.getAttribute('data-in')]) { clipped.push(el); } else { io.observe(el); }
    });
    // se o usuário pedir menos movimento no meio da visita, tudo aparece de uma vez
    if (reduced.addEventListener) {
      reduced.addEventListener('change', function () {
        if (!reduced.matches) { return; }
        io.disconnect(); clipped = []; root.classList.remove('x-on'); setupFloats(); setupTracks();
        $$('[data-progress]').forEach(function (el) { el.style.removeProperty('--p'); });
      });
    }
  }

  setupFloats();
  setupTracks();
  if (canFloat.addEventListener) { canFloat.addEventListener('change', setupFloats); }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  syncHeader();
})();
