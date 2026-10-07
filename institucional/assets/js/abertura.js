/* Vale do Aço Digital — interações. Sem JS a página continua completa e estática. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ------------------------------------------------------------------
     Intro: 3,9s (trecho útil do motion de referência), uma vez por sessão. Escape ou Tab liberam;
     um timer de segurança libera mesmo se algo falhar. O hero só começa
     sua entrada depois que a intro sai (onIntroDone).
     ------------------------------------------------------------------ */
  var intro = document.getElementById('intro');
  var introDone = !root.classList.contains('intro-on');
  var introCallbacks = [];
  var INTRO_MS = 3900; // 3,5s de coreografia + 0,4s com a marca completa antes de sair
  function onIntroDone(fn) { if (introDone) { fn(); } else { introCallbacks.push(fn); } }

  function endIntro() {
    if (introDone) { return; }
    introDone = true;
    try { sessionStorage.setItem('vad-intro', '1'); } catch (e) { /* armazenamento bloqueado: a intro só repete */ }
    intro.classList.add('is-leaving');
    root.classList.remove('intro-lock'); // devolve a rolagem já; o overlay some no fade
    if (intro.contains(document.activeElement)) { document.activeElement.blur(); }
    setTimeout(function () { root.classList.remove('intro-on'); }, 650);
    introCallbacks.forEach(function (fn) { fn(); });
  }

  if (!introDone) {
    // dois quadros de folga para o primeiro paint não engolir o início das transições
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        intro.classList.add('is-playing');
      });
    });
    setTimeout(function () { intro.classList.add('is-playing'); }, 250);
    setTimeout(endIntro, INTRO_MS);
    document.addEventListener('keydown', function (e) {
      if (introDone) { return; }
      if (e.key === 'Escape' || e.key === 'Tab') {
        endIntro();
        root.classList.remove('intro-on'); // o foco por teclado já encontra a página descoberta
      }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { endIntro(); } });
    if (document.hidden) { endIntro(); } // aba aberta em segundo plano: não segura a página atrás de uma intro que ninguém vê
  }

  /* ------------------------------------------------------------------
     Hero — três modos, decididos por capacidade e preferência, nunca por userAgent:
       scrub  (mouse e toque): o scroll conduz o vídeo. Um seek por vez, alvo quantizado em quadros do vídeo,
              suavização por tempo decorrido (igual em 60, 144 ou 240 Hz), laço dorme quando não há o que aproximar.
              No toque o arquivo vem inteiro para a memória (blob) antes do primeiro seek, e três seeks de prova medem o aparelho.
       play   (toque em aparelho que não acompanha o seek): hero em fluxo normal (100svh); o vídeo toca uma vez, mudo e inline.
       static (reduced motion, economia de dados, sem MP4, vídeo com erro ou lento demais): quadro final + frase + CTAs.
     Texto e CTAs nunca esperam o vídeo: enquanto ele não chega, a rolagem dissolve do quadro inicial para o final (.hero__alt).
     A dissolução para o conteúdo é uma camada com opacity (.hero__fade): reescrever mask-image no <video> a cada quadro
     tirava o vídeo do caminho barato de composição.
     ------------------------------------------------------------------ */
  var hero = document.getElementById('hero');
  var heroSticky = hero.querySelector('.hero__sticky');
  var video = hero.querySelector('.hero__video');
  var heroAlt = hero.querySelector('.hero__alt');
  var heroFade = hero.querySelector('.hero__fade');
  var heroLogo = hero.querySelector('.hero__logo');
  var heroStart = hero.querySelector('.hero__start');
  var heroEnd = hero.querySelector('.hero__end');
  var heroPlay = hero.querySelector('.hero__play');

  var FPS = 24;                 // cadência dos dois arquivos (ffprobe): o alvo do seek anda de quadro em quadro
  var TAU_MS = 45;              // constante de tempo da suavização; ~63% do caminho em 45 ms, em qualquer taxa de tela
  var MAX_VIDEO_RATE = 2.5;     // o vídeo anda no máximo a 2,5× o tempo real. Medido (trace): acima de ~3× os seeks ficam distantes, cada um
                                // reinicia o decodificador de hardware e a GPU prende a apresentação por 100–200 ms; em gesto rápido o
                                // vídeo alcança o scroll em seguida (5 s de vídeo em até 2 s). Scroll normal (~1×) nunca encosta no teto.
  var MIN_SEEK_MS = 30;         // teto de ~33 seeks/s: vídeo de 24 fps não precisa de 120–240 pedidos por segundo
  var SEEK_WATCHDOG_MS = 600;   // seek sem resposta não prende o controlador
  var LOAD_TIMEOUT_MS = 8000;   // sem primeiro quadro até aqui: quadro final estático (só no mouse; no toque a rolagem segue com os dois quadros)
  var PROBE_SEEKS = 3;          // toque: seeks de prova logo após o primeiro, em quadros vizinhos (não se nota na tela)
  var SLOW_SEEK_MS = 200;       // mediana acima disto = menos de 5 quadros por segundo no scrub: o aparelho toca o vídeo sozinho (play)
  var ALT_FROM = 0.42, ALT_TO = 0.58; // sem vídeo ainda: o quadro final entra por cima do inicial neste trecho da rolagem
  var VIDEO_END = 0.96;         // o vídeo termina um pouco antes do fim do percurso: frase e CTAs assentam antes de soltar
  var FADE_START = 0.6, FADE_END = 0.74; // a base escurece enquanto ela termina de se virar: a frase nunca cai sobre a blusa clara
  var PHRASE_ON = 0.66, PHRASE_OFF = 0.58; // a frase final entra por tempo (CSS) quando ela se vira; a folga entre os dois pontos evita liga/desliga na fronteira
  var START_FADE_FROM = 0.03, START_FADE_TO = 0.12; // bloco inicial (apoio + CTA) some logo no começo do scrub
  var PLAY_START_FADE_FROM = 0.5, PLAY_START_FADE_TO = 0.62; // em reprodução a indicação fica até pouco antes da frase (no celular as duas ocupam a mesma faixa da tela)

  var coarse = window.matchMedia('(hover: none) and (pointer: coarse)');
  var narrow = window.matchMedia('(max-width: 768px)');
  var portrait = window.matchMedia('(max-aspect-ratio: 4/5)');
  var canPlayMp4 = !!(video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.42E01E"'));
  function saveData() { var c = navigator.connection; return !!(c && (c.saveData || /2g$/.test(c.effectiveType || ''))); } // 2G conta como economia

  var mode = '';                // '', 'scrub', 'play', 'static'
  var touchPlay = false;        // toque cujo seek não acompanha o dedo (medido pelos seeks de prova): fica em play
  var probe = null;             // { warm, times } enquanto os seeks de prova estão em curso
  var fetchCtl = null, blobUrl = ''; // toque: download do arquivo inteiro e o endereço do blob em uso
  var videoFailed = false, videoReady = false, videoAsked = false, srcKind = '', srcMode = '', playGate = false, gateTimer = 0, loadPending = false;
  var duration = 0, lastFrame = 0;
  var heroInView = true, heroNear = !hasIO, rafId = 0, lastTick = 0, loadTimer = 0, watchdog = 0;
  var heroTop = 0, scrollLen = 1;
  var targetProgress = 0, currentProgress = 0, videoProgress = 0; // current: textos e dissolução; video: o mesmo ponto, com teto de velocidade
  var seekInFlight = false, seekStartedAt = 0, requestedFrame = -1, shownFrame = -1;
  var playState = 'idle', autoPaused = false; // play: idle | playing | paused | ended | blocked

  /* só escreve no DOM quando o valor muda */
  var applied = { fade: -1, end: -1, start: -1, alt: -1 }, startOff = false;
  function setLayer(el, key, value) {
    var v = Math.round(value * 200) / 200;
    if (applied[key] === v) { return; }
    applied[key] = v;
    el.style.opacity = v;
    el.style.visibility = v > 0.02 ? 'visible' : 'hidden';
  }
  function applyHero(p) {
    // sem quadro de vídeo ainda (rede lenta, aparelho que adia o download): a rolagem dissolve do pôster inicial para o quadro final
    var a = mode === 'scrub' && !videoReady ? clamp((p - ALT_FROM) / (ALT_TO - ALT_FROM), 0, 1) : 0;
    setLayer(heroAlt, 'alt', a * a * (3 - 2 * a));
    setLayer(heroFade, 'fade', clamp((p - FADE_START) / (FADE_END - FADE_START), 0, 1));
    // frase final: não acompanha o scroll quadro a quadro (ficava meio transparente no caminho); liga uma vez e o CSS conduz a entrada
    if (p >= PHRASE_ON) { heroEnd.classList.add('is-on'); } else if (p < PHRASE_OFF) { heroEnd.classList.remove('is-on'); }
    var from = mode === 'play' ? PLAY_START_FADE_FROM : START_FADE_FROM, to = mode === 'play' ? PLAY_START_FADE_TO : START_FADE_TO;
    setLayer(heroStart, 'start', 1 - clamp((p - from) / (to - from), 0, 1));
    var off = applied.start <= 0.02; // indicação invisível: as animações dela param (site.css) em vez de rodar pelo resto da página
    if (off !== startOff) { startOff = off; heroStart.classList.toggle('is-off', off); }
  }
  /* só troca o pôster quando ele muda: reatribuir o mesmo endereço fazia o navegador pedir a imagem de novo */
  var POSTER_INICIO = 'assets/img/hero-poster-inicio.jpg', POSTER_FIM = 'assets/img/hero-poster-fim.jpg';
  function setPoster(url) { if (video.getAttribute('poster') !== url) { video.poster = url; } }
  function clearLayers() {
    applied.fade = applied.end = applied.start = applied.alt = -1; startOff = false;
    heroFade.style.cssText = ''; heroAlt.style.cssText = ''; heroEnd.classList.remove('is-on'); heroStart.style.cssText = ''; heroStart.classList.remove('is-off');
  }

  /* medidas lidas uma vez por resize, não a cada evento de scroll */
  function measureHero() {
    heroTop = hero.getBoundingClientRect().top + window.pageYOffset;
    // percurso com o hero pinado: altura do hero menos a do palco. Não usa innerHeight: no celular ele muda quando a barra de
    // endereço recolhe, e o palco (100lvh) não
    scrollLen = Math.max(1, hero.offsetHeight - heroSticky.offsetHeight);
  }
  function updateTarget() { targetProgress = clamp((window.pageYOffset - heroTop) / scrollLen, 0, 1); }

  /* ---- vídeo: carregado só quando o hero está por perto; nunca dois arquivos ao mesmo tempo ----
     m    retrato (celular e tablet em pé, janela estreita em pé): recorte central 3:4 da mesma cena, 810×1080. Em pé o vídeo
          deitado mostrava só um terço da largura e esticava 720 linhas na altura da tela; aqui são 1080 linhas, com ~35% menos
          peso que o arquivo de scrub de 720p (2,0 MB contra 3,1 MB).
     720  deitado em tela estreita ou celular deitado · 1080 demais telas */
  function wantedKind() {
    if (portrait.matches && (narrow.matches || coarse.matches)) { return 'm'; }
    return narrow.matches || (coarse.matches && Math.min(window.innerWidth, window.innerHeight) < 600) ? '720' : '1080';
  }
  function loadVideo(kind) {
    videoAsked = true; videoReady = false; srcKind = kind; srcMode = mode; playGate = false; probe = null;
    seekInFlight = false; shownFrame = requestedFrame = -1;
    video.muted = true; video.loop = false;
    video.preload = 'auto';
    // scrub: keyframe a cada 4 quadros (6 no retrato) e sem B-frames (seek barato). play: mesma imagem com GOP normal, ~40% do peso
    // (o retrato não tem versão play: só toca sozinho o aparelho que já baixou o arquivo de scrub e não acompanhou o seek)
    var url = 'assets/video/hero-' + kind + (mode === 'play' && kind !== 'm' ? '-play' : '') + '.mp4';
    if (mode === 'scrub' && coarse.matches && window.fetch && window.URL && URL.createObjectURL) { fetchVideo(url); } else { video.src = url; }
    armLoadTimer();
  }
  /* toque: o arquivo inteiro vai para a memória antes do primeiro seek. No celular o navegador não garante adiantar o download de
     um <video> parado (preload é só uma sugestão) e cada seek poderia virar uma ida à rede; com o blob todo seek é local.
     Se o fetch for barrado (file://, extensão), segue pelo streaming comum. */
  function fetchVideo(url) {
    if (fetchCtl && fetchCtl.abort) { fetchCtl.abort.abort(); } // download anterior ainda em curso (a tela virou no meio)
    var ctl = fetchCtl = { abort: window.AbortController ? new AbortController() : null };
    fetch(url, ctl.abort ? { signal: ctl.abort.signal } : undefined)
      .then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.blob(); })
      .then(function (blob) {
        if (fetchCtl !== ctl) { return; } // pedido antigo (trocou de arquivo ou de modo)
        releaseBlob();
        blobUrl = URL.createObjectURL(blob.type === 'video/mp4' ? blob : blob.slice(0, blob.size, 'video/mp4'));
        video.src = blobUrl;
      })
      .catch(function () { if (fetchCtl === ctl) { fetchCtl = null; video.src = url; } });
  }
  function releaseBlob() { if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = ''; } }
  /* o prazo de carregamento só conta com a aba visível: em segundo plano o navegador adia o download do vídeo, e a página aberta
     numa aba de fundo caía no quadro estático para sempre (medido no Chrome: hero is-static, src removido, sem reduced motion).
     No toque não há prazo: sem vídeo a rolagem continua contando a cena com os dois quadros (.hero__alt), e encurtar o hero
     debaixo do dedo seria pior que esperar. */
  function armLoadTimer() {
    clearTimeout(loadTimer);
    loadPending = document.hidden;
    if (loadPending || coarse.matches) { return; }
    loadTimer = setTimeout(function () { if (!videoReady || video.readyState < 2) { failVideo(); } }, LOAD_TIMEOUT_MS);
  }
  function ensureVideo() {
    if (videoAsked || !heroNear || (mode !== 'scrub' && mode !== 'play')) { return; }
    loadVideo(wantedKind());
  }
  function unloadVideo() {
    clearTimeout(loadTimer); clearTimeout(watchdog); clearTimeout(gateTimer); loadPending = false; probe = null;
    if (fetchCtl) { if (fetchCtl.abort) { fetchCtl.abort.abort(); } fetchCtl = null; }
    if (videoAsked) { video.pause(); video.removeAttribute('src'); video.load(); }
    releaseBlob();
    videoAsked = false; videoReady = false; seekInFlight = false;
  }
  function failVideo() { videoFailed = true; syncHeroMode(); } // sem vídeo: poster final + frase + CTAs, hero curto
  function bufferedEnd() {
    // fim do trecho contínuo já baixado: pedir além dele faria o navegador abandonar o download sequencial
    var b = video.buffered, t = video.currentTime, i;
    for (i = 0; i < b.length; i++) { if (b.start(i) <= t + 0.1 && b.end(i) >= t - 0.1) { return b.end(i); } }
    return b.length ? b.end(0) : 0;
  }

  video.addEventListener('loadedmetadata', function () {
    duration = video.duration || 0;
    lastFrame = Math.max(0, Math.round(duration * FPS) - 1);
    // toque: não espera 'loadeddata' (há celular que só decodifica o primeiro quadro depois de um seek ou de um play).
    // O primeiro seek já parte daqui, põe o quadro na tela e abre os seeks de prova
    if (mode === 'scrub' && coarse.matches && !videoReady && duration) { probe = { warm: false, times: [] }; seek(frameToRequest(), performance.now()); }
  });
  video.addEventListener('loadeddata', function () {
    videoReady = true; clearTimeout(loadTimer);
    if (mode === 'scrub') { applyHero(currentProgress); wake(); }
    // play: só começa quando o navegador estima que toca sem engasgar; rede lenta ganha no máximo 3 s de espera com poster + texto
    else if (mode === 'play') { clearTimeout(gateTimer); gateTimer = setTimeout(function () { playGate = true; tryAutoplay(); }, 3000); }
  });
  video.addEventListener('canplaythrough', function () { playGate = true; tryAutoplay(); });
  video.addEventListener('error', function () { if (videoAsked) { failVideo(); } });
  video.addEventListener('progress', function () { if (mode === 'scrub') { wake(); } }); // chegou mais vídeo: alcança o alvo
  video.addEventListener('seeked', function () {
    clearTimeout(watchdog);
    // seek que o watchdog já deu por perdido não conta — menos o primeiro do toque: a resposta dele, mesmo atrasada (o aparelho
    // ainda abria o decodificador), é o sinal de que há quadro na tela
    if (!seekInFlight && videoReady) { return; }
    var now = performance.now();
    seekInFlight = false; shownFrame = requestedFrame;
    if (!videoReady) { videoReady = true; clearTimeout(loadTimer); applyHero(currentProgress); }
    if (probe) {
      if (probe.warm) { probe.times.push(now - seekStartedAt); } else { probe.warm = true; } // o primeiro aquece o decodificador e não conta
      if (probe.times.length >= PROBE_SEEKS) { endProbe(); }
    }
    if (mode === 'scrub' && heroInView && !document.hidden) { requestFrame(now); wake(); } // o próximo alvo não espera o rAF seguinte
  });

  /* ---- scrub ---- */
  function wantedFrame() { return Math.min(lastFrame, Math.round(clamp(videoProgress / VIDEO_END, 0, 1) * lastFrame)); }
  function frameToRequest() { // o quadro desejado, contido no que já foi baixado
    var frame = wantedFrame();
    if (blobUrl || coarse.matches) { return frame; } // toque: o arquivo já está na memória (ou, sem blob, o seek é quem puxa os dados)
    var limit = Math.floor((bufferedEnd() - 0.04) * FPS);
    return limit < lastFrame && frame > limit ? Math.max(0, limit) : frame;
  }
  function seek(frame, now) {
    seekInFlight = true; seekStartedAt = now; requestedFrame = frame;
    video.currentTime = (frame + 0.5) / FPS; // meio do quadro: arredondamento não cai no vizinho
    clearTimeout(watchdog);
    watchdog = setTimeout(function () {
      seekInFlight = false;
      if (probe && probe.warm) { probe.times.push(SEEK_WATCHDOG_MS); if (probe.times.length >= PROBE_SEEKS) { endProbe(); } } // seek de prova sem resposta conta como lento
      wake();
    }, SEEK_WATCHDOG_MS);
  }
  function requestFrame(now) {
    // no máximo um seek em andamento; o alvo é sempre o mais recente — não existe fila de alvos antigos
    if (!videoReady || !duration || seekInFlight || now - seekStartedAt < MIN_SEEK_MS) { return; }
    var frame = probe ? probeFrame(frameToRequest()) : frameToRequest();
    if (frame === shownFrame) { return; }
    seek(frame, now);
  }
  /* seeks de prova (toque): quadros vizinhos do alvo, a 3, 2 e 1 de distância — na tela a diferença não se nota, para o
     decodificador é um seek de verdade. Medem se o aparelho acompanha o dedo antes de a pessoa começar a rolar. */
  function probeFrame(base) {
    var d = PROBE_SEEKS - probe.times.length, f = base + d <= lastFrame ? base + d : base - d;
    return f === shownFrame ? (f < lastFrame ? f + 1 : f - 1) : f;
  }
  function endProbe() {
    var t = probe.times.slice().sort(function (a, b) { return a - b; }), median = t[Math.floor(t.length / 2)];
    probe = null;
    if (median <= SLOW_SEEK_MS) { return; }
    // aparelho lento para seek: em vez de um scrub aos trancos, o vídeo toca uma vez sozinho — com o arquivo que já está na memória
    touchPlay = true; srcMode = 'play'; playGate = true;
    syncHeroMode();
  }
  function tick(now) {
    rafId = 0;
    if (mode !== 'scrub' || !heroInView || document.hidden) { lastTick = 0; return; }
    var dt = lastTick ? Math.min(50, now - lastTick) : 16.7; // dt limitado: voltar de aba oculta não dá salto
    lastTick = now;
    currentProgress += (targetProgress - currentProgress) * (1 - Math.exp(-dt / TAU_MS));
    if (Math.abs(targetProgress - currentProgress) < 0.0015) { currentProgress = targetProgress; }
    // o vídeo persegue o mesmo ponto com teto de velocidade; frase, CTAs e dissolução não esperam por ele
    var maxStep = duration ? MAX_VIDEO_RATE * (dt / 1000) * VIDEO_END / duration : 1;
    videoProgress += clamp(currentProgress - videoProgress, -maxStep, maxStep);
    applyHero(currentProgress);
    requestFrame(now);
    // dorme quando chegou ao alvo; com seek em andamento quem acorda é o 'seeked' (ou o watchdog)
    var pendingFrame = videoReady && duration && !seekInFlight && (probe || frameToRequest() !== shownFrame);
    if (currentProgress !== targetProgress || videoProgress !== currentProgress || pendingFrame) { rafId = requestAnimationFrame(tick); } else { lastTick = 0; }
  }
  function wake() { if (mode === 'scrub' && !rafId && heroInView && !document.hidden) { rafId = requestAnimationFrame(tick); } }
  function onScrollHero() { updateTarget(); wake(); }
  function onResizeHero() { measureHero(); updateTarget(); wake(); }

  /* ---- play (toque) ---- */
  function setPlayState(state) {
    playState = state;
    heroPlay.dataset.state = state;
    // Na exibição normal não há botões de pausa/repetição. Só oferece play se o autoplay for recusado.
    heroPlay.hidden = mode !== 'play' || state !== 'blocked';
  }
  function playTick() {
    rafId = 0;
    if (mode !== 'play') { return; }
    var p = video.ended ? 1 : (duration ? clamp(video.currentTime / duration, 0, 1) * VIDEO_END : 0);
    applyHero(p);
    if (playState === 'playing' && !video.paused && !video.ended) { rafId = requestAnimationFrame(playTick); }
  }
  function startPlayback() {
    if (!videoReady) { return; }
    if (video.ended || playState === 'blocked' || playState === 'ended') { video.currentTime = 0; applyHero(0); }
    var attempt = video.play();
    setPlayState('playing'); autoPaused = false;
    if (!rafId) { rafId = requestAnimationFrame(playTick); }
    if (attempt && attempt.catch) {
      attempt.catch(function () {
        if (mode !== 'play') { return; }
        // autoplay recusado: quadro final, frase e CTAs à vista, e um botão claro para quem quiser ver
        setPlayState('blocked'); setPoster(POSTER_FIM);
        if (duration) { video.currentTime = Math.max(0, duration - 0.03); }
        applyHero(1);
      });
    }
  }
  function tryAutoplay() {
    if (mode !== 'play' || playState !== 'idle' || !videoReady || !playGate || !introDone || !heroInView || document.hidden) { return; }
    startPlayback();
  }
  function syncPlayVisibility() {
    if (mode !== 'play') { return; }
    var visible = heroInView && !document.hidden;
    if (!visible && playState === 'playing') { video.pause(); autoPaused = true; setPlayState('paused'); }
    else if (visible && autoPaused && playState === 'paused') { startPlayback(); }
    else if (visible) { tryAutoplay(); }
  }
  heroPlay.addEventListener('click', function () {
    if (mode !== 'play' || playState !== 'blocked') { return; }
    if (!videoAsked) { heroNear = true; ensureVideo(); }
    startPlayback();
  });
  video.addEventListener('ended', function () { if (mode === 'play') { setPlayState('ended'); applyHero(1); } });

  /* ---- troca de modo ---- */
  function setMode(next) {
    if (next === mode) { return; }
    var before = hero.offsetHeight, yBefore = window.pageYOffset;
    if (mode === 'scrub') { window.removeEventListener('scroll', onScrollHero); window.removeEventListener('resize', onResizeHero); }
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    lastTick = 0;
    mode = next;
    hero.classList.toggle('is-scrub', mode === 'scrub');
    hero.classList.toggle('is-play', mode === 'play');
    hero.classList.toggle('is-static', mode === 'static');
    root.classList.toggle('hero-scrub', mode === 'scrub'); // altura longa + sticky só existem no scrub
    heroPlay.hidden = true;
    clearLayers();

    if (mode === 'static') {
      unloadVideo();
      setPoster(POSTER_FIM);
    } else {
      measureHero(); updateTarget();
      currentProgress = videoProgress = mode === 'scrub' ? targetProgress : 0; // recarregar no meio da página não "rebobina" o vídeo
      setPoster(currentProgress > 0.5 ? POSTER_FIM : POSTER_INICIO);
      applyHero(currentProgress);
      if (mode === 'scrub') {
        video.pause();
        window.addEventListener('scroll', onScrollHero, { passive: true });
        window.addEventListener('resize', onResizeHero);
        wake();
      } else {
        setPlayState('idle'); autoPaused = false;
      }
      if (videoAsked && srcMode !== mode) { unloadVideo(); } // scrub e play usam arquivos diferentes
      ensureVideo();
      if (mode === 'play' && videoReady) { tryAutoplay(); }
    }
    // o hero mudou de altura com a página já rolada: mantém o conteúdo onde o visitante estava
    // (parte de yBefore: onde há scroll anchoring o navegador já corrigiu sozinho e não se corrige duas vezes)
    var delta = before - hero.offsetHeight, y = Math.max(heroTop, yBefore - delta);
    if (delta && yBefore > heroTop + 1 && Math.abs(window.pageYOffset - y) > 2) {
      try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); }
    }
    measureHero();
  }
  function syncHeroMode() {
    if (reduced.matches || !canPlayMp4 || saveData() || videoFailed) { setMode('static'); }
    else { setMode(coarse.matches && touchPlay ? 'play' : 'scrub'); }
  }
  syncHeroMode();
  if (coarse.addEventListener) { coarse.addEventListener('change', syncHeroMode); }
  /* a tela mudou de formato (janela que alargou, celular que virou): troca de arquivo mantendo o quadro. Só não desce de 1080
     para 720 — quem já baixou o maior fica com ele. */
  var upgradeTimer = 0;
  function onShapeChange() {
    clearTimeout(upgradeTimer);
    upgradeTimer = setTimeout(function () {
      var kind = wantedKind();
      if (mode !== 'scrub' || !videoAsked || kind === srcKind || (srcKind === '1080' && kind === '720')) { return; }
      loadVideo(kind);
    }, 500);
  }
  if (narrow.addEventListener) { narrow.addEventListener('change', onShapeChange); portrait.addEventListener('change', onShapeChange); }

  // a assinatura do hero só entra depois que a da intro terminou de sumir: nunca dois logos ao mesmo tempo
  var hadIntro = !introDone;
  onIntroDone(function () {
    setTimeout(function () { heroLogo.classList.add('is-loaded'); }, hadIntro ? 600 : 0);
    tryAutoplay();
  });

  if (hasIO) {
    new IntersectionObserver(function (entries) {
      heroInView = entries[0].isIntersecting;
      if (heroInView) { updateTarget(); wake(); }
      syncPlayVisibility();
    }, { rootMargin: '200px 0px 200px 0px' }).observe(hero);
    // quem chega por âncora ou com a rolagem restaurada longe do hero não baixa o vídeo até se aproximar dele
    // (âncora, recarga e voltar/avançar: a primeira observação chega antes de o navegador pular para o destino — espera assentar)
    var nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    var startedFar = !!location.hash || window.pageYOffset > window.innerHeight || !!(nav && nav.type !== 'navigate');
    new IntersectionObserver(function (entries) {
      heroNear = entries[0].isIntersecting;
      if (!heroNear) { return; }
      if (!startedFar) { ensureVideo(); return; }
      startedFar = false;
      var lastY = window.pageYOffset;
      setTimeout(function settle() { // rolagem suave até a âncora ainda em curso: espera parar
        if (window.pageYOffset !== lastY) { lastY = window.pageYOffset; setTimeout(settle, 250); return; }
        if (heroNear) { ensureVideo(); }
      }, 400);
    }, { rootMargin: '100% 0px 100% 0px' }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { lastTick = 0; updateTarget(); wake(); }
    if (videoAsked && !videoReady && (document.hidden || loadPending)) { armLoadTimer(); } // oculta: suspende o prazo; de volta: conta do zero
    syncPlayVisibility();
  });

  /* cabeçalho, menu, entradas das seções e linhas de progresso: assets/js/exo.js */

  /* ------------------------------------------------------------------
     Rede de empresas: caminhos calculados a partir dos blocos reais.
     Lado a lado com o núcleo → linhas horizontais; núcleo abaixo → eixo vertical.
     ------------------------------------------------------------------ */
  if (document.getElementById('rede')) { // a rede saiu do layout do Programa Comércio Digital; o bloco fica para versões que a tenham
  var rede = document.getElementById('rede');
  var redeSvg = rede.querySelector('.rede__svg');
  var links = [
    { from: 'onex', to: 'hub', kind: 'draw' }, { from: 'brnet', to: 'hub', kind: 'draw' },
    { from: 'hub', to: 'siteflux', kind: 'pulse' }, { from: 'hub', to: 'odinchat', kind: 'pulse' }
  ];
  links.forEach(function (l) {
    l.base = document.createElementNS(SVG_NS, 'path'); l.base.setAttribute('class', 'rede__base');
    l.anim = document.createElementNS(SVG_NS, 'path'); l.anim.setAttribute('class', 'rede__' + l.kind);
    l.anim.setAttribute('pathLength', '1');
    redeSvg.appendChild(l.base); redeSvg.appendChild(l.anim);
  });

  function box(name) {
    // offset* ignora transform: hover e o pulso do núcleo não deslocam as âncoras (.rede é o offsetParent)
    var el = rede.querySelector('[data-node="' + name + '"]');
    var x = el.offsetLeft, y = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
    return { l: x, t: y, r: x + w, b: y + h, cx: x + w / 2, cy: y + h / 2 };
  }
  function n1(v) { return Math.round(v * 10) / 10; }
  // vertical → horizontal → vertical, cantos arredondados
  function elbow(x1, y1, x2, y2, yMid) {
    var dx = x2 - x1;
    if (Math.abs(dx) < 2) { return 'M' + n1(x1) + ' ' + n1(y1) + 'V' + n1(y2); }
    var r = Math.min(16, Math.abs(dx) / 2, Math.abs(yMid - y1), Math.abs(y2 - yMid)), s = dx > 0 ? 1 : -1;
    return 'M' + n1(x1) + ' ' + n1(y1) + 'V' + n1(yMid - r) +
      'Q' + n1(x1) + ' ' + n1(yMid) + ' ' + n1(x1 + s * r) + ' ' + n1(yMid) +
      'H' + n1(x2 - s * r) + 'Q' + n1(x2) + ' ' + n1(yMid) + ' ' + n1(x2) + ' ' + n1(yMid + r) + 'V' + n1(y2);
  }
  function layoutRede() {
    var hub = box('hub');
    redeSvg.setAttribute('viewBox', '0 0 ' + rede.offsetWidth + ' ' + rede.offsetHeight);
    links.forEach(function (l) {
      var d, a, b;
      if (l.to === 'hub') {
        a = box(l.from);
        if (hub.cy > a.t && hub.cy < a.b) { // mesma faixa: linha reta até a borda do núcleo
          d = a.cx < hub.cx ? 'M' + n1(a.r) + ' ' + n1(hub.cy) + 'H' + n1(hub.l) : 'M' + n1(a.l) + ' ' + n1(hub.cy) + 'H' + n1(hub.r);
        } else {
          d = elbow(a.cx, a.b, hub.cx + (a.cx < hub.cx ? -14 : 14), hub.t + 6, (a.b + hub.t) / 2);
        }
      } else {
        b = box(l.to);
        d = elbow(hub.cx, hub.b, b.cx, b.t, b.t - 26);
      }
      l.base.setAttribute('d', d); l.anim.setAttribute('d', d);
    });
  }
  layoutRede();
  if ('ResizeObserver' in window) { new ResizeObserver(layoutRede).observe(rede); }
  window.addEventListener('resize', layoutRede); // reforço para navegadores sem ResizeObserver
  window.addEventListener('load', layoutRede);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(layoutRede); }

  // ênfase sutil do trajeto da empresa em hover/foco; dispensável no toque
  links.forEach(function (l) {
    var name = l.to === 'hub' ? l.from : l.to, el = rede.querySelector('[data-node="' + name + '"]');
    function on() { l.base.classList.add('is-active'); }
    function off() { l.base.classList.remove('is-active'); }
    el.addEventListener('mouseenter', on); el.addEventListener('mouseleave', off);
    el.addEventListener('focusin', on); el.addEventListener('focusout', off);
  });
  } // fim do bloco da rede

  /* ------------------------------------------------------------------
     Loops (mapa e rede): começam quando visíveis, pausam fora da tela e em
     aba oculta por animation-play-state — o relógio de 8s não reinicia.
     O mapa parte com 35% dele na tela: a entrada (municípios, nós e teia, abertura.css) dura
     pouco mais de 1 s e precisa estar à vista de quem chega rolando.
     ------------------------------------------------------------------ */
  var nets = Array.prototype.slice.call(document.querySelectorAll('.net'));
  if (hasIO) {
    var netIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var net = entry.target;
        if (entry.isIntersecting && !reduced.matches) { net.classList.add('is-live'); }
        net.classList.toggle('is-paused', !entry.isIntersecting);
      });
    }, { threshold: 0.35 });
    nets.forEach(function (net) { netIO.observe(net); });
  }
  function syncHidden() { root.classList.toggle('is-hidden', document.hidden); }
  document.addEventListener('visibilitychange', syncHidden);
  syncHidden(); // a aba pode já nascer oculta

  /* A preferência do sistema continua controlando o movimento, sem botão na apresentação. */
  function syncReduced() {
    if (reduced.matches) { nets.forEach(function (net) { net.classList.remove('is-live'); }); }
    syncHeroMode();
  }
  if (reduced.addEventListener) { reduced.addEventListener('change', syncReduced); }
  syncReduced();
})();
