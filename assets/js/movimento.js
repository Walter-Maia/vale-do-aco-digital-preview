/* Vale do Aço Digital — index "movimento" (v1.0): cursor-círculo, "Você · no · digital" pelo scroll, botões magnéticos
   e a webzinha de cada empresa (cortina + página própria). Navegação e entradas [data-in] ficam em exo.js; intro e hero em main.js. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------
     Cursor-círculo: um ponto segue o mouse com atraso; sobre [data-cursor] vira um disco desfocado com o rótulo do elemento.
     Só com ponteiro fino; o cursor nativo some enquanto isso.
     ------------------------------------------------------------------ */
  var cur = document.querySelector('.m-cur');
  if (cur && fine.matches) {
    var label = cur.querySelector('span');
    var tx = -100, ty = -100, cx = -100, cy = -100, raf = 0, active = null;
    root.classList.add('m-cur-on');
    function tick() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.left = cx.toFixed(1) + 'px'; cur.style.top = cy.toFixed(1) + 'px';
      if (Math.abs(tx - cx) > 0.2 || Math.abs(ty - cy) > 0.2) { raf = requestAnimationFrame(tick); } else { raf = 0; }
    }
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) { raf = requestAnimationFrame(tick); }
      var el = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (el !== active) {
        active = el;
        cur.classList.toggle('is-big', !!el);
        cur.classList.toggle('is-light', !!(el && el.closest('.m-sec--dark, .m-foot, .hero')) || !!(e.target.closest && e.target.closest('.m-sec--dark, .m-foot, .hero, .x-menu.is-open')));
        if (el) { label.textContent = el.getAttribute('data-cursor') || ''; }
      } else if (!el) {
        cur.classList.toggle('is-light', !!(e.target.closest && e.target.closest('.m-sec--dark, .m-foot, .hero, .x-menu.is-open')));
      }
    }, { passive: true });
    document.addEventListener('mousedown', function () { cur.classList.add('is-down'); });
    document.addEventListener('mouseup', function () { cur.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { cur.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cur.style.opacity = '1'; });
  }

  /* ------------------------------------------------------------------
     Você · no · digital: enquanto o bloco atravessa a tela, as duas palavras se afastam (--p) e o "no" nasce no meio (--q).
     ------------------------------------------------------------------ */
  var you = document.querySelector('.m-you');
  var youTrack = you && you.querySelector('.m-you__track');
  var youLast = -1;
  // chuva ASCII atrás da frase (ascii-rain.js): a frase é o horizonte; intensidade ligada ao fim do scroll (p 0,8 → 1)
  var rainCanvas = you && you.querySelector('.m-you__rain');
  var rain = (rainCanvas && typeof initAsciiRain === 'function') ? initAsciiRain(rainCanvas, { avoid: you.querySelector('.m-you__no') }) /* a linha de texto, não o contêiner (que ocupa a faixa inteira) */ : null;
  if (rain) { rain.start(); }
  function syncYou() {
    if (!youTrack || reduced.matches) { return; }
    var r = youTrack.getBoundingClientRect(), vh = window.innerHeight;
    var total = r.height - vh;
    var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    p = Math.round(p * 200) / 200;
    if (p === youLast) { return; }
    youLast = p;
    var q = Math.min(1, Math.max(0, (p - 0.8) / 0.2)); // o "no" só nasce quando as duas palavras já chegaram perto
    q = 1 - Math.pow(1 - q, 3); // ease-out
    you.style.setProperty('--p', p.toFixed(3));
    you.style.setProperty('--q', q.toFixed(3));
    if (rain) { rain.setIntensity((p - 0.8) / 0.2); }
  }

  /* ------------------------------------------------------------------
     Botões magnéticos.
     ------------------------------------------------------------------ */
  $$('.m-btn').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      if (!fine.matches || reduced.matches) { return; }
      var r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - (r.left + r.width / 2)) * 0.3).toFixed(1) + 'px');
      btn.style.setProperty('--my', ((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1) + 'px');
    });
    btn.addEventListener('mouseleave', function () { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
  });

  /* ------------------------------------------------------------------
     Webzinha da empresa: o clique num quadrado fecha a cortina, monta a página com os dados do cartão (.m-card__data),
     abre por cima e a cortina sobe. Fechar, Escape e o botão "voltar" do navegador desfazem. URL ganha #empresa-<id>.
     ------------------------------------------------------------------ */
  var cards = $$('.m-card[data-id]');
  var caseEl = document.querySelector('.m-case'), curtain = document.querySelector('.m-curtain');
  if (cards.length && caseEl && curtain) {
    var openId = null, busy = false, lastBtn = null, fx = null;
    // efeito-assinatura por empresa: registrado em window.VAD_CASE_FX[id] (movimento-fx.js); criado ao abrir, destruído ao trocar/fechar
    function fxStart(id) { fxStop(); var reg = window.VAD_CASE_FX && window.VAD_CASE_FX[id]; if (!reg) { return; } try { fx = reg(caseEl, reduced.matches); if (fx && fx.start) { fx.start(); } } catch (e) { fx = null; } }
    function fxStop() { if (fx) { try { if (fx.destroy) { fx.destroy(); } else if (fx.stop) { fx.stop(); } } catch (e) { /* ok */ } fx = null; } }
    var byId = {}; cards.forEach(function (c) { byId[c.getAttribute('data-id')] = c; });
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function curtainIn() { curtain.classList.remove('is-out'); void curtain.offsetHeight; curtain.classList.add('is-in'); return wait(reduced.matches ? 0 : 780); }
    function curtainOut() { curtain.classList.remove('is-in'); curtain.classList.add('is-out'); return wait(reduced.matches ? 0 : 780).then(function () { curtain.classList.remove('is-out'); }); }
    function fill(card) {
      var data = card.parentNode.querySelector('.m-card__data');
      var name = card.querySelector('.m-card__name').textContent;
      caseEl.setAttribute('data-theme', card.getAttribute('data-id'));
      caseEl.querySelector('.m-case__title').textContent = name;
      caseEl.querySelector('.m-case__kicker').textContent = card.querySelector('.m-card__meta').textContent;
      var visual = caseEl.querySelector('.m-case__visual');
      visual.style.setProperty('--brand', getComputedStyle(card.querySelector('.m-card__img')).getPropertyValue('--brand') || '');
      visual.innerHTML = ''; visual.appendChild(card.querySelector('img').cloneNode(true));
      caseEl.querySelector('.m-case__meta').innerHTML = data.querySelector('.m-case__meta').innerHTML;
      caseEl.querySelector('.m-case__body').innerHTML = data.querySelector('.m-case__body').innerHTML;
      var ids = cards.map(function (c) { return c.getAttribute('data-id'); });
      var next = byId[ids[(ids.indexOf(card.getAttribute('data-id')) + 1) % ids.length]];
      var nb = caseEl.querySelector('.m-case__next button');
      nb.textContent = next.querySelector('.m-card__name').textContent; nb.setAttribute('data-next', next.getAttribute('data-id'));
    }
    function openCase(card, push) {
      if (busy) { return; }
      busy = true; lastBtn = card;
      curtainIn().then(function () {
        fill(card); openId = card.getAttribute('data-id');
        caseEl.hidden = false; caseEl.scrollTop = 0; root.classList.add('m-case-open'); fxStart(openId);
        if (push) { history.pushState({ empresa: openId }, '', '#empresa-' + openId); }
        return curtainOut();
      }).then(function () { caseEl.classList.add('is-shown'); caseEl.querySelector('.m-case__close').focus({ preventScroll: true }); busy = false; });
    }
    function closeCase(fromHistory) {
      if (busy || !openId) { return; }
      busy = true;
      curtainIn().then(function () {
        fxStop(); caseEl.removeAttribute('data-theme'); caseEl.classList.remove('is-shown'); caseEl.hidden = true; root.classList.remove('m-case-open'); openId = null;
        if (!fromHistory) { history.pushState({}, '', location.pathname + location.search); }
        return curtainOut();
      }).then(function () { if (lastBtn) { lastBtn.focus({ preventScroll: true }); } busy = false; });
    }
    cards.forEach(function (c) { c.addEventListener('click', function () { openCase(c, true); }); });
    caseEl.querySelector('.m-case__close').addEventListener('click', function () { closeCase(false); });
    caseEl.querySelector('.m-case__next button').addEventListener('click', function (e) {
      var n = byId[e.currentTarget.getAttribute('data-next')];
      if (!n || busy) { return; }
      busy = true;
      curtainIn().then(function () { fill(n); openId = n.getAttribute('data-id'); caseEl.scrollTop = 0; fxStart(openId); history.replaceState({ empresa: openId }, '', '#empresa-' + openId); return curtainOut(); }).then(function () { busy = false; });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openId) { closeCase(false); } });
    window.addEventListener('popstate', function (e) {
      var id = e.state && e.state.empresa;
      if (id && byId[id]) { if (openId !== id) { openCase(byId[id], false); } } else if (openId) { closeCase(true); }
    });
    var m = /#empresa-([a-z0-9-]+)/.exec(location.hash);
    if (m && byId[m[1]]) { history.replaceState({ empresa: m[1] }, '', location.href); openCase(byId[m[1]], false); }
  }

  var tick2 = 0;
  function onScroll() { if (!tick2) { tick2 = requestAnimationFrame(function () { tick2 = 0; syncYou(); }); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  syncYou();
})();
