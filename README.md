# Painéis de Automotores

Painéis de instrumentos de carros e motos refeitos do zero em HTML/SVG, interativos, pensados para telas de painel digital (como o Ghost Dashboard). Cada painel é desenhado em cima de fotos e manuais do original: escalas, números, ponteiros, luzes-espia e hodômetro se comportam como no veículo de verdade.

Não usa nenhuma biblioteca: é só HTML, CSS e JavaScript, e roda direto do arquivo. A coleção vai crescendo; cada painel novo é uma pasta.

## Painéis disponíveis

| Painel | O que tem |
| --- | --- |
| **Chevrolet Corsa** (painel azul com conta-giros, versões Super e Milenium) | Conta-giros, velocímetro, combustível e temperatura; hodômetro total e parcial de tambores (os números rolam para baixo); pino de zerar o parcial; 12 luzes-espia em que o fundo da janela é que acende; iluminação âmbar; a bomba acende em vermelho na reserva. |
| **Chevrolet Astra 2011** (mostradores brancos) | Conta-giros 0–70 (x100) e velocímetro 0–220 com a escala não linear do original; hodômetro digital (parcial e total); 23 luzes-espia; luz de troca de marcha automática; aviso de velocidade máxima programável; luz da reserva; iluminação laranja. |
| **Honda CG 125 Titan 2000** | Velocímetro 0–140 com a faixa vermelha em blocos e hodômetro de tambores; lentes NEUTRAL, TURN e HI-BEAM com trama de vidro; miolo de ignição que liga o painel e acende o neutro; marcador de combustível; opção "mau contato na boia", em que o ponteiro balança quando a velocidade muda de repente. |

Cada painel tem três versões:

- **Painel original**: com a carcaça, como a peça de verdade.
- **Dashboard**: tela retangular 1920×720, só com os mostradores.
- **Dashboard com multimídia**: mostradores nas laterais e, no meio, mensagem, tocador de música, mapa e relógio.

## Como abrir

- **Executável (Windows 10/11):** abra `Paineis de Automotores.exe`. Ele abre o seletor numa janela própria (usa o Edge ou o Chrome que já estão instalados) e liga a multimídia à música do computador.
- **Sem executável:** abra o `index.html` em qualquer navegador atual.
- **Um painel só:** abra direto o `.html` dentro da pasta do painel.

No seletor, escolha o painel e a versão. O botão **← Painéis** volta para a lista.

## Controles

Embaixo de cada painel ficam os controles da simulação:

- **Sliders** de velocidade, RPM, combustível e temperatura (os que o painel tiver).
- **Tempo**: acelera o hodômetro (1×, 20× ou 200×), porque em tempo real ele leva 36 s para andar 1 km a 100 km/h.
- **Iluminação** e um botão para cada **luz-espia**.
- Cada painel tem ainda o que é dele: pino de zerar o parcial, miolo de ignição, e assim por diante.

## Multimídia

Aberto pelo executável, o tocador da versão com multimídia mostra **o que está tocando no computador**, em qualquer programa (Spotify, YouTube no navegador, player de música…): título, artista, capa, tempo e barra de progresso. Os botões de tocar/pausar, anterior e próxima, e o clique na barra, comandam esse programa. É a mesma informação do controle de mídia do Windows.

O executável faz a ponte: ele lê a sessão de mídia do Windows e a entrega para a página por um endereço que só o próprio computador acessa (`localhost`). Ele continua rodando em segundo plano enquanto a janela está aberta e fecha sozinho depois. O que aparece depende do programa que toca: alguns não informam capa ou duração.

Aberto direto no navegador, sem o executável, o tocador funciona com arquivos: use **🎵 Adicionar músicas** (ou clique na capa) e escolha as músicas. Se o arquivo se chamar `Artista - Título.mp3`, os dois aparecem separados.

O relógio é o do computador. O cartão de mensagem e o mapa são só visuais; o contato da mensagem é uma homenagem a um piloto, diferente em cada painel.

## Estrutura

```
index.html                   seletor de painéis
versoes.js                   versão do projeto e de cada painel
Paineis de Automotores.exe   abre o seletor e faz a ponte com a mídia do Windows
launcher/                    código-fonte do executável, ícone e script de compilação
logos/                       emblemas usados no seletor
Painel .../                  uma pasta por painel: o .js e o .css dele e as três páginas
```

Em cada pasta de painel, `icones.js` (símbolos das luzes-espia) e `multimidia.js` (tocador e cartões) são cópias do mesmo arquivo, para a pasta funcionar sozinha.

Para um painel novo aparecer no seletor, crie a pasta dele com as três páginas e acrescente uma linha na lista `PAINEIS` do `index.html`.

## Versões

A versão aparece no canto de cima de cada janela: no seletor é a do projeto (a mesma do release) e, em cada painel, a dele. Os números ficam todos no `versoes.js`; para lançar uma versão nova, mude ali, crie a tag (por exemplo `v1.1`) e anexe o `.zip` da pasta ao release.

## Recompilar o executável

O launcher é um arquivo C# pequeno e compila com o que já vem no Windows 10/11, sem instalar nada:

```
launcher\compilar.cmd
```

## Limitações

- Os símbolos das luzes e alguns detalhes são desenhos simplificados, não a arte original.
- As páginas foram testadas em navegador (Chrome/Edge), não dentro do Ghost Dashboard.
- A resolução 1920×720 das versões Dashboard é uma escolha; o SVG se ajusta a outros tamanhos de tela.
- A ponte com a música do computador só existe no Windows 10 (1809 ou mais novo) e 11.

## Marcas e imagens

Projeto de fã, sem vínculo com as fabricantes. Os nomes e marcas dos veículos pertencem aos respectivos donos e aparecem aqui só para identificar os painéis. As imagens da pasta `logos/` e o ícone do executável são de terceiros; confira a licença de cada uma antes de reutilizar.
