# Changelog

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
- **Ignição e partida nos carros.** O Corsa e o Astra ganharam um miolo de ignição no canto dos controles, com as posições B, I, II e III. Em II acendem as luzes de bateria, óleo e injeção, e por 3 segundos as de teste (ABS e airbag; no Astra também a do imobilizador). Segurando a III o motor de partida gira e o motor pega: o giro sobe a uns 1.100 rpm e volta para a marcha lenta, e as luzes apagam. Clique numa marca para girar o miolo até ela, ou use a tecla I (Options no controle), que liga a ignição, dá a partida e, com o motor funcionando, desliga. Depois de uma pane seca é preciso dar a partida de novo. Na CG o miolo continua no painel.
- **Corte de giro.** No limite de rotação o motor corta e o ponteiro fica batendo, em neutro ou engatado (6.400 rpm no Corsa e no Astra). Em neutro o motor gira livre e a marcha lenta dos dois carros fica em 900 rpm.
- **Consumo de combustível.** Dirigindo, o tanque desce conforme o esforço do motor; com o acelerador solto e a marcha engatada a injeção corta e não gasta. O seletor "Tempo" acelera o consumo junto com o hodômetro. Com o tanque praticamente vazio aparece o aviso "Combustível acabando", o motor engasga por alguns segundos e morre: o giro zera e o veículo vai perdendo velocidade. Mexer no slider de combustível abastece; na moto o motor volta a funcionar, nos carros é preciso dar a partida. Com o tanque vazio o motor nem pega.
- **Dados de cada veículo na simulação.** Corsa 1.6 8V (92 cv), Astra 2.0 8V (133 cv) e CG 125 Titan 2000 (12,5 cv), com peso, pneus e aerodinâmica das fichas técnicas.
- **"Desbloquear limite de velocidade".** Caixa de marcar embaixo do slider de velocidade que libera até 500 km/h. O ponteiro continua além do fim da escala até encontrar um obstáculo: no Corsa ele bate no pino de zerar o parcial (perto de 249 km/h); no Astra e na CG ele dá a volta até encostar por trás no batente do zero.

### Mudanças

- **Corsa:** ponteiros do conta-giros e do velocímetro mais curtos; a ponta agora para pouco depois do começo do traço grande.
- **Astra:** o slider de velocidade vai até 230 km/h, o fim da escala, sem precisar desbloquear.
- **Astra:** o indicador de troca de marcha vem desligado, como o interruptor do carro. O botão "Indicador de troca de marcha" ativa; só então a luz acende na hora de trocar.
- **Todos:** o seletor "Tempo" começa em 1× (tempo real).
- **CG 125:** o emblema da Honda entre os mostradores agora é a imagem do emblema, com o fundo recortado, na posição e no tamanho da foto do painel.

### Observações

- As relações de câmbio e de diferencial usadas na simulação são as que se costuma citar para esses modelos; não foram conferidas em manual.

## 1.0

- Primeira versão: painéis do Chevrolet Corsa (azul, com conta-giros), Chevrolet Astra 2011 (mostradores brancos) e Honda CG 125 Titan 2000, cada um nas versões painel original, Dashboard e Dashboard com multimídia.
- Seletor de painéis e executável para Windows, que também liga a multimídia à música que está tocando no computador.
