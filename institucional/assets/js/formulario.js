/* Vale do Aço Digital — formulários de participação, no estilo Typeform: uma pergunta por tela, teclado primeiro.
   Os três formulários (movimento, empresas, profissionais) moram aqui e são escolhidos por ?tipo= no endereço; as pílulas do site
   apontam para cada um. É uma PRÉVIA: nada é enviado. No fim, as respostas aparecem na tela e no console, no formato que um envio
   de verdade mandaria — para ligar a um backend, troque o setTimeout de enviar() por um fetch com `dados`. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------------- os três formulários ---------------- */
  var CIDADES = ['Ipatinga', 'Coronel Fabriciano', 'Timóteo', 'Santana do Paraíso', 'Outra cidade do Vale do Aço', 'Fora do Vale do Aço'];
  var CONTATO = {
    id: 'contato', tipo: 'aceite', rotulo: 'Autoriza o contato',
    titulo: 'Podemos falar com você por e-mail e WhatsApp sobre o movimento?',
    ajuda: 'Seus dados ficam com o Vale do Aço Digital e servem só para isso. Você pode pedir para sair quando quiser.',
    opcoes: ['Sim, pode falar comigo', 'Agora não'],
    erro: 'Sem essa autorização a gente não consegue te chamar. Se mudar de ideia, é só escolher “Sim”.'
  };
  var FORMS = {
    movimento: {
      nome: 'Participe do movimento', cor: 'a', titulo: ['Participe', 'do movimento'],
      texto: 'Conte um pouco sobre você e como quer fazer parte. A gente volta com os próximos passos.',
      tempo: 'Leva uns 2 minutos',
      fim: ['Obrigado,', 'Você agora faz parte do movimento Vale do Aço Digital. Em breve a gente se fala.'],
      whats: 'Olá! Sou {nome} e quero participar do movimento Vale do Aço Digital.',
      perguntas: [
        { id: 'nome', tipo: 'texto', rotulo: 'Nome', titulo: 'Para começar, qual é o seu nome?', placeholder: 'Seu nome completo', auto: 'name' },
        { id: 'email', tipo: 'email', rotulo: 'E-mail', titulo: 'Prazer, {nome}! Qual é o seu melhor e-mail?', ajuda: 'É por ele que chegam as novidades do movimento.' },
        { id: 'whatsapp', tipo: 'tel', rotulo: 'WhatsApp', titulo: 'E o seu WhatsApp, com DDD?' },
        { id: 'cidade', tipo: 'escolha', rotulo: 'Cidade', titulo: 'Em qual cidade você mora?', opcoes: CIDADES },
        { id: 'perfil', tipo: 'escolha', rotulo: 'Chega como', titulo: 'Você chega ao movimento como…', opcoes: ['Dono(a) ou gestor(a) de um negócio', 'Profissional de tecnologia', 'Profissional de outra área', 'Estudante', 'Cidadão que quer acompanhar'] },
        { id: 'interesses', tipo: 'varias', rotulo: 'Interesses', titulo: 'O que mais te interessa no movimento?', ajuda: 'Escolha quantas quiser.', opcoes: ['Conectividade e internet', 'Dados e nuvem', 'Segurança digital', 'Cursos e capacitação', 'Encontros e eventos', 'Oportunidades de negócio'] },
        { id: 'participacao', tipo: 'escolha', rotulo: 'Quer participar', titulo: 'E como você quer participar?', opcoes: ['Acompanhando as novidades', 'Indo aos encontros do movimento', 'Apoiando como voluntário(a)', 'Levando o movimento para a minha empresa'] },
        { id: 'mensagem', tipo: 'longo', rotulo: 'Mensagem', opcional: true, titulo: 'Quer deixar um recado para o movimento?', ajuda: 'Opcional. Uma ideia, uma dúvida, um pedido.', placeholder: 'Escreva aqui…' },
        CONTATO
      ]
    },
    empresas: {
      nome: 'Empresas de tecnologia', cor: 'b', titulo: ['Empresas', 'de tecnologia'],
      texto: 'Sua empresa pode ajudar a digitalizar o Vale do Aço por completo. Conte quem vocês são e como querem participar.',
      tempo: 'Leva uns 3 minutos',
      fim: ['Obrigado,', 'Recebemos o interesse da {empresa}. Nossa equipe vai entrar em contato para conversar sobre a participação no movimento.'],
      whats: 'Olá! Sou {nome}, da {empresa}, e queremos participar do Vale do Aço Digital.',
      perguntas: [
        { id: 'empresa', tipo: 'texto', rotulo: 'Empresa', titulo: 'Qual é o nome da empresa?', placeholder: 'Nome da empresa', auto: 'organization' },
        { id: 'nome', tipo: 'texto', rotulo: 'Contato', titulo: 'E quem fala pela {empresa}?', placeholder: 'Seu nome completo', auto: 'name' },
        { id: 'cargo', tipo: 'escolha', rotulo: 'Papel', titulo: 'Qual é o seu papel na empresa, {nome}?', opcoes: ['Sócio(a) ou fundador(a)', 'Diretor(a) ou gestor(a)', 'Comercial ou relacionamento', 'Marketing', 'Outro'] },
        { id: 'email', tipo: 'email', rotulo: 'E-mail', titulo: 'Qual é o seu e-mail de trabalho?', placeholder: 'nome@suaempresa.com.br' },
        { id: 'whatsapp', tipo: 'tel', rotulo: 'WhatsApp', titulo: 'E um WhatsApp para contato?' },
        { id: 'cidade', tipo: 'escolha', rotulo: 'Cidade', titulo: 'Onde fica a empresa?', opcoes: CIDADES },
        { id: 'areas', tipo: 'varias', rotulo: 'Áreas', titulo: 'Em que a {empresa} atua?', ajuda: 'Escolha quantas quiser.', opcoes: ['Internet e conectividade', 'Data center e nuvem', 'Segurança da informação', 'Desenvolvimento de software', 'Suporte e infraestrutura de TI', 'Marketing e presença digital', 'Equipamentos e hardware', 'Outra área'] },
        { id: 'porte', tipo: 'escolha', rotulo: 'Pessoas na empresa', titulo: 'Quantas pessoas trabalham na empresa?', opcoes: ['De 1 a 9', 'De 10 a 49', 'De 50 a 199', '200 ou mais'] },
        { id: 'participacao', tipo: 'varias', rotulo: 'Quer participar', titulo: 'Como a {empresa} quer participar do movimento?', ajuda: 'Escolha quantas quiser.', opcoes: ['Sendo parceira do movimento', 'Apoiando ou patrocinando encontros', 'Oferecendo cursos e capacitação', 'Contratando talentos da região', 'Fazendo negócios com outras empresas'] },
        { id: 'site', tipo: 'link', rotulo: 'Site ou Instagram', opcional: true, titulo: 'Tem um site ou Instagram para a gente conhecer?', ajuda: 'Opcional.', placeholder: 'suaempresa.com.br ou @suaempresa', auto: 'url' },
        CONTATO
      ]
    },
    profissionais: {
      nome: 'Profissionais de tecnologia', cor: 'c', titulo: ['Profissionais', 'de tecnologia'],
      texto: 'Quem trabalha com tecnologia no Vale do Aço tem lugar no movimento. Conte sobre você e o que você procura.',
      tempo: 'Leva uns 2 minutos',
      fim: ['Valeu,', 'Seu perfil entrou para a rede de profissionais do movimento. Quando surgir uma oportunidade ou um encontro com a sua cara, você fica sabendo.'],
      whats: 'Olá! Sou {nome}, profissional de tecnologia, e quero participar do Vale do Aço Digital.',
      perguntas: [
        { id: 'nome', tipo: 'texto', rotulo: 'Nome', titulo: 'Para começar, qual é o seu nome?', placeholder: 'Seu nome completo', auto: 'name' },
        { id: 'email', tipo: 'email', rotulo: 'E-mail', titulo: 'Qual é o seu e-mail, {nome}?' },
        { id: 'whatsapp', tipo: 'tel', rotulo: 'WhatsApp', titulo: 'E o seu WhatsApp, com DDD?' },
        { id: 'cidade', tipo: 'escolha', rotulo: 'Cidade', titulo: 'Em qual cidade você mora?', opcoes: CIDADES },
        { id: 'area', tipo: 'escolha', rotulo: 'Área', titulo: 'Qual é a sua área?', opcoes: ['Desenvolvimento de software', 'Infraestrutura e redes', 'Segurança da informação', 'Dados e inteligência artificial', 'Design e experiência do usuário', 'Suporte técnico', 'Gestão de TI ou de produto', 'Outra área'] },
        { id: 'experiencia', tipo: 'escolha', rotulo: 'Experiência', titulo: 'Há quanto tempo você trabalha com tecnologia?', opcoes: ['Estou começando agora', 'Até 2 anos', 'De 2 a 5 anos', 'De 5 a 10 anos', 'Mais de 10 anos'] },
        { id: 'busca', tipo: 'varias', rotulo: 'Busca', titulo: 'O que você busca no movimento?', ajuda: 'Escolha quantas quiser.', opcoes: ['Oportunidades de trabalho', 'Cursos e capacitação', 'Conhecer gente da área', 'Ensinar ou mentorar', 'Empreender'] },
        { id: 'link', tipo: 'link', rotulo: 'LinkedIn ou portfólio', opcional: true, titulo: 'Tem um LinkedIn ou portfólio?', ajuda: 'Opcional.', placeholder: 'linkedin.com/in/seu-nome', auto: 'url' },
        CONTATO
      ]
    }
  };

  var tipo = (new URLSearchParams(location.search).get('tipo') || '').toLowerCase();
  if (!FORMS.hasOwnProperty(tipo)) { tipo = 'movimento'; }
  var F = FORMS[tipo], Q = F.perguntas, N = Q.length;
  var CAMPO = { texto: 1, email: 1, tel: 1, link: 1, longo: 1 };
  var WA = 'https://wa.me/5531989048888?text=';

  var form = document.getElementById('tf-form'), barra = document.querySelector('.tf-progresso');
  var anuncio = document.getElementById('tf-anuncio'), conta = document.getElementById('tf-conta');
  var btVoltar = document.querySelector('[data-acao="voltar"]'), btSeguir = document.querySelector('[data-acao="seguir"]');
  var resp = {}, passos = [], atual = 0, alcance = 0, tAuto = 0; // passo 0 = abertura; 1..N = perguntas; N + 1 = fim

  document.body.classList.add('tf--' + F.cor);
  document.title = F.nome + ' — Vale do Aço Digital';
  document.getElementById('tf-nome').textContent = F.nome;

  /* ---------------- respostas no texto: {nome} vira o primeiro nome, {empresa} o nome da empresa ---------------- */
  function primeiro(v) { v = (v || '').trim().split(/\s+/)[0] || ''; return v.charAt(0).toUpperCase() + v.slice(1); }
  function pipe(s) { return s.replace(/\{(\w+)\}/g, function (m, k) { return k === 'nome' ? primeiro(resp.nome) : (resp[k] || '').trim(); }); }

  /* ---------------- montagem ---------------- */
  var ICONE = {
    seta: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    conversa: '<path d="M5.2 18.8 6.3 15A7.6 7.6 0 1 1 9 17.7Z"/>',
    alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>'
  };
  function svg(nome, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONE[nome] + '</svg>'; }
  function pilula(rot, icone, attrs) {
    return '<button type="button" class="pilula pilula--' + F.cor + '" ' + attrs + '><span class="pilula__rot">' + rot + '</span><span class="pilula__seta" aria-hidden="true">' + svg(icone) + '</span></button>';
  }
  function dica(q) {
    if (q && q.tipo === 'longo') { return '<span class="tf-dica"><kbd>Shift</kbd> + <kbd>Enter ↵</kbd> para nova linha</span>'; }
    return '<span class="tf-dica">ou pressione <kbd>Enter ↵</kbd></span>';
  }

  function htmlAbertura() {
    var outros = Object.keys(FORMS).filter(function (k) { return k !== tipo; }).map(function (k) { return '<a href="?tipo=' + k + '">' + FORMS[k].nome + '</a>'; });
    return '<div class="tf-passo__miolo tf-abre">' +
      '<h1 class="tf-titulo" id="tf-p0" style="--i:0"><span class="tf-titulo__l1">' + F.titulo[0] + '</span><span class="tf-titulo__l2">' + F.titulo[1] + '</span></h1>' +
      '<p class="tf-lead" style="--i:1">' + F.texto + '</p>' +
      '<div class="tf-acao" style="--i:2">' + pilula('Começar', 'seta', 'data-acao="comecar"') + dica() + '</div>' +
      '<p class="tf-meta" style="--i:3">' + svg('relogio') + F.tempo + ' · ' + N + ' perguntas</p>' +
      '<p class="tf-outros" style="--i:4">Também tem formulário para ' + outros.join(' e ') + '.</p>' +
    '</div>';
  }

  function htmlPergunta(q, i) {
    var id = 'q-' + q.id, desc = (q.ajuda ? id + '-a ' : '') + id + '-e', campo = CAMPO[q.tipo], h;
    var titulo = '<span class="tf-pipe" data-modelo="' + esc(q.titulo) + '"></span>' + (q.opcional ? '' : '<span class="tf-obrig" aria-hidden="true">*</span>');
    h = '<div class="tf-passo__miolo">' +
      '<p class="tf-num" aria-hidden="true">' + (i < 10 ? '0' : '') + i + svg('seta') + '</p>' +
      '<h2 class="tf-perg" id="' + id + '-t">' + (campo ? '<label for="' + id + '">' + titulo + '</label>' : titulo) + '</h2>' +
      (q.ajuda ? '<p class="tf-ajuda" id="' + id + '-a">' + q.ajuda + '</p>' : '');
    if (campo) {
      var base = ' class="tf-campo' + (q.tipo === 'longo' ? ' tf-campo--longo' : '') + '" id="' + id + '" name="' + q.id + '" aria-describedby="' + desc + '"' +
        (q.opcional ? '' : ' required aria-required="true"') + ' placeholder="' + esc(q.placeholder || 'Digite sua resposta aqui…') + '"';
      if (q.tipo === 'longo') { h += '<textarea' + base + ' rows="1"></textarea>'; }
      else {
        var t = { texto: 'type="text" autocapitalize="words"', email: 'type="email" inputmode="email" autocapitalize="off" spellcheck="false"', tel: 'type="tel" inputmode="tel"', link: 'type="text" inputmode="url" autocapitalize="off" spellcheck="false"' }[q.tipo];
        var auto = q.auto || { email: 'email', tel: 'tel-national' }[q.tipo] || 'off';
        if (q.tipo === 'tel' && !q.placeholder) { base = base.replace('Digite sua resposta aqui…', '(31) 90000-0000'); }
        h += '<input ' + t + base + ' autocomplete="' + auto + '">';
      }
    } else {
      var multi = q.tipo === 'varias';
      h += '<div class="tf-opcoes' + (q.opcoes.length > 6 ? ' tf-opcoes--2' : '') + '" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="' + id + '-t" aria-describedby="' + desc + '"' + (multi ? '' : ' aria-required="true"') + '>' +
        q.opcoes.map(function (o, k) {
          return '<button type="button" class="tf-op" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="false" data-k="' + k + '">' +
            '<span class="tf-op__k" aria-hidden="true">' + String.fromCharCode(65 + k) + '</span><span class="tf-op__r">' + o + '</span>' + svg('ok', 'tf-op__v') + '</button>';
        }).join('') + '</div>';
    }
    h += '<p class="tf-erro" id="' + id + '-e" role="alert"></p>';
    h += '<div class="tf-acao">' + (i === N ? pilula('Enviar', 'seta', 'data-acao="seguir"') : pilula('OK', 'ok', 'data-acao="seguir"')) + dica(q) + '</div>';
    return h + '</div>';
  }

  function htmlFim() {
    var linhas = Q.map(function (q) {
      var v = resp[q.id];
      v = Array.isArray(v) ? v.join(', ') : (v || '').trim();
      return '<dt>' + q.rotulo + '</dt><dd>' + (v ? esc(v) : '<span class="tf-vazio">—</span>') + '</dd>';
    }).join('');
    return '<div class="tf-passo__miolo tf-abre">' +
      '<h2 class="tf-titulo" id="tf-fim-t" style="--i:0"><span class="tf-titulo__l1">' + F.fim[0] + '</span><span class="tf-titulo__l2">' + esc(primeiro(resp.nome)) + '!</span></h2>' +
      '<p class="tf-lead" style="--i:1">' + esc(pipe(F.fim[1])) + '</p>' +
      '<div class="tf-acao" style="--i:2">' +
        '<a class="pilula pilula--' + F.cor + '" href="index.html#publicos"><span class="pilula__rot">Voltar ao site</span><span class="pilula__seta" aria-hidden="true">' + svg('seta') + '</span></a>' +
        '<a class="tf-sec" href="' + WA + encodeURIComponent(pipe(F.whats)) + '" target="_blank" rel="noopener noreferrer">' + svg('conversa') + 'Falar no WhatsApp<span class="sr-only"> (abre em outra aba)</span></a>' +
      '</div>' +
      '<details class="tf-resumo" style="--i:3"><summary>Ver o que seria enviado</summary><dl>' + linhas + '</dl>' +
        '<p>Prévia: nada saiu desta página. <a href="?tipo=' + tipo + '">Responder de novo</a></p></details>' +
    '</div>';
  }

  function monta() {
    var html = '<section class="tf-passo tf-passo--largo is-atual" data-i="0" aria-labelledby="tf-p0" tabindex="-1">' + htmlAbertura() + '</section>';
    Q.forEach(function (q, k) { html += '<section class="tf-passo" data-i="' + (k + 1) + '" aria-labelledby="q-' + q.id + '-t" tabindex="-1">' + htmlPergunta(q, k + 1) + '</section>'; });
    html += '<section class="tf-passo tf-passo--largo" data-i="' + (N + 1) + '" aria-labelledby="tf-fim-t" tabindex="-1"></section>';
    form.innerHTML = html;
    passos = all('.tf-passo', form);
    passos.forEach(function (p, k) { if (k) { p.inert = true; } });
  }

  /* ---------------- a teia: um nó por pergunta, em espiral (ângulo áureo) em volta do centro, como os municípios em volta do Vale.
     Cada resposta acende o nó e desenha o fio até o centro; nós vizinhos acesos se ligam entre si. ---------------- */
  var teia = { nos: [], fios: [], malha: [] };
  function montaTeia() {
    var el = document.querySelector('.tf-teia'), NS = 'http://www.w3.org/2000/svg', CX = 330, CY = 400;
    function no(tag, at, pai) { var e = document.createElementNS(NS, tag); for (var k in at) { e.setAttribute(k, at[k]); } (pai || el).appendChild(e); return e; }
    function acaso(i) { var x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); } // sempre o mesmo desenho
    var halo = no('radialGradient', { id: 'tf-halo' }, no('defs', {}));
    no('stop', { offset: '0', 'stop-color': '#ffd9a0', 'stop-opacity': '.95' }, halo);
    no('stop', { offset: '.28', 'stop-color': '#ffae18', 'stop-opacity': '.5' }, halo);
    no('stop', { offset: '1', 'stop-color': '#ff7a1a', 'stop-opacity': '0' }, halo);
    var po = no('g', { class: 'tf-teia__po' });
    for (var s = 0; s < 46; s++) { no('circle', { cx: (acaso(s + 50) * 600).toFixed(1), cy: (acaso(s + 90) * 800).toFixed(1), r: (0.6 + acaso(s + 130) * 1.2).toFixed(2), opacity: (0.08 + acaso(s + 170) * 0.24).toFixed(2) }, po); }
    var pts = [], i;
    for (i = 0; i < N; i++) { var a = -2.2 + i * 2.39996, r = 125 + acaso(i) * 145; pts.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r * 1.2]); }
    var malha = no('g', { class: 'tf-teia__malha' });
    for (i = 0; i < N - 1; i++) { teia.malha.push(no('path', { d: 'M' + pts[i].join(' ') + 'L' + pts[i + 1].join(' ') }, malha)); }
    var fios = no('g', { class: 'tf-teia__fios' });
    pts.forEach(function (p, k) {
      var dx = p[0] - CX, dy = p[1] - CY, c = k % 2 ? 0.2 : -0.2;
      var d = 'M' + CX + ' ' + CY + 'Q' + (CX + dx / 2 - dy * c).toFixed(1) + ' ' + (CY + dy / 2 + dx * c).toFixed(1) + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      no('path', { d: d, class: 'tf-teia__trilha' }, fios);
      teia.fios.push(no('path', { d: d, class: 'tf-teia__fio', pathLength: 1 }, fios));
    });
    var nos = no('g', { class: 'tf-teia__nos' });
    pts.forEach(function (p) {
      var g = no('g', { class: 'tf-teia__no', transform: 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')' }, nos);
      no('circle', { class: 'tf-teia__halo', r: 18, fill: 'url(#tf-halo)' }, g);
      no('circle', { class: 'tf-teia__anel', r: 9 }, g);
      no('circle', { class: 'tf-teia__ponto', r: 3.6 }, g);
      teia.nos.push(g);
    });
    var centro = no('g', { class: 'tf-teia__centro', transform: 'translate(' + CX + ' ' + CY + ')' });
    no('circle', { class: 'tf-teia__halo-c', r: 74, fill: 'url(#tf-halo)' }, centro);
    no('circle', { class: 'tf-teia__nucleo', r: 6 }, centro);
  }

  /* ---------------- estado: progresso, teia, navegação ---------------- */
  function estado() {
    var fim = atual === N + 1, p = fim ? 1 : atual ? (atual - 1) / N : 0;
    root.style.setProperty('--p', p.toFixed(3));
    barra.setAttribute('aria-valuenow', Math.round(p * 100));
    document.body.classList.toggle('tf-em-perguntas', atual > 0 && !fim);
    document.body.classList.toggle('tf-no-fim', fim);
    btVoltar.disabled = atual <= 1;
    btSeguir.disabled = atual < 1 || fim;
    conta.textContent = atual > 0 && !fim ? atual + ' / ' + N : '';
    teia.nos.forEach(function (g, j) {
      var on = fim || j < alcance - 1;
      g.classList.toggle('on', on);
      g.classList.toggle('is-atual', !fim && j === atual - 1);
      teia.fios[j].classList.toggle('on', on);
    });
    teia.malha.forEach(function (m, j) { m.classList.toggle('on', fim || j + 1 < alcance - 1); });
  }

  function foca(p) {
    var c = p.querySelector('.tf-campo');
    (c || p.querySelector('[data-acao="comecar"]') || p).focus({ preventScroll: true });
  }

  function ir(n) {
    if (n === atual || n < 0 || n > N + 1) { return; }
    clearTimeout(tAuto);
    var volta = n < atual, de = passos[atual], para = passos[n];
    passos.forEach(function (p) { p.classList.remove('is-entra', 'is-entra-volta', 'is-sai', 'is-sai-volta'); });
    de.classList.remove('is-atual');
    de.inert = true;
    de.classList.add(volta ? 'is-sai-volta' : 'is-sai');
    if (n === N + 1) { para.innerHTML = htmlFim(); }
    all('.tf-pipe', para).forEach(function (s) { s.textContent = pipe(s.getAttribute('data-modelo')); });
    para.inert = false;
    para.classList.add('is-atual', volta ? 'is-entra-volta' : 'is-entra');
    para.scrollTop = 0;
    atual = n;
    alcance = Math.max(alcance, n);
    estado();
    // foco já no clique (no iPhone o teclado só abre se o foco vier do gesto); a entrada continua por baixo
    foca(para);
    anuncio.textContent = n === N + 1 ? 'Respostas enviadas.' : n ? 'Pergunta ' + n + ' de ' + N : '';
  }
  form.addEventListener('animationend', function (e) {
    if (e.target.classList.contains('tf-passo')) { e.target.classList.remove('is-entra', 'is-entra-volta', 'is-sai', 'is-sai-volta'); }
  });

  /* ---------------- validação ---------------- */
  function valida(q) {
    var v = resp[q.id];
    if (q.tipo === 'escolha') { return v == null ? 'Escolha uma opção para seguir.' : ''; }
    if (q.tipo === 'varias') { return v && v.length ? '' : 'Escolha pelo menos uma opção.'; }
    if (q.tipo === 'aceite') { return v == null ? 'Escolha uma opção para seguir.' : v !== q.opcoes[0] ? q.erro : ''; }
    v = (v || '').trim();
    if (!v) { return q.opcional ? '' : 'Preencha este campo para seguir.'; }
    if (q.tipo === 'texto' && v.length < 2) { return 'Esse nome está curto demais. Confere?'; }
    if (q.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { return 'Hmm, esse e-mail parece incompleto. Confere?'; }
    if (q.tipo === 'tel') { var d = v.replace(/\D/g, '').length; if (d < 10 || d > 11) { return 'Confira o número: DDD e telefone, como (31) 90000-0000.'; } }
    return '';
  }
  function mostraErro(p, msg, quieto) {
    var e = p.querySelector('.tf-erro'), c = p.querySelector('.tf-campo'), m = p.querySelector('.tf-passo__miolo');
    e.innerHTML = svg('alerta') + '<span>' + esc(msg) + '</span>';
    if (c) { c.setAttribute('aria-invalid', 'true'); c.focus({ preventScroll: true }); }
    if (!quieto) { m.classList.remove('is-treme'); void m.offsetWidth; m.classList.add('is-treme'); }
  }
  function limpaErro(p) {
    var e = p.querySelector('.tf-erro'), c = p.querySelector('.tf-campo');
    if (e && e.firstChild) { e.textContent = ''; }
    if (c) { c.removeAttribute('aria-invalid'); }
  }

  /* ---------------- seguir, voltar, enviar ---------------- */
  function seguir() {
    if (atual === 0) { ir(1); return; }
    if (atual > N) { return; }
    var q = Q[atual - 1], p = passos[atual], erro = valida(q);
    if (erro) { mostraErro(p, erro); return; }
    limpaErro(p);
    if (atual === N) { enviar(); } else { ir(atual + 1); }
  }
  function voltar() { if (atual > 1 && atual <= N) { ir(atual - 1); } }

  function enviar() {
    var b = passos[N].querySelector('[data-acao="seguir"]');
    if (b.classList.contains('is-enviando')) { return; }
    b.classList.add('is-enviando');
    b.setAttribute('aria-disabled', 'true');
    b.querySelector('.pilula__rot').textContent = 'Enviando…';
    var dados = { formulario: tipo, enviado_em: new Date().toISOString(), respostas: JSON.parse(JSON.stringify(resp)) };
    if (window.console) { console.info('[Vale do Aço Digital · prévia] este formulário enviaria:', dados); }
    setTimeout(function () { ir(N + 1); }, reduced.matches ? 300 : 1100);
  }

  /* ---------------- escolhas: clique, toque ou a letra no teclado ---------------- */
  function escolhe(op) {
    var p = op.closest('.tf-passo'), i = +p.getAttribute('data-i');
    if (i !== atual) { return; }
    var q = Q[i - 1], ops = all('.tf-op', p), k = +op.getAttribute('data-k');
    limpaErro(p);
    if (q.tipo === 'varias') {
      op.setAttribute('aria-checked', op.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      resp[q.id] = q.opcoes.filter(function (o, j) { return ops[j].getAttribute('aria-checked') === 'true'; });
      return;
    }
    ops.forEach(function (o) { o.setAttribute('aria-checked', o === op ? 'true' : 'false'); });
    resp[q.id] = q.opcoes[k];
    op.classList.remove('is-pisca'); void op.offsetWidth; op.classList.add('is-pisca');
    if (q.tipo === 'aceite' && k !== 0) { mostraErro(p, q.erro, true); return; }
    if (i === N) { return; } // a última espera o Enviar
    clearTimeout(tAuto);
    tAuto = setTimeout(function () { if (atual === i) { seguir(); } }, reduced.matches ? 250 : 620);
  }

  /* ---------------- campos: guarda a resposta, máscara do telefone, textarea que cresce ---------------- */
  function mascaraTel(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (!d) { return ''; }
    if (d.length <= 2) { return '(' + d; }
    var r = d.slice(2), corte = r.length > 8 ? 5 : 4;
    return '(' + d.slice(0, 2) + ') ' + (r.length > corte ? r.slice(0, corte) + '-' + r.slice(corte) : r);
  }
  function cresce(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
  form.addEventListener('input', function (e) {
    var c = e.target;
    if (!c.classList.contains('tf-campo')) { return; }
    // apagando, a máscara espera (senão o hífen voltaria a cada Backspace); ela se refaz ao sair do campo
    if (c.type === 'tel' && !/^delete/.test(e.inputType || '')) { c.value = mascaraTel(c.value); }
    if (c.tagName === 'TEXTAREA') { cresce(c); }
    resp[c.name] = c.value;
    limpaErro(c.closest('.tf-passo'));
  });
  form.addEventListener('focusout', function (e) { if (e.target.type === 'tel') { e.target.value = mascaraTel(e.target.value); resp[e.target.name] = e.target.value; } });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---------------- cliques e teclado ---------------- */
  document.addEventListener('click', function (e) {
    var op = e.target.closest('.tf-op');
    if (op) { escolhe(op); return; }
    var b = e.target.closest('[data-acao]');
    if (!b || b.getAttribute('aria-disabled') === 'true') { return; }
    var a = b.getAttribute('data-acao');
    if (a === 'voltar') { voltar(); } else { seguir(); } // comecar e seguir
  });
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.isComposing) { return; }
    var t = e.target, emCampo = /^(INPUT|TEXTAREA)$/.test(t.tagName);
    if (e.key === 'Enter') {
      // numa opção de "escolha quantas quiser", o Enter segue (como no Typeform) e o Espaço marca; nos outros controles, eles respondem
      if (/^(BUTTON|A|SUMMARY)$/.test(t.tagName) && !(t.getAttribute('role') === 'checkbox' && t.classList.contains('tf-op'))) { return; }
      if (t.tagName === 'TEXTAREA' && e.shiftKey) { return; } // nova linha
      if (atual > N || e.ctrlKey || e.metaKey || e.altKey) { return; }
      e.preventDefault();
      seguir();
      return;
    }
    if (emCampo || e.ctrlKey || e.metaKey || e.altKey || atual < 1 || atual > N || !Q[atual - 1].opcoes) { return; }
    if (/^[a-z]$/i.test(e.key)) {
      var op = passos[atual].querySelector('.tf-op[data-k="' + (e.key.toUpperCase().charCodeAt(0) - 65) + '"]');
      if (op) { e.preventDefault(); escolhe(op); } // o foco fica onde está: assim o Enter seguinte segue, não desmarca
    }
  });

  monta();
  montaTeia();
  estado();
})();
