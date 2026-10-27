# Painéis de Automotores

Painéis de instrumentos de carros e motos refeitos do zero em HTML/SVG, interativos, pensados para telas de painel digital. Cada painel é desenhado em cima de fotos e manuais do original: escalas, números, ponteiros, luzes-espia e hodômetro se comportam como no veículo de verdade.

Não usa nenhuma biblioteca: é só HTML, CSS e JavaScript, e roda direto do arquivo. A coleção vai crescendo; cada painel novo é uma pasta.

## Painéis disponíveis

| Painel | O que tem |
| --- | --- |
| **Chevrolet Corsa** (painel azul com conta-giros, versões GLS, Milenium e Super) | Conta-giros, velocímetro, combustível e temperatura; hodômetro total e parcial de tambores (os números rolam para baixo); pino de zerar o parcial; 12 luzes-espia em que o fundo da janela é que acende; iluminação âmbar; a bomba acende em vermelho na reserva. |
| **Chevrolet Astra 2011** (mostradores brancos) | Conta-giros 0–70 (x100) e velocímetro 0–220 com a escala não linear do original; hodômetro digital (parcial e total); 23 luzes-espia; luz de troca de marcha automática; aviso de velocidade máxima programável; luz da reserva; iluminação laranja. |
| **Chevrolet Kadett GLS 98** (2.0 MPFI) | Velocímetro 20–220 e conta-giros 0–70 (x100) com a faixa vermelha antes do 70, hachurada no começo; temperatura e combustível no miolo central; hodômetro total e parcial de tambores com botão de zerar; 7 luzes-espia em que o fundo da janela é que acende; iluminação âmbar. O miolo central de cima tem duas versões, à escolha nos controles: só a luz de bateria, ou completo, com voltímetro e pressão do óleo, que acompanham o motor quando se dirige. |
| **Chevrolet Vectra B CD Challenge** (2.2 16V) | Placa prateada com conta-giros 0–7 (x1000), velocímetro 0–260 com coroa de blocos e temperatura e combustível na mesma janela; visor de cristal líquido com parcial e total e o pino de zerar; 16 luzes-espia, VEL MAX e a luz da reserva; setas sobre o velocímetro; iluminação âmbar. |
| **Chevrolet Vectra Elite** (2.4 16V) | Aros cromados e mostradores pretos em tela: conta-giros, velocímetro, temperatura e combustível; visor com parcial e total; 10 luzes-espia; iluminação âmbar. Ainda sem a versão com a carcaça. |
| **Corsa GT Spec** (com turbo) | Corsa preparado: turbo de 1,3 bar regulável no botão KOUKI, coroa de LEDs no conta-giros, shift light a 6.000 rpm, marcha e telinhas de LCD com pressões, temperaturas, sonda, TPS, bateria e avanço; luzes de reserva e de temperatura alta (piscando); som do motor com o assobio do turbo e a válvula de alívio. Sem a versão com a carcaça. |
| **Honda CG 125 Titan 2000** | Velocímetro 0–140 com a faixa vermelha em blocos e hodômetro de tambores; lentes NEUTRAL, TURN e HI-BEAM com trama de vidro; miolo de ignição que liga o painel e acende o neutro; partida elétrica e pedal de partida; marcador de combustível; opção "mau contato na boia", em que o ponteiro balança quando a velocidade muda de repente. |

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
- **Tempo**: começa em 1× (tempo real) e acelera o hodômetro e o consumo de combustível (20× ou 200×), porque em tempo real o hodômetro leva 36 s para andar 1 km a 100 km/h.
- **Desbloquear limite de velocidade**: libera o slider até 500 km/h. O ponteiro passa do fim da escala e para onde encontrar um obstáculo, como o pino de zerar o parcial no Corsa.
- **Iluminação** e um botão para cada **luz-espia**.
- Cada painel tem ainda o que é dele: pino de zerar o parcial, miolo de ignição, e assim por diante.

## Dirigir pelo teclado, controle ou volante

Aperte uma das teclas abaixo, ou conecte um controle ou um volante e acione um comando: o painel passa a simular o veículo andando. Motor, embreagem, marchas, direção, pneus, arrasto e freios são calculados com os dados de cada veículo e movem o conta-giros e o velocímetro. A marcha engatada aparece no canto de cima da janela; o botão de teclado ao lado dela abre a lista de comandos. Mexer num slider com o mouse devolve o comando aos sliders.

Um controle comum (PlayStation, Xbox ou compatível) já sai funcionando, com o mapeamento do Gran Turismo 7 e as setas no direcional em vez do touchpad:

| Função | Teclado | Controle |
| --- | --- | --- |
| Direção | ← → | Analógico esquerdo |
| Acelerador | W | R2 |
| Freio | S | L2 |
| Sobe marcha | E | ✕ |
| Desce marcha | Q | □ |
| Embreagem (segurando; não é preciso para trocar de marcha) | Shift | L1 |
| Freio de mão (segurando) | Espaço | ○ |
| Ré (com o veículo parado) | R | △ |
| Setas | A / D | Direcional esquerda/direita |
| Farol alto | F | Direcional para cima |
| Faróis (iluminação do painel) | L | L3 |
| Ignição e partida | I | Options |

Nos carros o motor precisa ser ligado: o miolo da ignição fica no canto dos controles, com as posições B, I, II e III. Um clique no miolo leva à posição I e outro à II, onde acendem as luzes de bateria, óleo e injeção. Em II, clicar e segurar dá a partida (o giro sobe a uns 1.100 rpm e volta para a marcha lenta); um clique só volta para a I e desliga o motor. Também dá para clicar direto numa marca. A tecla I faz tudo em sequência: liga a ignição, dá a partida e, com o motor funcionando, desliga. Na CG o miolo fica no próprio painel e a partida fica no canto dos controles: com o contato ligado, o motor pega segurando o botão vermelho de partida elétrica ou com um clique no pedal de partida, e a luz à esquerda deles acende enquanto o motor funciona.

**Volantes e outros controles.** Qualquer volante, pedaleira, câmbio ou controle que o navegador reconheça serve, inclusive vários ao mesmo tempo. Abra a lista de comandos (o botão de teclado ao lado da marcha), clique no comando e acione o botão, o pedal ou o volante. Nos pedais e eixos a lista pede para levar até o fim e segurar, e depois soltar; na direção, virar para a esquerda e depois centralizar. As ligações ficam gravadas no navegador e "Restaurar padrão" apaga todas. Um volante ou controle fora do padrão abre a lista sozinho na primeira vez. Com "Volante (direção direta)" marcado, o que acontece sozinho ao ligar a direção a um volante, o eixo comanda direto o esterço das rodas; desmarcado, vale o comportamento de analógico descrito abaixo.

**Curvas e aderência.** Cada eixo tem seus pneus, com aderência limitada e dividida entre acelerar, frear e fazer curva. Uma curva gasta velocidade, e o giro cai junto; quanto mais fechada, mais gasta. Passando do limite aparece um aviso ao lado da marcha:

- **Patinando**: tração demais para a aderência, como numa arrancada forte. O giro e o velocímetro sobem mais que o veículo.
- **Rodas travadas**: freio demais (não há ABS). Com as rodas da frente travadas o velocímetro cai a zero com o veículo ainda andando, porque ele lê a roda dianteira.
- **Saindo de frente**: esterço demais para a velocidade; os pneus da frente escorregam e o veículo perde velocidade depressa.
- **Saindo de traseira**: a traseira escapou, por tirar o pé ou frear no meio da curva, ou pelo freio de mão; o veículo pode rodar.

No analógico e no teclado o esterço máximo diminui com a velocidade, como nos jogos, e o fim do curso pede um pouco mais do que os pneus aguentam. O freio pelo teclado vai a 78% do pedal, o máximo antes de travar em linha reta; com gatilho ou pedal de verdade dá para passar disso.

As marchas são em sequência: ré, neutro, 1ª e assim por diante. Como no jogo, a redução é recusada se o giro fosse passar do limite. No limite de giro o motor corta e o ponteiro fica batendo, em neutro ou engatado.

Dirigindo, o combustível é gasto de verdade: o tanque desce conforme o esforço do motor. Com o tanque praticamente vazio o motor engasga por alguns segundos e morre; o giro zera e o veículo vai perdendo velocidade. Para abastecer, mexa no slider de combustível; depois de uma pane seca é preciso dar a partida de novo. Os painéis abrem com o tanque em zero, então abasteça antes de sair.

Potência, torque, peso, pneus, aerodinâmica e entre-eixos vêm das fichas técnicas (Corsa 1.6 8V, Astra 2.0 8V, Kadett 2.0 MPFI, Vectra 2.2 16V e CG 125 Titan 2000; o entre-eixos da CG é aproximado). A marcha lenta dos carros fica em 900 rpm. As relações de câmbio e de diferencial são as que se costuma citar para esses modelos; não foram conferidas em manual. Distribuição de peso, altura do centro de gravidade, divisão dos freios e os dados dos pneus são valores típicos, não medidos nesses veículos. A moto usa o mesmo modelo de dois eixos dos carros: ela não inclina nem cai.

## Som do motor

Dirigindo, o painel toca o som do motor: marcha lenta, subida de giro, corte e motor de partida. O som abre sempre desligado: o botão de alto-falante ao lado da marcha liga, e ao lado dele aparece o slider de volume (o volume fica gravado no navegador). O volume e o brilho do som acompanham o acelerador.

O som de cada motor foi gravado no [Engine Simulator](https://github.com/ange-yaghi/engine-sim) (v0.1.14a), a partir dos arquivos de motor da pasta `motores/`. Cada painel guarda no seu `som.js` um trecho da marcha lenta e um trecho a cada faixa de giro; o painel mistura os dois trechos vizinhos do giro atual e acerta o tom pela velocidade de reprodução. Para regravar: `motores/gravar.py` abre o Engine Simulator, liga o motor e grava a subida de giro, e `motores/montar.py` transforma a gravação no `som.js`.

## Multimídia

Aberto pelo executável, o tocador da versão com multimídia mostra **o que está tocando no computador**, em qualquer programa (Spotify, YouTube no navegador, player de música…): título, artista, capa, tempo e barra de progresso. Os botões de tocar/pausar, anterior e próxima, e o clique na barra, comandam esse programa. É a mesma informação do controle de mídia do Windows.

O executável faz a ponte: ele lê a sessão de mídia do Windows e a entrega para a página por um endereço que só o próprio computador acessa (`localhost`). Ele continua rodando em segundo plano enquanto a janela está aberta e fecha sozinho depois. O que aparece depende do programa que toca: alguns não informam capa ou duração.

Aberto direto no navegador, sem o executável, o tocador funciona com arquivos: use **🎵 Adicionar músicas** (ou clique na capa) e escolha as músicas. Se o arquivo se chamar `Artista - Título.mp3`, os dois aparecem separados.

O relógio é o do computador. O cartão de mensagem e o mapa são só visuais; o contato da mensagem é uma homenagem a um piloto, diferente em cada painel.

## Estrutura

```
index.html                   seletor de painéis
versoes.js                   versão do projeto e de cada painel
controle.js                  teclado, controle, volante e simulação do veículo
pedal.png                    símbolo do pedal de partida das motos
motores/                     motores para o Engine Simulator e os scripts que gravam e montam o som
CHANGELOG.md                 o que mudou em cada versão
Paineis de Automotores.exe   abre o seletor e faz a ponte com a mídia do Windows
launcher/                    código-fonte do executável, ícone e script de compilação
logos/                       emblemas usados no seletor
Painel .../                  uma pasta por painel: o .js e o .css dele e as três páginas
```

Em cada pasta de painel, `som.js` é o som do motor daquele veículo, e `icones.js` (símbolos das luzes-espia) e `multimidia.js` (tocador e cartões) são cópias do mesmo arquivo, para a pasta funcionar sozinha. O Kadett não usa o `icones.js`: os símbolos dele, decalcados de uma tabela de símbolos igual à do painel, ficam no próprio `kadett.js`.

Para um painel novo aparecer no seletor, crie a pasta dele com as três páginas e acrescente uma linha na lista `PAINEIS` do `index.html`.

## Versões

A versão aparece no canto de cima de cada janela: no seletor é a do projeto (a mesma do release) e, em cada painel, a dele. Os números ficam todos no `versoes.js`; para lançar uma versão nova, mude ali, crie a tag (por exemplo `v1.2`) e anexe o `.zip` da pasta ao release.

## Recompilar o executável

O launcher é um arquivo C# pequeno e compila com o que já vem no Windows 10/11, sem instalar nada:

```
launcher\compilar.cmd
```

## Limitações

- Os símbolos das luzes e alguns detalhes são desenhos simplificados, não a arte original.
- O voltímetro e a pressão do óleo do Kadett foram refeitos de uma foto pequena: a disposição segue a foto, mas os valores das escalas são aproximados.
- As páginas foram testadas em navegador (Chrome/Edge), não em uma tela de painel digital de verdade.
- A resolução 1920×720 das versões Dashboard é uma escolha; o SVG se ajusta a outros tamanhos de tela.
- A ponte com a música do computador só existe no Windows 10 (1809 ou mais novo) e 11.
- O som vem de motores simulados com as medidas básicas de cada um (diâmetro, curso, corte de giro), não de gravações dos veículos reais. Foi gravado só com o acelerador no fundo; com o pé solto o painel abafa e abaixa esse mesmo som.
- Volantes e pedaleiras foram testados com aparelhos simulados; com um de verdade pode ser preciso refazer a ligação dos comandos.

## Marcas e imagens

Projeto de fã, sem vínculo com as fabricantes. Os nomes e marcas dos veículos pertencem aos respectivos donos e aparecem aqui só para identificar os painéis. As imagens da pasta `logos/` e o ícone do executável são de terceiros; confira a licença de cada uma antes de reutilizar.
