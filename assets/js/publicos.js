/* Vale do Aço Digital — #para-quem: sequência única dos três mockups (estados e coreografia em publicos.css).
   Sem este arquivo, sem IntersectionObserver ou com reduced motion, vale a composição final parada do CSS.
   Nenhum rAF, nenhum listener de mousemove/scroll: só IntersectionObserver, visibilitychange e animationend. */
(function () {
  'use strict';
  var root = document.documentElement;
  var section = document.getElementById('para-quem');
  if (!section || !('IntersectionObserver' in window) || !window.matchMedia) { return; }
  var vizes = Array.prototype.slice.call(section.querySelectorAll('.publico__viz'));
  if (!vizes.length) { return; }
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pending = vizes.length, io;

  function still() { return reduced.matches || root.classList.contains('motion-off'); }

  /* encerra a cena: tira as classes de estado e, com elas, todas as animações; fica a composição final do CSS */
  function finish(viz) {
    if (viz.pqDone) { return; }
    viz.pqDone = true;
    clearTimeout(viz.pqTimer);
    viz.classList.remove('is-armed', 'is-playing', 'is-paused');
    io.unobserve(viz);
    if (--pending === 0) { teardown(); }
  }
  function finishAll() { vizes.forEach(finish); }

  function play(viz) {
    if (viz.pqDone || viz.pqStarted) { return; }
    if (still()) { finish(viz); return; }
    viz.pqStarted = true;
    viz.classList.add('is-playing');
    /* rede de segurança: se o animationend da sentinela não chegar, a cena assume o estado final mesmo assim */
    viz.pqTimer = setTimeout(function () { finish(viz); }, 12000);
  }

  function onEnd(e) { if (e.target === e.currentTarget && e.animationName === 'pq-fim') { finish(e.currentTarget); } }
  function onVisibility() {
    section.classList.toggle('pq-hidden', document.hidden);
    /* aba oculta não renderiza, então o estilo novo só seria calculado na volta e o relógio das animações seguiria correndo:
       consultar as animações da cena aplica o animation-play-state agora (uma consulta por troca de visibilidade, nenhuma em repouso) */
    vizes.forEach(function (viz) {
      if (!viz.pqStarted || viz.pqDone) { return; }
      if (viz.getAnimations) { viz.getAnimations({ subtree: true }); } else { void window.getComputedStyle(viz).animationPlayState; }
    });
  }
  function onStill() { if (still()) { finishAll(); } }

  function teardown() {
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    if (reduced.removeEventListener) { reduced.removeEventListener('change', onStill); }
    section.classList.remove('pq-hidden');
  }

  if (still()) { return; }

  io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var viz = entry.target;
      if (viz.pqDone) { return; }
      /* fora da viewport no meio da sequência: congela (animation-play-state) e continua de onde parou ao voltar */
      viz.classList.toggle('is-paused', !entry.isIntersecting);
      if (entry.isIntersecting && entry.intersectionRatio >= 0.45) { play(viz); }
    });
  }, { threshold: [0, 0.45] });

  vizes.forEach(function (viz) {
    viz.classList.add('is-armed');
    viz.addEventListener('animationend', onEnd);
    io.observe(viz);
  });

  document.addEventListener('visibilitychange', onVisibility);
  onVisibility(); // a aba pode já nascer oculta
  if (reduced.addEventListener) { reduced.addEventListener('change', onStill); }
})();
