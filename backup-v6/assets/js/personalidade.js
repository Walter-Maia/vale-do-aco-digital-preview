/* Vale do Aço Digital — camada "personalidade" (v1.2). Independente de main.js e da pasta raiz.
   Sem este arquivo a página segue completa: lista dos pilares com os três desenhos, foto visível, links comuns. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;
  root.classList.add('pers'); // só a partir daqui o CSS pode esconder algo para animar a entrada

  /* ------------------------------------------------------------------
     #pilares — índice que comanda a ilustração. Um único estado (active):
     hover de mouse, foco e clique/toque nos botões escolhem o mesmo item.
     Os títulos viram <button aria-pressed>; h3, descrições e tags seguem no lugar.
     ------------------------------------------------------------------ */
  var pindex = document.querySelector('[data-pindex]');
  if (pindex) {
    var items = Array.prototype.slice.call(pindex.querySelectorAll('.pilar'));
    var buttons = [], active = -1;
    var keyboardLock = false, travel = 0, lastX = null, lastY = null;

    var select = function (i) {
      if (i === active) { return; }
      active = i;
      // troca direta de classe: as transições CSS se redirecionam sozinhas, sem fila ao cruzar as linhas depressa
      items.forEach(function (li, k) {
        li.classList.toggle('is-active', k === i);
        buttons[k].setAttribute('aria-pressed', String(k === i));
      });
    };

    items.forEach(function (li, i) {
      var title = li.querySelector('.pilar__t');
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'pilar__btn';
      btn.textContent = title.textContent;
      var hint = document.createElement('span');
      hint.className = 'sr-only'; hint.textContent = ': destacar este pilar e a sua ilustração';
      btn.appendChild(hint);
      title.textContent = ''; title.appendChild(btn);
      buttons.push(btn);

      btn.addEventListener('click', function () { select(i); });
      btn.addEventListener('focus', function () {
        select(i);
        // foco vindo do teclado: o mouse parado em cima de outra linha não rouba a seleção
        var viaKeyboard = true;
        try { viaKeyboard = btn.matches(':focus-visible'); } catch (e) { /* navegador sem :focus-visible */ }
        if (viaKeyboard) { keyboardLock = true; travel = 0; lastX = lastY = null; }
      });
      li.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse' && !keyboardLock) { select(i); }
      });
      li.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') { return; }
        if (keyboardLock) {
          // só um deslocamento real do mouse devolve o controle ao hover (rolagem sob o cursor não conta)
          if (lastX !== null) { travel += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY); }
          lastX = e.clientX; lastY = e.clientY;
          if (travel < 24) { return; }
          keyboardLock = false;
        }
        select(i);
      });
    });
    // sair da área mantém a última seleção: não há mouseleave

    select(0);
    pindex.classList.add('is-enhanced');
  }

  /* ------------------------------------------------------------------
     #movimento — a foto entra por máscara uma única vez ao aparecer.
     ------------------------------------------------------------------ */
  var photo = document.querySelector('.movimento__photo[data-mask]');
  if (photo) {
    var show = function () { photo.classList.add('is-shown'); };
    if (!hasIO || reduced.matches) {
      show();
    } else {
      var photoIO = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) { return; }
        photoIO.disconnect();
        show();
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
      photoIO.observe(photo);
      setTimeout(function () { // rede de segurança: se o observador nunca disparar com a foto já na tela, mostra
        var r = photo.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) { show(); }
      }, 4000);
    }
  }

  /* ------------------------------------------------------------------
     Navegação — letras em rolagem nos links curtos do cabeçalho.
     Um nome acessível só: o conjunto animado é aria-hidden e o texto fica em .sr-only.
     ------------------------------------------------------------------ */
  var STEP_MS = 18, CAP_MS = 140;
  function graphemes(text) {
    if (window.Intl && Intl.Segmenter) {
      var out = [], it = new Intl.Segmenter('pt', { granularity: 'grapheme' }).segment(text)[Symbol.iterator](), s;
      while (!(s = it.next()).done) { out.push(s.value.segment); }
      return out;
    }
    return Array.from ? Array.from(text) : text.split('');
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    if (text != null) { node.textContent = text; }
    return node;
  }
  function buildRoll(link) {
    if (link.children.length || link.classList.contains('has-roll')) { return; }
    var label = link.textContent.replace(/\s+/g, ' ').trim();
    if (!label || label.length > 24) { return; }
    var total = graphemes(label.replace(/ /g, '')).length;
    var step = total > 1 ? Math.min(STEP_MS, CAP_MS / (total - 1)) : 0;
    var roll = el('span', 'roll'), n = 0;
    roll.setAttribute('aria-hidden', 'true');
    label.split(' ').forEach(function (word, w) {
      if (w) { roll.appendChild(document.createTextNode(' ')); }
      var box = el('span', 'roll-w');
      graphemes(word).forEach(function (ch) {
        var cell = el('span', 'roll-c'), track = el('span', 'roll-t');
        track.style.setProperty('--d', Math.round(n * step) + 'ms');
        track.appendChild(el('span', '', ch));
        track.appendChild(el('span', '', ch));
        cell.appendChild(track); box.appendChild(cell); n++;
      });
      roll.appendChild(box);
    });
    link.textContent = '';
    link.appendChild(roll);
    link.appendChild(el('span', 'sr-only', label));
    link.classList.add('has-roll');
  }
  Array.prototype.forEach.call(document.querySelectorAll('.nav__list a'), function (link) {
    try { buildRoll(link); } catch (e) { /* o link segue como texto comum */ }
  });
})();
