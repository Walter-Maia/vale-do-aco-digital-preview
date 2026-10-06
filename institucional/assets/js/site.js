/* Vale do Aço Digital — site institucional: menu, entradas, letras das três frentes, parallax e botões magnéticos.
   Intro, hero e mapa ficam em abertura.js. Sem JS a página continua completa e estática. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var hasIO = 'IntersectionObserver' in window;
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------------- menu em tela cheia ---------------- */
  var btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  function setMenu(open) {
    root.classList.toggle('menu-aberto', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  btn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-aberto')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-aberto')) { setMenu(false); btn.focus(); }
  });

  /* ---------------- três frentes: o nome entra letra a letra e um pulso de luz percorre o fio ----------------
     Cada letra vira um bloco próprio (só assim dá para animar transform por letra); o CSS mantém o degradê contínuo com
     --x (posição da letra na palavra) e --w (largura da palavra). A posição de cada letra é medida antes de separar e
     reposta depois (--m), porque blocos separados perdem o kerning. A palavra inteira fica num .sr-only; o conjunto
     animado é aria-hidden. Com movimento reduzido nada disso é montado: vale a palavra inteira que está no HTML. */
  var PAD = 0.06; // folga lateral de cada letra, em em (ver .frente__letras .lt em site.css)
  function splitLetters(h) {
    var word = h.querySelector('.frente__palavra'), node = word && word.firstChild;
    if (!node || node.nodeType !== 3 || !document.createRange) { return; }
    var text = node.nodeValue, fs = parseFloat(getComputedStyle(word).fontSize), r0 = word.getBoundingClientRect();
    if (!fs || !r0.width) { return; }
    var range = document.createRange(), xs = [], letters = [], i, s;
    for (i = 0; i < text.length; i++) { range.setStart(node, i); range.setEnd(node, i + 1); xs.push((range.getBoundingClientRect().left - r0.left) / fs); }
    var box = document.createElement('span'), sr = document.createElement('span');
    box.className = 'frente__letras'; box.setAttribute('aria-hidden', 'true');
    box.style.setProperty('--w', (r0.width / fs).toFixed(4) + 'em'); box.style.setProperty('--pad', PAD + 'em');
    for (i = 0; i < text.length; i++) {
      s = document.createElement('span'); s.className = 'lt'; s.textContent = text.charAt(i);
      s.style.setProperty('--k', i); s.style.setProperty('--x', xs[i].toFixed(4) + 'em');
      box.appendChild(s); letters.push(s);
    }
    sr.className = 'sr-only'; sr.textContent = text;
    h.replaceChild(box, word); h.insertBefore(sr, box);
    // lê todas as posições antes de escrever: a margem de uma letra desloca as seguintes
    var b0 = box.getBoundingClientRect().left;
    var ds = letters.map(function (el, k) { return xs[k] - ((el.getBoundingClientRect().left - b0) / fs + PAD); });
    letters.forEach(function (el, k) { var m = ds[k] - (k ? ds[k - 1] : 0); if (Math.abs(m) > 0.0004) { el.style.setProperty('--m', m.toFixed(4) + 'em'); } });
  }
  function pulso(li, ms, delay) {
    var el = li.querySelector('.frente__pulso');
    if (!el || !el.animate) { return; }
    var dist = Math.max(0, (parseFloat(getComputedStyle(li, '::after').width) || li.clientWidth) - el.offsetWidth);
    if (el._anim) { el._anim.cancel(); } // interrompível: um pulso novo substitui o que estiver em curso
    el._anim = el.animate([
      { transform: 'translateX(0)', opacity: 0 },
      { opacity: 1, offset: 0.14 },
      { opacity: 1, offset: 0.78 },
      { transform: 'translateX(' + dist.toFixed(1) + 'px)', opacity: 0 }
    ], { duration: ms, delay: delay || 0, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
  }
  var frentes = all('.frente');
  if (!reduced.matches) {
    frentes.forEach(function (li) {
      var h = li.querySelector('.frente__nome'), p = document.createElement('i');
      if (h) { splitLetters(h); }
      p.className = 'frente__pulso'; p.setAttribute('aria-hidden', 'true'); li.appendChild(p);
      if (fine.matches) { li.addEventListener('pointerenter', function () { if (li.classList.contains('is-in')) { pulso(li, 1100); } }); }
    });
  }

  /* ---------------- entradas: uma vez, quando o bloco chega à tela ----------------
     O elemento observado nunca leva clip-path próprio (recorte no alvo = interseção 0 = a entrada não dispara): ver "clip" em site.css. */
  var reveals = all('[data-rv]');
  function entrar(el) {
    if (el.classList.contains('is-in')) { return; }
    el.classList.add('is-in');
    if (el.classList.contains('frente')) { pulso(el, 1500, 380 + frentes.indexOf(el) * 120); }
  }
  if (hasIO && !reduced.matches) {
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target, img = el.tagName === 'IMG' ? el : el.querySelector('img');
        rvIO.unobserve(el);
        // imagem lazy ainda a caminho (salto por âncora ou rolagem rápida): a entrada espera por ela para não acontecer sobre
        // uma caixa vazia e a imagem "estalar" depois. Os blocos com imagem são só imagem, então nada visível fica retido;
        // o teto de 6 s é só para conexão travada (erro de carga libera na hora e o texto alternativo aparece)
        if (img && !img.complete) {
          var wait = setTimeout(function () { entrar(el); }, 6000);
          var ready = function () { clearTimeout(wait); entrar(el); };
          img.addEventListener('load', ready); img.addEventListener('error', ready);
        } else { entrar(el); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { rvIO.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- parallax ----------------
     data-px="n" / data-px-x="n": deslocamento máximo, em px da arte (1920), quando o trilho cruza a tela.
     Positivo acompanha a rolagem (plano distante); negativo anda contra ela (plano próximo).
     Trilho: seletor em data-px-track do próprio elemento, senão o ancestral com data-px-track, senão o elemento.
     Escreve só `translate` (as entradas usam `transform`), só nos elementos perto da tela, e o laço dorme ao assentar. */
  var items = all('[data-px], [data-px-x]').map(function (el) {
    var own = el.getAttribute('data-px-track');
    var track = own ? el.closest(own) : (el.parentElement && el.parentElement.closest('[data-px-track]'));
    return { el: el, track: track || el, py: parseFloat(el.getAttribute('data-px')) || 0, px: parseFloat(el.getAttribute('data-px-x')) || 0, on: !hasIO, top: 0, h: 1, ay: 0, ax: 0, last: '' };
  });
  var sections = all('[data-tema]').map(function (el) { return { el: el, top: 0, bottom: 0 }; });
  var vh = 1, y = window.pageYOffset, target = y, raf = 0, lastT = 0, tema = '';

  function measure() {
    vh = window.innerHeight;
    var u = Math.min(window.innerWidth, 2560) / 1920, k = window.innerWidth < 900 ? 1.6 : 1, sy = window.pageYOffset;
    items.forEach(function (it) { it.el.style.translate = ''; it.last = ''; });
    items.forEach(function (it) {
      var r = it.track.getBoundingClientRect();
      it.top = r.top + sy; it.h = r.height; it.ay = it.py * u * k; it.ax = it.px * u * k;
    });
    sections.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.top = r.top + sy; s.bottom = r.bottom + sy; });
  }
  function paint() {
    var i, it, p, v, mid = y + vh / 2;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (!it.on) { continue; }
      p = clamp((mid - (it.top + it.h / 2)) / ((vh + it.h) / 2), -1, 1);
      v = (it.ax * p).toFixed(1) + 'px ' + (it.ay * p).toFixed(1) + 'px';
      if (v !== it.last) { it.last = v; it.el.style.translate = v; }
    }
    // cor das barras do menu: tema da seção que está sob o botão
    var line = y + 56, t = 'escuro';
    for (i = 0; i < sections.length; i++) { if (line >= sections[i].top && line < sections[i].bottom) { t = sections[i].el.getAttribute('data-tema'); break; } }
    if (t !== tema) { tema = t; root.setAttribute('data-tema-atual', t); }
  }
  function frame(now) {
    raf = 0;
    var dt = lastT ? Math.min(50, now - lastT) : 16.7; lastT = now;
    y += (target - y) * (1 - Math.exp(-dt / 80));
    if (Math.abs(target - y) < 0.4) { y = target; }
    paint();
    if (y !== target) { raf = requestAnimationFrame(frame); } else { lastT = 0; }
  }
  function wake() { if (!raf) { raf = requestAnimationFrame(frame); } }

  if (reduced.matches) {
    items = [];
    measure(); paint();
    window.addEventListener('scroll', function () { y = window.pageYOffset; paint(); }, { passive: true });
    window.addEventListener('resize', function () { measure(); paint(); });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { measure(); paint(); }); }
  } else {
    if (hasIO) {
      var pxIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          for (var i = 0; i < items.length; i++) { if (items[i].track === entry.target) { items[i].on = entry.isIntersecting; } }
        });
        wake();
      }, { rootMargin: '25% 0px 25% 0px' });
      var seen = [];
      items.forEach(function (it) { if (seen.indexOf(it.track) < 0) { seen.push(it.track); pxIO.observe(it.track); } });
    }
    var rT = 0;
    var remeasure = function () { measure(); target = y = window.pageYOffset; paint(); };
    var later = function () { clearTimeout(rT); rT = setTimeout(remeasure, 120); };
    measure(); paint();
    window.addEventListener('scroll', function () { target = window.pageYOffset; wake(); }, { passive: true });
    window.addEventListener('resize', later);
    window.addEventListener('load', remeasure);
    // a Montserrat chega depois do primeiro layout e muda a altura dos textos: mede de novo
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(later); }
    // o hero muda de altura quando abertura.js troca de modo (scrub / toque / estático)
    if ('ResizeObserver' in window) { new ResizeObserver(later).observe(document.getElementById('hero')); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { lastT = 0; target = window.pageYOffset; wake(); } });
  }

  /* ---------------- botões magnéticos (só ponteiro fino) ---------------- */
  if (fine.matches && !reduced.matches) {
    all('[data-ima]').forEach(function (el) {
      el.style.transition = 'translate 0.6s cubic-bezier(0.16, 1, 0.3, 1), scale 0.25s cubic-bezier(0.16, 1, 0.3, 1)'; // scale: o press de .pilula/.cta
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.translate = (dx * 14).toFixed(1) + 'px ' + (dy * 10).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });
  }
})();
