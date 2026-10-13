/* Vale do Aço Digital — site institucional: menu, entradas, letras das três frentes, baralho de públicos, vídeo do Marco Zero,
   esteira de parceiros, parallax e botões magnéticos.
   Intro, hero e mapa ficam em abertura.js. Sem JS a página continua completa e estática. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var hasIO = 'IntersectionObserver' in window;
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------------- menu: cortina em tela cheia (no modelo do menu do Siteflux) ----------------
     A cortina, a entrada dos links e a faixa do hover são CSS (site.css); aqui ficam o estado, o teclado e as letras em rolagem. */
  var btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  function isOpen() { return root.classList.contains('menu-aberto'); }
  function setMenu(open, restoreFocus) {
    if (open === isOpen()) { return; }
    if (open) {
      // a página trava e a barra de rolagem some: a largura dela vira folga (--sbw) para nada pular de lugar
      root.style.setProperty('--sbw', Math.max(0, window.innerWidth - root.clientWidth) + 'px');
      menu.scrollTop = 0;
    }
    root.classList.toggle('menu-aberto', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (!open && restoreFocus) { btn.focus(); }
  }
  btn.addEventListener('click', function () { setMenu(!isOpen()); });
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) { return; }
    setMenu(false);
    // link para uma seção: o foco vai junto (o leitor de tela segue dali e o próximo Tab continua na seção)
    var alvo = /^#./.test(a.getAttribute('href') || '') ? document.querySelector(a.getAttribute('href')) : null;
    if (alvo) { if (!alvo.hasAttribute('tabindex')) { alvo.setAttribute('tabindex', '-1'); } alvo.focus({ preventScroll: true }); }
  });
  // cortina aberta = modal: Esc fecha e devolve o foco ao botão; o Tab circula entre o botão e os links
  document.addEventListener('keydown', function (e) {
    if (!isOpen()) { return; }
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key !== 'Tab') { return; }
    var links = all('a', menu), last = links[links.length - 1], at = document.activeElement;
    if (!e.shiftKey && at === last) { e.preventDefault(); btn.focus(); }
    else if (e.shiftKey && at === btn) { e.preventDefault(); last.focus(); }
    else if (at !== btn && !menu.contains(at)) { e.preventDefault(); btn.focus(); }
  });
  // no toque, arrastar sobre a cortina não rola a página de trás (o iOS ignora o overflow do <html>); se a própria cortina
  // tiver rolagem (celular deitado), ela rola normalmente
  menu.addEventListener('touchmove', function (e) { if (menu.scrollHeight <= menu.clientHeight + 1) { e.preventDefault(); } }, { passive: false });

  /* letras em rolagem: <a>Texto</a> vira <a><span.roll aria-hidden>…</span><span.sr-only>Texto</span></a>. Cada letra é uma
     janela com duas cópias; o CSS sobe o trilho no hover, com atraso por letra (--d) e a cor da segunda cópia pela posição (--t).
     A posição de cada letra é medida antes de separar e reposta depois (--m), como nas três frentes: blocos separados perdem o
     kerning. Só com ponteiro fino e movimento permitido — no toque não há hover e o link segue como texto comum. */
  var STEP_MS = 18, CAP_MS = 130; // atraso por letra, com teto para a palavra inteira
  function buildRoll(link) {
    var node = link.firstChild;
    if (!node || node.nodeType !== 3 || link.children.length || !document.createRange) { return; }
    var label = node.nodeValue, fs = parseFloat(getComputedStyle(link).fontSize), range = document.createRange();
    if (!fs || !label.trim() || /\s\s|^\s|\s$/.test(label)) { return; }
    var xs = [], cells = [], i, x0;
    for (i = 0; i < label.length; i++) {
      if (label.charAt(i) === ' ') { continue; }
      range.setStart(node, i); range.setEnd(node, i + 1); xs.push(range.getBoundingClientRect().left);
    }
    x0 = xs[0];
    var total = xs.length, step = total > 1 ? Math.min(STEP_MS, CAP_MS / (total - 1)) : 0;
    var roll = document.createElement('span'), sr = document.createElement('span');
    roll.className = 'roll'; roll.setAttribute('aria-hidden', 'true');
    label.split(' ').forEach(function (word, w) {
      var box = document.createElement('span'); box.className = 'roll-w';
      if (w) { roll.appendChild(document.createTextNode(' ')); }
      for (var k = 0; k < word.length; k++) {
        var cell = document.createElement('span'), track = document.createElement('span'), n = cells.length;
        cell.className = 'roll-c'; track.className = 'roll-t';
        track.style.setProperty('--d', Math.round(n * step) + 'ms');
        track.style.setProperty('--t', total > 1 ? (n / (total - 1)).toFixed(3) : '0');
        track.appendChild(document.createElement('span')).textContent = word.charAt(k);
        track.appendChild(document.createElement('span')).textContent = word.charAt(k);
        cell.appendChild(track); box.appendChild(cell); cells.push(cell);
      }
      roll.appendChild(box);
    });
    sr.className = 'sr-only'; sr.textContent = label;
    link.textContent = ''; link.appendChild(roll); link.appendChild(sr);
    // lê todas as posições antes de escrever: a margem de uma letra desloca as seguintes
    var pad = parseFloat(getComputedStyle(cells[0]).paddingLeft) || 0, b0 = cells[0].getBoundingClientRect().left + pad;
    var ds = cells.map(function (c, k) { return ((xs[k] - x0) - (c.getBoundingClientRect().left + pad - b0)) / fs; });
    cells.forEach(function (c, k) { var m = ds[k] - (k ? ds[k - 1] : 0); if (Math.abs(m) > 0.0004) { c.style.setProperty('--m', m.toFixed(4) + 'em'); } });
  }
  if (fine.matches && !reduced.matches) {
    all('.menu__nav a').forEach(function (a) { try { buildRoll(a); } catch (e) { /* o link segue como texto comum */ } });
  }

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

  /* dispara fn uma vez, quando `fracao` do elemento está na tela (sem IntersectionObserver ou com movimento reduzido: na hora).
     `margem` (opcional) encolhe a área que conta como tela, no formato de rootMargin. */
  function aoVer(el, fracao, fn, margem) {
    if (!hasIO || reduced.matches) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) { return; }
      io.disconnect(); fn();
    }, { threshold: fracao, rootMargin: margem || '0px' });
    io.observe(el);
  }

  /* ---------------- para quem é: o baralho abre quando a pilha está à vista ----------------
     Os três cartões esperam empilhados na casa do meio (site.css). O observado é o cartão do meio, que não sai do lugar: com 60%
     dele na tela a pilha já foi vista e cada cartão vai para a sua casa. Uma vez só. A faixa de baixo da tela (22%) não conta:
     no celular os cartões abrem em coluna, e sem essa folga o de baixo ia para a sua casa ainda fora da tela. */
  var baralho = document.querySelector('.publicos__lista');
  if (baralho && baralho.children[1]) { aoVer(baralho.children[1], 0.6, function () { baralho.classList.add('is-in'); }, '0px 0px -22% 0px'); }
  /* com ponteiro fino, uma luz acompanha o cursor dentro do cartão: aqui só se escreve a posição (--mx/--my, lidas pelo degradê de
     .publico::before em site.css), no máximo uma vez por quadro */
  if (fine.matches && !reduced.matches) {
    all('.publico').forEach(function (cartao) {
      var quadro = 0, px = 0, py = 0;
      cartao.addEventListener('pointermove', function (e) {
        px = e.clientX; py = e.clientY;
        if (quadro) { return; }
        quadro = requestAnimationFrame(function () {
          quadro = 0;
          var r = cartao.getBoundingClientRect();
          cartao.style.setProperty('--mx', Math.round(px - r.left) + 'px');
          cartao.style.setProperty('--my', Math.round(py - r.top) + 'px');
        });
      });
    });
  }

  /* ---------------- marco zero: a marca vira tela e o vídeo do YouTube carrega nela ----------------
     A entrada (traço → logo → tela com a capa) é CSS, ligada por .is-in. Fachada: até o clique não existe iframe nem pedido ao
     YouTube (a capa é um arquivo local). No clique a tela cresce até a largura do palco, por transform, enquanto dentro dela só há
     a capa; 650 ms depois ela assume a medida real (.is-pronto) e só então o iframe nasce, já no tamanho final — o arranque do
     player não disputa os quadros da abertura. Sem JS o link abre o vídeo no YouTube; em file:// também, porque ali o YouTube
     recusa a incorporação (erro 153: a página não tem endereço para informar como referenciador).
     No toque o player embutido fica de fora e o link segue para o YouTube (aba nova ou o app): no celular o YouTube não começa
     sozinho dentro do iframe, e o player aberto parecia travado à espera de um segundo toque. */
  var palco = document.querySelector('.marco__palco'), play = palco && palco.querySelector('.marco__play');
  if (palco) { aoVer(palco, 0.3, function () { palco.classList.add('is-in'); }); }
  if (play && location.protocol !== 'file:' && fine.matches) {
    var aquecido = false;
    var aquecer = function () { // a intenção de assistir (ponteiro, foco, dedo) adianta a conexão com o YouTube
      if (aquecido) { return; }
      aquecido = true;
      ['https://www.youtube-nocookie.com', 'https://i.ytimg.com'].forEach(function (href) {
        var l = document.createElement('link'); l.rel = 'preconnect'; l.href = href; document.head.appendChild(l);
      });
    };
    play.addEventListener('pointerenter', aquecer);
    play.addEventListener('focus', aquecer);
    play.addEventListener('touchstart', aquecer, { passive: true });
    play.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) { return; } // quem pede outra aba continua indo para o YouTube
      e.preventDefault();
      if (palco.classList.contains('is-aberto')) { return; }
      aquecer();
      palco.classList.add('is-in', 'is-aberto');
      var f = document.createElement('iframe');
      f.className = 'marco__video';
      f.title = play.getAttribute('data-titulo') || 'Vídeo';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.addEventListener('load', function () { palco.classList.add('is-tocando'); });
      setTimeout(function () {
        palco.classList.add('is-pronto');
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(play.getAttribute('data-video')) + '?autoplay=1&rel=0&playsinline=1&start=' + (parseInt(play.getAttribute('data-inicio'), 10) || 0);
        palco.querySelector('.marco__tela').appendChild(f);
        f.focus(); // o link sai de cena: o foco segue para o player
      }, reduced.matches ? 0 : 650);
    });
  }

  /* ---------------- parceiros: esteira contínua ----------------
     A lista do HTML ganha duas cópias (aria-hidden, sem texto alternativo: o leitor de tela lê as marcas uma vez só) e o trilho anda
     uma largura de lista por volta (site.css). Com movimento reduzido nada é montado e a lista fica parada. A esteira pausa fora da
     tela; em aba oculta, pela classe .is-hidden que abertura.js põe no <html>. As imagens seguem lazy até a faixa se aproximar da
     tela; aí todas carregam de uma vez — lazy, as que estão longe na horizontal só chegariam com a esteira já passando por elas. */
  var faixa = document.querySelector('.parceiros__faixa'), trilho = faixa && faixa.querySelector('.parceiros__trilho');
  if (trilho && !reduced.matches) {
    var marcas = trilho.querySelector('.parceiros__lista');
    for (var c = 0; c < 2; c++) {
      var copia = marcas.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      all('img', copia).forEach(function (img) { img.alt = ''; });
      trilho.appendChild(copia);
    }
    faixa.classList.add('is-esteira');
    if (hasIO) {
      var perto = false;
      new IntersectionObserver(function (entries) {
        var dentro = entries[0].isIntersecting;
        if (dentro && !perto) { perto = true; all('img', faixa).forEach(function (img) { img.loading = 'eager'; }); }
        faixa.classList.toggle('is-fora', !dentro);
      }, { rootMargin: '300px 0px 300px 0px' }).observe(faixa);
    }
  }

  /* ---------------- letreiro no celular: a palavra inteira de margem a margem ----------------
     Abaixo de 900 px "DIGITALIZAR" tem de caber na tela. A largura da palavra muda com a fonte do aparelho (Helvetica, Roboto,
     Arial), então o corpo sai da medida real: mede o texto (um Range mede as letras; o span é bloco e ocupa a linha) e escala até
     a largura útil. Roda antes do parallax, que mede a altura do letreiro, e de novo quando as fontes chegam e a tela muda. */
  var palavra = document.querySelector('.letreiro__palavra'), palavraTexto = palavra && palavra.querySelector('span');
  function ajustarPalavra() {
    if (!palavraTexto) { return; }
    palavra.style.fontSize = '';
    if (window.innerWidth >= 900) { return; }
    var cs = getComputedStyle(palavra), r = document.createRange();
    r.selectNodeContents(palavraTexto);
    var largura = r.getBoundingClientRect().width, util = palavra.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (largura > 0 && util > 0) { palavra.style.fontSize = (parseFloat(cs.fontSize) * util / largura).toFixed(2) + 'px'; }
  }
  ajustarPalavra();
  window.addEventListener('resize', ajustarPalavra);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(ajustarPalavra); }

  /* ---------------- parallax ----------------
     data-px="n" / data-px-x="n": deslocamento máximo, em px da arte (1920), quando o trilho cruza a tela.
     Positivo acompanha a rolagem (plano distante); negativo anda contra ela (plano próximo).
     data-px-x-m="n": o mesmo deslocamento lateral para tela estreita (< 900 px), sem o reforço de 1,6× — para o que lá
     precisa caber inteiro na largura (o letreiro).
     data-px-gpu: enquanto está perto da tela o elemento ganha camada própria (will-change) e o parallax só move a camada, em
     vez de repintar o bloco a cada quadro — vale para fotos, a faixa com grão e as letras gigantes em degradê.
     Ficam de fora, de propósito: o texto corrido (em camada própria perderia nitidez parado em posição fracionária) e a
     figura do mapa (com will-change num ancestral o Chromium deixa de refazer o raster do que muda de escala dentro do SVG:
     com a antiga câmera de 30× o mapa regional saía borrado, e os halos dos nós ainda pulsam por escala).
     Trilho: seletor em data-px-track do próprio elemento, senão o ancestral com data-px-track, senão o elemento.
     Escreve só `translate` (as entradas usam `transform`), só nos elementos perto da tela, e o laço dorme ao assentar.
     data-px-m-css: no celular, onde o navegador tem animação conduzida pela rolagem (animation-timeline: view()), o deslize
     desse elemento é do CSS (site.css, "deslizes do celular") e roda no compositor, colado ao dedo; aqui ele fica parado.
     No toque a rolagem já é suave: o laço segue a posição real, sem a inércia de 80 ms do mouse (que no celular atrasava os planos). */
  var deslizeCss = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')), toque = window.matchMedia('(hover: none)');
  var items = all('[data-px], [data-px-x]').map(function (el) {
    var own = el.getAttribute('data-px-track'), pxm = el.getAttribute('data-px-x-m');
    var track = own ? el.closest(own) : (el.parentElement && el.parentElement.closest('[data-px-track]'));
    return { el: el, track: track || el, py: parseFloat(el.getAttribute('data-px')) || 0, px: parseFloat(el.getAttribute('data-px-x')) || 0, pxm: pxm === null ? null : parseFloat(pxm) || 0, gpu: el.hasAttribute('data-px-gpu'), css: el.hasAttribute('data-px-m-css'), on: !hasIO, top: 0, h: 1, ay: 0, ax: 0, last: '' };
  });
  var sections = all('[data-tema]').map(function (el) { return { el: el, top: 0, bottom: 0 }; });
  var vh = 1, y = window.pageYOffset, target = y, raf = 0, lastT = 0, tema = '', foraHero = false, rolando = false;

  function measure() {
    vh = window.innerHeight;
    var estreita = window.innerWidth < 900, u = Math.min(window.innerWidth, 2560) / 1920, k = estreita ? 1.6 : 1, sy = window.pageYOffset;
    items.forEach(function (it) { it.el.style.translate = ''; it.last = ''; });
    items.forEach(function (it) {
      var r = it.track.getBoundingClientRect();
      var doCss = estreita && deslizeCss && it.css;
      it.top = r.top + sy; it.h = r.height; it.ay = doCss ? 0 : it.py * u * k; it.ax = doCss ? 0 : estreita && it.pxm !== null ? it.pxm * u : it.px * u * k;
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
    // cor das barras do menu: tema da seção que está sob o botão (e se ela é o hero: fora dele o botão ganha base no celular)
    var line = y + 56, t = 'escuro', fora = true;
    for (i = 0; i < sections.length; i++) { if (line >= sections[i].top && line < sections[i].bottom) { t = sections[i].el.getAttribute('data-tema'); fora = sections[i].el.id !== 'hero'; break; } }
    if (t !== tema) { tema = t; root.setAttribute('data-tema-atual', t); }
    if (fora !== foraHero) { foraHero = fora; root.classList.toggle('fora-hero', fora); }
  }
  function frame(now) {
    raf = 0;
    var dt = lastT ? Math.min(50, now - lastT) : 16.7; lastT = now;
    y = toque.matches ? target : y + (target - y) * (1 - Math.exp(-dt / 80));
    if (Math.abs(target - y) < 0.4) { y = target; }
    paint();
    if (y !== target) { raf = requestAnimationFrame(frame); }
    else { lastT = 0; if (rolando) { rolando = false; root.classList.remove('rolando'); } } // assentou: os loops do mapa voltam (abertura.css)
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
          for (var i = 0, it; i < items.length; i++) {
            it = items[i];
            if (it.track !== entry.target || it.on === entry.isIntersecting) { continue; }
            it.on = entry.isIntersecting;
            if (it.gpu) { it.el.style.willChange = it.on ? 'translate' : ''; } // a camada só existe enquanto o bloco está por perto
          }
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
    window.addEventListener('scroll', function () {
      target = window.pageYOffset;
      if (!rolando) { rolando = true; root.classList.add('rolando'); } // enquanto a página rola, os loops do mapa esperam
      wake();
    }, { passive: true });
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
