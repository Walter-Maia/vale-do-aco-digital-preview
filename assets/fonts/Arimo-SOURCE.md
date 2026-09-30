# Arimo — fonte opcional para a landing

Obtida em 29/09/2026. Não ativada automaticamente na página.

- Autor: Steve Matteson / projeto Arimo; distribuição Google Fonts.
- Projeto: https://github.com/googlefonts/arimo
- Metadados: https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/METADATA.pb
- CSS de origem: https://fonts.googleapis.com/css2?family=Arimo:wght@400..700&display=swap
- Binário: https://fonts.gstatic.com/s/arimo/v36/P5sMzZCDf9_T_10ZxCE.woff2
- Licença original: https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/OFL.txt
- Orientação OFL: https://openfontlicense.org/how-to-use-ofl-fonts/

| Arquivo | Bytes | SHA-256 |
| --- | ---: | --- |
| `arimo-latin-wght-400-700.woff2` | 20.132 | `6a22ce0b2709c7e856a8bd9bbf31b0f7695caeeeb03915b0212d6d959e9bc1b9` |
| `Arimo-OFL.txt` | 4.384 | `11cce536cd2f3864d767003af5dcd739e2e15818cf2279b6175edeadd3960992` |

Binário WOFF2 latino variável, pesos 400–700, estilo normal. Download preservado sem conversão ou edição. Dimensões de imagem não se aplicam. A tabela interna informa versão 1.341 e copyright 2020; a licença recebida do repositório contém copyright 2026. Ambos os avisos foram mantidos como recebidos.

Licença SIL OFL 1.1. Distribuir `Arimo-OFL.txt` junto da fonte e preservar os avisos. Não é necessário acrescentar crédito visível ao rodapé da landing. Consulte o texto integral para redistribuição/modificação; não redistribua arquivos proprietários de Arial ou Helvetica como se fossem esta fonte.

Cabeçalho WOFF2, mapa de caracteres e carregamento no Edge conferidos. Os acentos `ÀÁÂÃÇÉÊÍÓÔÕÚÜàáâãçéêíóôõúü` estão presentes. Para a cópia estática, utilizar caracteres pré-compostos, como os deste documento. O binário não inclui itálico, pesos acima de 700 nem todos os alfabetos disponíveis na família completa.

Exemplo opcional para um stylesheet em `assets/css/`:

```css
@font-face {
  font-family: "Arimo VAD";
  src: url("../fonts/arimo-latin-wght-400-700.woff2") format("woff2");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}

/* Aplicar somente nos blocos que o implementador decidir reconstruir. */
.texto-reconstruido {
  font-family: "Arimo VAD", Arial, Helvetica, sans-serif;
}
```

Usar 700 no título e 400 no corpo; conferir quebra de linhas antes/depois do carregamento e nos tamanhos responsivos. A classe acima é ilustrativa e não foi inserida no CSS da página.

Relatório: [pesquisa-assets-clean.md](../../qa/pesquisa-assets-clean.md).
