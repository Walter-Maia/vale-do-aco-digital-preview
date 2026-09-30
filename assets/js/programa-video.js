/* Vídeo de apresentação no quadro preto (30/09/2026).
   - Com movimento: começa mudo e em loop quando o bloco está na tela (navegadores só tocam sozinho se estiver mudo),
     pausa fora da tela e com a aba oculta; o botão (só o ícone) liga e desliga o áudio sem reiniciar o vídeo.
   - ?fx=0 ou movimento reduzido: nada toca sozinho; ficam os controles nativos do vídeo (como sem JS).
   O arquivo só é baixado quando o vídeo toca (preload="none"). */
(function () {
  'use strict';
  var v = document.querySelector('.quadro__video');
  var btn = document.querySelector('.quadro__som');
  if (!v || !btn) { return; }
  var mqRM = matchMedia('(prefers-reduced-motion: reduce)');
  if (/[?&]fx=0(&|$)/.test(location.search) || mqRM.matches) { return; }   // controles nativos, sem autoplay

  var rotulo = btn.querySelector('.quadro__som-rotulo');
  var perto = false, tocando = false, desligado = false;
  v.removeAttribute('controls');
  btn.hidden = false;

  function nativo() {   // se o navegador recusar tocar (economia de energia etc.), devolve os controles nativos
    desligado = true;
    v.setAttribute('controls', '');
    btn.hidden = true;
  }
  function atualiza() {
    if (desligado) { return; }
    var deve = perto && !document.hidden;
    if (deve && !tocando) {
      tocando = true;
      var p = v.play();
      if (p && p.catch) { p.catch(function () { tocando = false; nativo(); }); }
    } else if (!deve && tocando) {
      tocando = false;
      v.pause();
    }
  }
  function marcaSom() {
    var ligado = !v.muted;
    btn.setAttribute('aria-pressed', String(ligado));
    btn.classList.toggle('is-som', ligado);
    rotulo.textContent = ligado ? 'Desativar som' : 'Ativar som';
  }

  btn.addEventListener('click', function () {
    v.muted = !v.muted;   // só liga/desliga o som: o vídeo continua de onde está
    marcaSom();
    if (v.paused) { tocando = false; perto = true; atualiza(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      perto = entries[entries.length - 1].isIntersecting;
      atualiza();
    }, { threshold: 0.25 }).observe(v);
  } else { perto = true; atualiza(); }
  document.addEventListener('visibilitychange', atualiza);

  var aoMudarRM = function () { if (mqRM.matches) { v.pause(); tocando = false; perto = false; nativo(); } };
  if (mqRM.addEventListener) { mqRM.addEventListener('change', aoMudarRM); } else if (mqRM.addListener) { mqRM.addListener(aoMudarRM); }
  marcaSom();
})();
