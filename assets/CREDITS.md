# Créditos das imagens

Fotografias obtidas no Wikimedia Commons, salvas localmente (sem hotlink), redimensionadas e convertidas para WebP. Licenças conferidas nos metadados do Commons em 21/09/2026.

| Arquivo (assets/img/) | Autor | Licença | Página original |
|---|---|---|---|
| vale/ipatinga-vista-aerea-*.webp | HVL | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | https://commons.wikimedia.org/wiki/File:Vista_a%C3%A9rea_de_Ipatinga_MG.JPG |
| vale/ipatinga-usiminas-millenium-*.webp | HVL | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | https://commons.wikimedia.org/wiki/File:Millenium_com_a_f%C3%A1brica_da_Usiminas_ao_fundo,_Ipatinga_MG.JPG |
| vale/ipatinga-parque-ipanema-por-do-sol-*.webp | HVL | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | https://commons.wikimedia.org/wiki/File:P%C3%B4r_do_sol_no_Parque_Ipanema,_Ipatinga_MG.JPG |
| vale/coronel-fabriciano-centro-noite-*.webp | HVL | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | https://commons.wikimedia.org/wiki/File:Vista_parcial_noturna_da_regi%C3%A3o_central_da_cidade,_Coronel_Fabriciano_MG.jpg |
| vale/ipatinga-vista-jardim-panorama-*.webp | HVL | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | https://commons.wikimedia.org/wiki/File:Vista_parcial_de_Ipatinga_MG_a_partir_do_B._Jardim_Panorama.JPG |
| vale/timoteo-usina-aperam-*.webp | HVL | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | https://commons.wikimedia.org/wiki/File:Vista_da_usina_da_Aperam_South_America_em_Tim%C3%B3teo_MG_a_partir_de_Coronel_Fabriciano.JPG |
| infraestrutura/data-center-servidores-*.webp | Victorgrigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_15.jpg |
| infraestrutura/data-center-rack-cabos-*.webp | Derrick Coetzee from Berkeley, CA, USA | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | https://commons.wikimedia.org/wiki/File:Rear_of_rack_at_NERSC_data_center_-_closeup.jpg |
| infraestrutura/fibra-optica-painel-*.webp | U.S. Department of Agriculture Preston Keres/Office of Communications-Photography Services Center | Public domain | https://commons.wikimedia.org/wiki/File:20180201-RD-PJK-2147_TONED_(39408041184).jpg |

Alterações feitas: recorte por CSS (object-fit), redimensionamento e conversão de formato. As imagens sob CC BY-SA permanecem sob a mesma licença.

## Material próprio do movimento

- `movimento/registro-oficial.webp`: registro oficial publicado em valedoacodigital.com.br.
- Logos (`logo-*.png/svg`, `vad-*.png`): marcas das respectivas empresas e do movimento, usadas no site oficial.
- Vídeo e posters do hero: material do projeto.

## Logos das empresas parceiras

Arquivos oficiais baixados dos sites das próprias empresas em 21/09/2026, usados sem alteração na seção "Quem faz parte". São marcas das respectivas empresas; o uso aqui é a identificação delas como parceiras do movimento.

| Arquivo (assets/img/parceiros/) | Empresa | Origem |
|---|---|---|
| logo-arweb.png | AR-WEB Sistemas | https://www.arwebsistemas.com/assets/img/logo.png |
| logo-mestudios.svg | ME Studios | https://mestudios.com.br/wp-content/uploads/2023/03/ic-me-studios-home.svg |
| logo-servicom.svg | Servicom Segurança Eletrônica | https://site.servicomseguranca.com.br/ (logo-servicom.svg) |
| logo-nexclub.png | NexClub | https://nexclub.app.br/assets/logo-topo.png |

NoteLoc: logo e site não localizados na web — o cartão mostra o nome até o arquivo oficial chegar.

## Pendências

- As fotos de infraestrutura (data center, fibra) são reais, mas **não são da ONEX nem da BRNET**. Substituir por fotografias oficiais das duas empresas quando houver autorização de uso (ver `TODO` no `index.html`).
- Fotos de encontros do movimento (Vale do Aço Digital Experience etc.): as publicadas na imprensa não têm licença de reuso; usar material próprio do movimento.


## Programa Comércio Digital (`assets/img/comercio/`) — 25/09/2026

Recortes da arte do Programa Comércio Digital (Sindcomércio MG Vale do Aço + Vale do Aço Digital) enviada pelo Walter como referência de design. Material do projeto; a origem das fotografias da arte não foi informada — confirmar licença/autoria com quem produziu a peça antes de publicar.

| Arquivo | O que é | Processo |
|---|---|---|
| tile-01…10.webp | as dez pessoas do mosaico | recorte 1:1 (sem upscale), WebP q86 |
| center-bg.webp | centro do mosaico | recorte + desfoque gaussiano σ=50, escurecido |
| mudou-1920/960.webp | comerciante ao balcão | recorte; texto gravado removido por inpainting (`removelogo`, máscara por luminância/saturação) |
| participe-1068/640.webp | atendimento com o celular | recorte até x = 1068 (antes do título gravado); trecho do "P" reconstruído por inpainting |
| digital.png, mudou-script.png | palavras em letra manuscrita da arte | alfa por saturação (`geq`), cores originais |
| sindcomercio.png | assinatura do Sindcomércio MG Vale do Aço (marca da entidade) | alfa por luminância, cor creme sólida; substituir pelo arquivo oficial |


## Logos do PDF LOGOS_PARCEIROS (25/09/2026)

Enviado pelo Walter como o conjunto oficial das marcas do movimento. Marcas das respectivas empresas; uso aqui é a identificação delas em "Quem está junto".

| Arquivo (assets/img/parceiros/) | Empresa | Processo |
|---|---|---|
| logo-noteloc.png | Note Loc — Soluções em Informática | página do PDF renderizada em alta pelo LibreOffice, recorte e fundo removido por chroma |
| logo-nexclub-quadrado.png | NexClub | raster embutido no PDF (512 × 512), extraído sem alteração |
| logo-arweb-azul.png | AR-WEB Sistemas | raster embutido no PDF (879 × 189, cor indexada + máscara), extraído sem alteração |

| comercio/mulher.webp | comerciante da arte, recortada pelo Walter | branco removido por preenchimento, erosão 2 px, WebP com alfa |
| comercio/mudou-fundo-*.webp | cenário da mesma foto | desfoque gaussiano σ=16, escurecido |

## Versão premium do Programa Comércio Digital (29/09/2026)

Fonte: **Arimo** — Steve Matteson / projeto Arimo, distribuída pelo Google Fonts, SIL Open Font License 1.1. Arquivo `assets/fonts/arimo-latin-wght-400-700.woff2` (latino, pesos 400–700), licença em `assets/fonts/Arimo-OFL.txt`, origem e hashes em `assets/fonts/Arimo-SOURCE.md`. Não exige crédito visível na página.

Imagens derivadas da arte e dos recortes do Walter (material do projeto; a autoria/licença das fotografias da campanha continua a confirmar, como registrado acima):

| Arquivo (`assets/img/programa/`) | O que é | Processo |
|---|---|---|
| `marcas.webp` | marcas Vale do Aço Digital + Sindcomércio MG Vale do Aço | recorte do rodapé da arte (`m-foot.webp`) com o fundo marrom chapado retirado (`tools/uncomposite.js`); desenho das marcas inalterado |
| `abertura-fundo.webp` | ambiente desfocado da abertura | mosaico limpo (`IMG-FOTOS.png`) reduzido, desfocado e escurecido até o tom medido na arte, com degradê para o marrom |
| `k-mudou-letreiro.webp` | "SEU NEGÓCIO mudou" | junção das faixas `k-mudou-l1/l2` (IMG_6191); acentos da linha de baixo removidos (a linha virou HTML) |
| `mudou-frente(-m).webp`, `mudou-fundo(-m).webp` | foto "Seu negócio mudou" em dois planos | plano próximo = comerciante + balcão + objetos da foto sem texto (`IMG-MOCA-FUNDO.png`) com máscara suavizada; plano distante = `k-fundo.webp` recortado à foto (`tools/build-mudou-planos.js`) |
| `final-foto(-m).webp` | foto do convite final | `IMG-MOCA-FUNDO2.png` + antebraço do cliente refeito a partir da arte (o recorte original era transparente ali) (`tools/build-final-foto.js`) |

Atualização v3.2, a pedido do usuário: a foto final ativa passou a ser `final-foto-fornecida.webp`, originada do arquivo **`IMG-MOCA-FUNDO2 (1).png`** fornecido pelo usuário. Conversão WebP sem perda, 1920 × 1029, sem recorte, remontagem ou geração de pessoas. Canal alfa e todos os pixels visíveis conferidos contra o PNG: nenhuma diferença. O arquivo anterior foi preservado para histórico. Mantém-se a mesma proveniência de material da campanha; não foi acrescentada uma licença externa.
