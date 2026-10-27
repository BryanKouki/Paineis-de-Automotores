# Changelog

## 1.4

### Novo

- **Chevrolet Vectra B CD Challenge (2.2 16V).** Painel novo nas três versões: original com a carcaça (a placa sob a lente transparente, com a vedação de borracha em cima, o rebaixo de baixo e as abas de fixação), Dashboard e Dashboard com multimídia. Conta-giros 0–7 (x1000) com as escalas do mostrador original, velocímetro 0–260 com a coroa de blocos e os números pequenos do 10 ao 50, temperatura e combustível na mesma janela; visor de cristal líquido com o parcial em cima e o total embaixo, e o pino de zerar o parcial (clique nele); 16 luzes-espia, o VEL MAX e a luz da reserva; setas sobre o velocímetro; iluminação âmbar.
- **Vectra B na simulação.** 138 cv, 20,7 kgfm, 1.345 kg, pneus 205/55 R16 e tanque de 57 L, da ficha técnica; corte de giro a 6.500 rpm e marcha lenta a 850 rpm. Na ignição acendem bateria, óleo e injeção até o motor pegar, e ABS, controle de tração, airbag e reserva fazem o teste. Som gravado no Engine Simulator com um motor montado para ele (`motores/vectra_22_16v.mr`). Na multimídia, os mostradores e as faixas de luzes vão em pedaços para os lados, e a mensagem é do piloto Ingo Hoffmann.
- **Chevrolet Vectra Elite (2.4 16V FlexPower).** Painel novo, em tela, com a Dashboard e a Dashboard com multimídia: aros cromados e mostradores pretos, conta-giros, velocímetro, temperatura e combustível, visor com o parcial em cima e o total embaixo, em algarismos de 7 segmentos iguais aos do Astra, 10 luzes-espia e iluminação âmbar. Na simulação: 146 cv, 23,2 kgfm, 1.430 kg, pneus 215/50 R17 e tanque de 60 L, da ficha técnica, e corte de giro a 6.500 rpm. Som gravado no Engine Simulator com um motor montado para o Elite (`motores/vectra_elite_24_16v.mr`).
- **Corsa GT Spec.** Painel novo de um Corsa preparado, em tela, com a Dashboard e a Dashboard com multimídia: coroa de LEDs no conta-giros, turbo, marcha, shift light que acende a 6.000 rpm e telinhas de LCD com pressão do óleo e do combustível, sonda, temperaturas, TPS, bateria e avanço; a luz da reserva (vermelha) e a de temperatura alta (piscando); iluminação âmbar. Abre com os hodômetros e o tanque zerados e o motor a 95 °C.
- **Turbo.** O GT Spec é um Corsa 1.6 8V com turbo regulado em 1,3 bar, que começa a encher a 2.500 rpm e fica cheio a 4.000, com o atraso de um turbo de verdade (sobe devagar, cai depressa); com o pé fora vai a vácuo, e com pressão o torque passa do dobro. A pressão se regula de 0,3 a 3 bar no regulador **KOUKI**, no canto dos controles (arrastar em volta, rodinha do mouse ou setas), desenhado como um regulador manual de alumínio, com a pressão escolhida embaixo dele. Passar de 2,3 bar por mais de um segundo e meio quebra o motor: ele apaga com um estouro, o aviso "Motor quebrado" aparece e o motor só pega de novo depois do botão "Consertar motor". As telinhas que o simulador não mede (pressões, sonda, temperaturas, bateria e avanço) saem do giro, do turbo e do acelerador.
- **Som do turbo.** Sintetizado no painel, por cima do som do motor (gravado com `motores/corsa_gt_spec.mr`: o 1.6 com comando mais bravo, admissão e escape mais livres e corte a 6.800 rpm): o assobio da turbina, que sobe com a pressão, e a válvula de alívio ao tirar o pé com o turbo cheio, com o espirro de ar e o piado da válvula, mais alto e mais longo quanto mais pressão havia. O som da válvula se ajusta na engrenagem acima do regulador (volume, tom, duração e piado, com um botão para testar); o ajuste fica gravado para cada painel, e "Som original" volta ao padrão.
- **Setas separadas e pisca-alerta.** No Astra, no Vectra B, no Vectra Elite e no Corsa GT Spec, que têm uma luz para cada seta, os botões "Seta esquerda", "Seta direita" e "Pisca-alerta" substituem o "Setas". No teclado, A e D ligam cada seta (ligar uma desliga a outra, como a alavanca) e H liga o pisca-alerta; no controle, o pisca-alerta é o botão Share. No Corsa e no Kadett, que têm uma luz só para as duas setas, nada muda.
- **Logos dos painéis novos** no menu: os emblemas VECTRA, 2.2 16V e challenge, os do Vectra Elite (VECTRA, ELITE e FLEXPOWER) e o GT spec do Corsa.

### Mudanças

- **Corsa:** a bomba do combustível agora é o símbolo do painel (decalcado), e continua acendendo em vermelho quando o ponteiro entra na faixa vermelha; o símbolo da eletrônica, na fenda de cima, ficou centrado no espaço dele.
- **Kadett:** som do motor regravado, sem os picotes: o gravador agora usa um buffer maior e não perde mais pedaços da captura enquanto o Engine Simulator ocupa o processador.

### Observações

- As relações de câmbio e de diferencial do Vectra B e do Vectra Elite são as que se costuma citar ou estimadas; não foram conferidas em manual.
- A foto do painel inteiro do Vectra B corta a ponta direita: o lado direito da carcaça é o esquerdo espelhado.
- O Vectra Elite e o Corsa GT Spec ainda não têm a versão com a carcaça.
- O Engine Simulator não tem turbo: o som do motor do GT Spec é aspirado, e o turbo é sintetizado por cima.

## 1.3

### Novo

- **Chevrolet Kadett GLS 98 (2.0 MPFI).** Painel novo nas três versões: original com a carcaça, Dashboard e Dashboard com multimídia. Velocímetro 20–220 e conta-giros 0–70 (x100) com a faixa vermelha antes do 70, hachurada no começo; temperatura e combustível no miolo central de baixo, com a bomba acendendo em vermelho na reserva; hodômetro total de 6 tambores e parcial de 3 com o décimo, e o botão serrilhado de zerar o parcial, no meio da faixa das luzes (clique nele); 7 luzes-espia (injeção, setas, farol alto, freio, temperatura, óleo e bateria) em que o fundo da janela é que acende; iluminação âmbar, com os ponteiros acesos em laranja.
- **Miolo central à escolha.** No Kadett, "Miolo central" nos controles troca o quadro de cima entre **só a luz de bateria** (ponteiros claros) e **completo**, com voltímetro e pressão do óleo (ponteiros laranja), como nos dois painéis que existiram. As marcas são brancas nas duas e ficam amarelas com a iluminação. A escolha fica gravada no navegador e pode ser trocada a qualquer momento, até com o motor ligado; na versão completa aparecem os sliders de bateria e de óleo.
- **Voltímetro e pressão do óleo dirigindo.** Com a ignição ligada e o motor parado o voltímetro marca 12,4 V; com o motor funcionando, 14,2 V, e a pressão do óleo sobe com o giro. Desligado, os dois descem ao batente.
- **Kadett na simulação.** 110 cv, 17,6 kgfm, 1.050 kg, pneus 185/65 R14 e tanque de 60 L, da ficha técnica; corte de giro a 6.300 rpm e marcha lenta a 900 rpm. Na ignição acendem as luzes de bateria, óleo e injeção. Som gravado no Engine Simulator com um motor montado para o Kadett (`motores/kadett_20_mpfi.mr`): o 2.0 da mesma família do Astra, com corte a 6.300 rpm, escape e admissão próprios.
- **Multimídia do Kadett:** a mensagem é do piloto Peter Oberndorfer.

### Observações

- As relações de câmbio e de diferencial e as rotações de potência e torque máximos do Kadett não aparecem nas fichas; são estimadas.
- A foto da versão completa é pequena: a disposição do voltímetro e da pressão do óleo segue a foto, mas os valores das escalas são aproximados.
- As escalas dos mostradores foram feitas uniformes e simétricas; nas fotos a perspectiva da câmera as deixa um pouco tortas.

## 1.2

### Novo

- **Direção.** Setas ← → no teclado, analógico esquerdo no controle ou um volante. A lista de comandos (o botão de teclado ao lado da marcha) ganhou a linha da direção.
- **Qualquer volante, pedaleira, câmbio ou controle.** Na lista de comandos, clique num comando e acione o botão, o pedal ou o volante para ligá-lo; vale qualquer aparelho que o navegador reconheça, inclusive vários ao mesmo tempo. As ligações ficam gravadas no navegador, e "Restaurar padrão" volta ao mapeamento acima. Com "Volante (direção direta)" o eixo comanda direto o esterço das rodas.
- **Curvas e aderência.** Os pneus de cada eixo têm aderência limitada, dividida entre acelerar, frear e fazer curva. Uma curva gasta velocidade e derruba o giro, tanto mais quanto mais fechada. No limite aparece um aviso ao lado da marcha: "Patinando" (o giro e o velocímetro sobem mais que o veículo), "Rodas travadas" (sem ABS; com as rodas da frente travadas o velocímetro cai a zero), "Saindo de frente" e "Saindo de traseira" (tirar o pé, frear ou puxar o freio de mão no meio da curva solta a traseira e o veículo pode rodar). No analógico e no teclado o esterço máximo diminui com a velocidade, como nos jogos.
- **Som do motor.** Dirigindo, o painel toca o som do motor de cada veículo: marcha lenta, subida de giro, corte e motor de partida, com volume e brilho acompanhando o acelerador. Abre sempre desligado: o botão de alto-falante ao lado da marcha liga, e ao lado dele aparece o slider de volume. Os sons foram gravados no Engine Simulator com motores montados para o Corsa 1.6 8V, o Astra 2.0 8V e a CG 125 (pasta `motores/`).
- **Embreagem.** Shift esquerdo no teclado ou L1 no controle (ou um pedal, pela lista de comandos): pisada, solta o motor das rodas. Não é obrigatória; as marchas continuam trocando sem ela.
- **CG 125 sem corte de giro.** O motor varetado da CG não tem corte: perto do giro máximo ele vai perdendo força até não subir mais, e o som não cai.

### Mudanças

- **Todos:** o velocímetro passou a ler a roda dianteira, como no veículo: acelerando forte ele marca um pouco acima da velocidade real, e patinando ou travando a roda, bem diferente.
- **Corsa e Astra:** ao ligar a ignição, as luzes de ABS (nos dois) e de airbag (no Corsa) não acendem mais no teste de 3 segundos; no Astra o teste ficou com imobilizador e airbag.
- **Astra:** na partida o giro sobe a 1.500 rpm antes de voltar para a marcha lenta.
- **Corsa:** nos mostradores de combustível e temperatura o eixo do ponteiro fica na vertical do centro, com a escala e os símbolos simétricos, e os números ficam na direção dos traços.
- **Corsa:** números dos mostradores em negrito, como no painel original; no conta-giros ganharam mais folga até os traços.
- **Todos:** em tamanhos pequenos os números dos mostradores saíam borrados, com um traço duplicado e franjas coloridas nas bordas; agora são desenhados só com o preenchimento, suavizado em tons de cinza.

### Observações

- Distribuição de peso, altura do centro de gravidade, divisão dos freios e dados dos pneus são valores típicos, não medidos nesses veículos.
- A moto usa o mesmo modelo de dois eixos dos carros: ela não inclina nem cai.
- Volantes e pedaleiras foram testados com aparelhos simulados, não com um de verdade.
- O som vem de motores simulados com as medidas básicas de cada um, não de gravações dos veículos reais, e foi gravado só com o acelerador no fundo.

## 1.1

### Novo

- **Dirigir pelo teclado ou por um controle de videogame.** O painel simula o veículo andando: motor, embreagem, marchas, arrasto e freios movem o conta-giros e o velocímetro. A marcha engatada aparece no canto da janela, e o botão de teclado ao lado dela mostra as teclas e os botões. Mexer num slider com o mouse devolve o comando aos sliders.

  | Função | Teclado | Controle |
  | --- | --- | --- |
  | Acelerador | W | R2 |
  | Freio | S | L2 |
  | Sobe marcha | E | ✕ |
  | Desce marcha | Q | □ |
  | Freio de mão (segurando) | Espaço | ○ |
  | Ré (com o veículo parado) | R | △ |
  | Setas | A / D | Direcional esquerda/direita |
  | Farol alto | F | Direcional para cima |
  | Faróis (iluminação do painel) | L | L3 |
  | Ignição e partida | I | Options |

  O controle (PlayStation, Xbox ou compatível) segue o mapeamento do Gran Turismo 7, com as setas no direcional em vez do touchpad.
- **Ignição e partida nos carros.** O Corsa e o Astra ganharam um miolo de ignição no canto dos controles, com as posições B, I, II e III. Em II acendem as luzes de bateria, óleo e injeção, e por 3 segundos as de teste (ABS e airbag; no Astra também a do imobilizador). Um clique no miolo leva à I e outro à II. Em II, clicar e segurar dá a partida: o motor de partida gira e o motor pega, o giro sobe a uns 1.100 rpm e volta para a marcha lenta, e as luzes apagam; um clique só volta para a I e desliga o motor. Também dá para clicar direto numa marca, ou usar a tecla I (Options no controle), que liga a ignição, dá a partida e, com o motor funcionando, desliga. Depois de uma pane seca é preciso dar a partida de novo.
- **Partida na CG.** O miolo continua no painel e liga o contato; no canto dos controles ficam o botão vermelho de partida elétrica, em cima, e o pedal de partida, embaixo. Com o contato ligado, o motor pega segurando o botão ou com um clique no pedal, e a luz à esquerda deles acende enquanto o motor funciona. A tecla I (Options no controle) liga o contato, dá a partida e, com o motor funcionando, desliga.
- **Corte de giro.** No limite de rotação o motor corta e o ponteiro fica batendo, em neutro ou engatado (6.400 rpm no Corsa e no Astra). Em neutro o motor gira livre e a marcha lenta dos dois carros fica em 900 rpm.
- **Consumo de combustível.** Dirigindo, o tanque desce conforme o esforço do motor; com o acelerador solto e a marcha engatada a injeção corta e não gasta. O seletor "Tempo" acelera o consumo junto com o hodômetro. Com o tanque praticamente vazio aparece o aviso "Combustível acabando", o motor engasga por alguns segundos e morre: o giro zera e o veículo vai perdendo velocidade. Mexer no slider de combustível abastece, e é preciso dar a partida de novo. Com o tanque vazio o motor nem pega.
- **Dados de cada veículo na simulação.** Corsa 1.6 8V (92 cv), Astra 2.0 8V (133 cv) e CG 125 Titan 2000 (12,5 cv), com peso, pneus e aerodinâmica das fichas técnicas.
- **"Desbloquear limite de velocidade".** Caixa de marcar embaixo do slider de velocidade que libera até 500 km/h. O ponteiro continua além do fim da escala até encontrar um obstáculo: no Corsa ele bate no pino de zerar o parcial (perto de 249 km/h); no Astra e na CG ele dá a volta até encostar por trás no batente do zero.

### Mudanças

- **Corsa:** o painel passou a se chamar "Painel Corsa GLS Millenium Super com conta giros". A pasta e as três páginas foram renomeadas, então links diretos para os arquivos da 1.0 deixam de valer.
- **Corsa:** ponteiros do conta-giros e do velocímetro mais curtos; a ponta agora para pouco depois do começo do traço grande.
- **Astra:** o slider de velocidade vai até 230 km/h, o fim da escala, sem precisar desbloquear.
- **Astra:** o indicador de troca de marcha vem desligado, como o interruptor do carro. O botão "Indicador de troca de marcha" ativa; só então a luz acende na hora de trocar.
- **Todos:** o seletor "Tempo" começa em 1× (tempo real).
- **CG 125:** o emblema da Honda entre os mostradores agora é a imagem do emblema, com o fundo recortado, na posição e no tamanho da foto do painel.

### Observações

- As relações de câmbio e de diferencial usadas na simulação são as que se costuma citar para esses modelos; não foram conferidas em manual.
- Os painéis abrem com o tanque em zero e com o motor desligado: abasteça pelo slider de combustível e dê a partida antes de sair.

## 1.0

- Primeira versão: painéis do Chevrolet Corsa (azul, com conta-giros), Chevrolet Astra 2011 (mostradores brancos) e Honda CG 125 Titan 2000, cada um nas versões painel original, Dashboard e Dashboard com multimídia.
- Seletor de painéis e executável para Windows, que também liga a multimídia à música que está tocando no computador.
