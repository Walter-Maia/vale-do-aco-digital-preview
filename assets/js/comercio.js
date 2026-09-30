/* Vale do Aço Digital — camada "Programa Comércio Digital" (v1.0): mockup de vídeo, botões magnéticos e inclinação
   leve dos quadrados soltos. Independente de main.js (intro + hero) e de exo.js (navegação, entradas e --py). */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------
     Mockup: o quadro preto vira a animação do Vale do Aço quando existir um arquivo em data-src.
     Sem data-src (ou se o arquivo falhar) fica o estado de espera (símbolo + brilho). Toca só na tela.
     ------------------------------------------------------------------ */
  $$('.pc-mock').forEach(function (mock) {
    var video = mock.querySelector('video');
    var src = mock.getAttribute('data-src');
    if (!video || !src) { return; }
    var hasIO = 'IntersectionObserver' in window, near = !hasIO, asked = false;
    function load() {
      if (asked || !near) { return; }
      asked = true;
      video.src = src;
      video.addEventListener('loadeddata', function () { mock.classList.add('has-video'); sync(); });
      video.addEventListener('error', function () { mock.classList.remove('has-video'); });
      video.load();
    }
    function sync() {
      if (!mock.classList.contains('has-video')) { return; }
      if (near && !document.hidden && !reduced.matches) { video.play().catch(function () {}); } else { video.pause(); }
    }
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        near = entries[0].isIntersecting; load(); sync();
      }, { rootMargin: '25% 0px' }).observe(mock);
    } else { load(); }
    document.addEventListener('visibilitychange', sync);
  });

  /* ------------------------------------------------------------------
     Camadas: a foto de #mudou (trás) sobe até encostar na beirada de baixo do mockup (frente), com uma pequena
     invasão. Mede por offsetTop (ignora transforms), refaz em resize/load/fontes.
     ------------------------------------------------------------------ */
  var next = document.querySelector('.pc-next'), mockEl = document.querySelector('.pc-mock'), mudou = document.querySelector('.pc-mudou');
  function absTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function syncPull() {
    if (!next || !mockEl || !mudou) { return; }
    var overlap = Math.max(8, Math.min(20, window.innerWidth * 0.01)); // o mockup cobre só a beirada do topo da foto: a cabeça fica livre
    var pull = (absTop(next) + next.offsetHeight) - (absTop(mockEl) + mockEl.offsetHeight) + overlap;
    mudou.style.setProperty('--pc-pull', Math.max(0, Math.round(pull)) + 'px');
    // a coluna de texto pode descer além do mockup: o título da foto começa abaixo dela
    var copy = next.querySelector('.pc-next__copy');
    var sectionTop = (absTop(next) + next.offsetHeight) - Math.max(0, pull);
    var over = copy ? (absTop(copy) + copy.offsetHeight) - sectionTop : 0;
    mudou.style.setProperty('--pc-copy-over', Math.max(0, Math.round(over)) + 'px');
  }
  syncPull();
  window.addEventListener('resize', syncPull);
  window.addEventListener('load', syncPull);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(syncPull); }
  if ('ResizeObserver' in window && next) { new ResizeObserver(syncPull).observe(next); }

  /* ------------------------------------------------------------------
     Quem está junto: o clique num cartão abre a aba compartilhada abaixo da grade com os dados daquele cartão
     (.pc-partner__data); clicar de novo, em "Fechar" ou Escape fecha. Só um aberto por vez.
     ------------------------------------------------------------------ */
  var detailWrap = document.querySelector('.pc-partners__detail');
  var partnerBtns = $$('.pc-partner[aria-controls]');
  if (detailWrap && partnerBtns.length) {
    var detail = detailWrap.querySelector('.pc-detail'), dName = detail.querySelector('.pc-detail__name'), dKicker = detail.querySelector('.pc-detail__kicker');
    var dBody = detail.querySelector('.pc-detail__body'), dStory = detail.querySelector('.pc-detail__story'), dClose = detail.querySelector('.pc-detail__close');
    var openBtn = null, closeTimer = 0;
    function fill(btn) {
      var data = btn.parentNode.querySelector('.pc-partner__data');
      dName.textContent = btn.querySelector('.pc-partner__name').textContent;
      dKicker.textContent = btn.querySelector('.pc-partner__meta span').textContent;
      dBody.innerHTML = ''; dStory.innerHTML = '';
      Array.prototype.slice.call(data.children).forEach(function (el) {
        (el.classList.contains('pc-detail__story') ? dStory : dBody).appendChild(el.cloneNode(true));
      });
      dStory.innerHTML = dStory.querySelector('.pc-detail__story') ? dStory.querySelector('.pc-detail__story').innerHTML : dStory.innerHTML;
    }
    function openDetail(btn) {
      clearTimeout(closeTimer);
      if (openBtn) { openBtn.setAttribute('aria-expanded', 'false'); }
      openBtn = btn; btn.setAttribute('aria-expanded', 'true');
      fill(btn); detail.hidden = false;
      void detailWrap.offsetHeight;
      detailWrap.classList.add('is-open');
      // a aba fica abaixo da grade: garante que ela entre na tela
      setTimeout(function () {
        var r = detailWrap.getBoundingClientRect();
        if (r.top > window.innerHeight * 0.7 || r.top < 0) { window.scrollTo({ top: window.pageYOffset + r.top - Math.min(140, window.innerHeight * 0.15), behavior: reduced.matches ? 'auto' : 'smooth' }); }
      }, 60);
    }
    function closeDetail(returnFocus) {
      if (!openBtn) { return; }
      var btn = openBtn; openBtn = null;
      btn.setAttribute('aria-expanded', 'false');
      detailWrap.classList.remove('is-open');
      closeTimer = setTimeout(function () { detail.hidden = true; }, 900);
      if (returnFocus) { btn.focus(); }
    }
    partnerBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { if (openBtn === btn) { closeDetail(false); } else { openDetail(btn); } });
    });
    dClose.addEventListener('click', function () { closeDetail(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openBtn) { closeDetail(true); } });
  }

  /* ------------------------------------------------------------------
     Botões magnéticos (só ponteiro fino, sem reduced motion): o botão acompanha o cursor por perto e volta com elástico.
     ------------------------------------------------------------------ */
  function setupMagnets() {
    $$('.pc-btn').forEach(function (btn) {
      if (btn._mag) { return; }
      btn._mag = true;
      btn.addEventListener('mousemove', function (e) {
        if (!fine.matches || reduced.matches) { return; }
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        btn.style.setProperty('--mx', (dx * 0.28).toFixed(1) + 'px');
        btn.style.setProperty('--my', (dy * 0.28).toFixed(1) + 'px');
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px');
      });
    });
  }
  setupMagnets();

  /* ------------------------------------------------------------------
     Quadrados soltos: inclinação de até 5° seguindo o mouse dentro de cada um (ponteiro fino, sem reduced motion).
     A translação vertical (--py) continua sendo escrita por exo.js; aqui só --rx/--ry.
     ------------------------------------------------------------------ */
  $$('.pc-tile:not(.pc-tile--title)').forEach(function (tile) {
    var inner = tile.querySelector('.pc-tile__in');
    if (!inner) { return; }
    tile.addEventListener('mousemove', function (e) {
      if (!fine.matches || reduced.matches) { return; }
      var r = tile.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      inner.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
      inner.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
    });
    tile.addEventListener('mouseleave', function () {
      inner.style.setProperty('--ry', '0deg'); inner.style.setProperty('--rx', '0deg');
    });
  });
})();
