// Painel Honda CG 125 (2000): desenho e lógica compartilhados pelos três painéis.
// Cada peça é desenhada em volta do próprio centro (0,0); `place` diz onde cada uma fica: [x, y, escala].
// Medidas em pixels da foto de referência (797x491). Precisa de icones.js (bomba de combustível) carregado antes.
const CG = (() => {
  const $ = id => document.getElementById(id), RAD = Math.PI / 180;
  const pol = (r, a) => [r * Math.sin(a * RAD), -r * Math.cos(a * RAD)];
  const xy = (r, a) => pol(r, a).map(v => v.toFixed(1)).join(',');
  const arco = (r, a1, a2) => `M${xy(r, a1)}A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${xy(r, a2)}`;
  const RB = 176, RF = 138; // raio de fora da cápsula e do mostrador

  // Velocímetro: ângulo do traço de cada 10 km/h (0 a 140) medido na foto; a escala fecha um pouco para a direita.
  // Ângulos em graus, 0 = para cima, horário positivo.
  const VEL = [-119.8, -102.8, -85.9, -69, -52.4, -35.4, -19.2, -3.2, 12.8, 28.6, 44.5, 60, 75, 90, 104.7];
  const velRaw = v => { const i = Math.min(13, Math.floor(v / 10)); return VEL[i] + (v / 10 - i) * (VEL[i + 1] - VEL[i]); };
  // parado, o ponteiro encosta num batente um pouco acima do 0; com o limite desbloqueado ele passa do 140 e dá a volta até encostar nesse batente por trás
  const velAngle = v => Math.min(244, Math.max(-114, velRaw(v)));
  console.assert(velAngle(0) === -114 && Math.abs(velAngle(75) - 4.8) < .01 && velAngle(140) === 104.7, 'velAngle');

  // Combustível: o eixo do ponteiro fica escondido pela tampa "FUEL", abaixo do centro da cápsula
  const PIVO = 118, DESCANSO = -53;      // sem contato o ponteiro cai abaixo do E
  const fuelAngle = f => -36 + f * 70;   // 0 = começo da faixa vermelha, 1 = fim da faixa clara
  // Boia com mau contato, como no vídeo de referência: o ponteiro vai rápido para um lado, para 50 ms e vai para o outro;
  // cada ida é menor e mais lenta que a anterior, até parar. A 1ª tem ±9,25° (uns 10 mm na ponta de um ponteiro de ~31 mm).
  // São 8 idas (uma a mais que no vídeo, a pedido: ~20% mais tempo para estabilizar), com a última em ~1°.
  const BALANCO = 9.25, PAUSA = 50, IDAS = 8;
  const ida = n => ({ amp: BALANCO * 0.737 ** n, dur: 100 + 22 * n }); // n = 0, 1, 2…: tamanho (graus) e tempo (ms) da ida
  console.assert(ida(0).amp === 9.25 && ida(0).dur === 100 && ida(7).dur === 254 && ida(7).amp < 1.1, 'ida');

  const tick = (r1, r2, a, w, cls = '') => {
    const [x1, y1] = pol(r1, a), [x2, y2] = pol(r2, a);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${w}"${cls && ` class="${cls}"`}/>`;
  };
  // w = largura exata do texto (textLength): estica a fonte como a do painel e garante que o número não encosta nos traços
  const text = (x, y, txt, cls, w) => `<text x="${x}" y="${y}" class="${cls}"${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ''}>${txt}</text>`;

  // ---- hodômetro de tambores (5 algarismos + décimo) ----
  function drum(id, cx, cy, n, W, H) {
    let s = `<g id="${id}" class="drum" data-h="${H}"><rect class="dwin" x="${cx - n * W / 2 - 1.5}" y="${cy - H / 2 - 1}" width="${n * W + 3}" height="${H + 2}" rx="1.5"/>`;
    for (let i = 0; i < n; i++) {
      // <svg> aninhado recorta o tambor na janela
      s += `<svg x="${cx - n * W / 2 + i * W}" y="${cy - H / 2}" width="${W}" height="${H}"${i === n - 1 ? ' class="tenth"' : ''}>${i === n - 1 ? `<rect x="1" width="${W - 2}" height="${H}"/>` : ''}<g class="strip">`;
      // próximo algarismo fica acima: o tambor gira para baixo
      for (let k = 0; k <= 10; k++) s += `<text x="${W / 2}" y="${H / 2 + 5 - k * H}">${k % 10}</text>`;
      s += '</g></svg>';
    }
    return s + '</g>';
  }
  // posição (0..10) do tambor i (0 = menos significativo): o último gira contínuo,
  // os demais só giram junto enquanto os inferiores passam de 9 para 0
  function drumPos(value, i) {
    if (i === 0) return value % 10;
    const p = 10 ** i, d = Math.floor(value / p) % 10;
    return d + Math.max(0, value % p - (p - 1));
  }
  console.assert(drumPos(9.5, 0) === 9.5 && drumPos(9.5, 1) === 0.5 && drumPos(199.5, 2) === 1.5 && drumPos(123, 1) === 2, 'drumPos');
  function setDrum(id, value) {
    const strips = $(id).querySelectorAll('.strip'), n = strips.length, H = $(id).dataset.h;
    strips.forEach((s, j) => s.setAttribute('transform', `translate(0,${(drumPos(value, n - 1 - j) * H).toFixed(2)})`));
  }

  // ---- lentes das espias: setor de anel desenhado no topo e girado até o lugar; o símbolo fica em pé ----
  // id -> [rótulo, texto em volta, ângulo, cor acesa, cor apagada, cor da trama, símbolo]
  const LAMPS = {
    neutro: ['Neutro', 'NEUTRAL', -60, '#35e58a', '#16241f', '#3fae82', '<text class="b" style="font-size:17px">N</text>'],
    seta: ['Seta', 'TURN', 0, '#ffe21f', '#6a2a1a', '#e8a52c', '<path class="nf" stroke-width="1.3" stroke-linejoin="round" d="M-2.5-3.2h-6v-3.3l-7.5 6.5 7.5 6.5v-3.3h6zM2.5-3.2h6v-3.3l7.5 6.5-7.5 6.5v-3.3h-6z"/>'],
    alto: ['Farol alto', 'HI-BEAM', 60, '#2ea6ff', '#1b2330', '#4d8fd0', '<path class="nf" stroke-width="1.4" d="M2-8a9 8 0 0 1 0 16zM-2.5-6.5h-9M-2.5-3.25h-9M-2.5 0h-9M-2.5 3.25h-9M-2.5 6.5h-9"/>'],
  };
  // as três lentes têm exatamente o mesmo formato e tamanho e ficam na mesma linha de raio (LP), perto da borda do mostrador; só muda o giro
  const LP = 105, LR = 95, LD =(r1 => `M${xy(LR + 15.5, -23)}A${LR + 15.5},${LR + 15.5} 0 0 1 ${xy(LR + 15.5, 23)}L${xy(r1, 23)}A${r1},${r1} 0 0 0 ${xy(r1, -23)}Z`)(LR - 15.5);
  const lente = id => {
    const [, nome, a, c, off, dot, sym] = LAMPS[id], lugar = `transform="rotate(${a}) translate(0,${LR - LP})"`;
    // o texto acompanha a lente, 5 px por fora dela
    return `<g ${lugar}><path id="cgArco_${id}" fill="none" d="${arco(LR + 20.5, -45, 45)}"/>` +
      `<text class="rot"${id === 'seta' ? ' style="letter-spacing:5px"' : ''}><textPath href="#cgArco_${id}" startOffset="50%" text-anchor="middle">${nome}</textPath></text></g>` +
      `<g id="i_${id}" class="lamp${id === 'seta' ? ' blink' : ''}" style="--c:${c};--off:${off};--dot:${dot}">` +
      `<g ${lugar}><path class="lente" d="${LD}"/><path class="trama" d="${LD}" mask="url(#cgTramaM)"/><path class="vidro" d="${LD}"/></g>` +
      `<g class="sym" transform="translate(${xy(LP, a)})">${sym}</g></g>`;
  };

  const capsula = `<circle class="housing" r="${RB}" fill="url(#cgAro)"/><circle r="148" fill="#09090a"/><circle r="140.5" fill="none" stroke="#6d6f73" stroke-width="1"/>`;
  // centro e largura de cada número na foto
  const NUMS = [[0, -93, 48.4, 15], [10, -96.6, 21.5, 27], [20, -94.1, -10.5, 32], [40, -84.1, -60.5, 33], [60, -30.5, -98.8, 30.5], [80, 24.9, -104.1, 31.5], [100, 78.4, -73.8, 42], [120, 101.6, -21.3, 40], [140, 89, 29.1, 42]];
  const MARCHAS = [[-62, -63.4, -29.1], [-20, -30.5, -65.5], [11, 9.5, -70.2], [41.5, 47.4, -55.9], [70.5, 67.7, -27.5]]; // ângulo do traço e posição do número
  const band = (a1, a2, cls) => { // pedaço da faixa do combustível: entre dois raios que saem do eixo, da linha de cima até a tampa
    const x = (a, y) => ((PIVO - y) * Math.tan(a * RAD)).toFixed(1);
    return `<path class="${cls}" d="M${x(a1, 33.5)},33.5H${x(a2, 33.5)}L${x(a2, 67)},67H${x(a1, 67)}Z"/>`;
  };

  const PARTS = {
    spd: () => {
      // faixa vermelha em blocos, de 0 a 140
      let m = `<path class="faixa" d="${arco(131, VEL[0] - 3, VEL[14] + 4)}"/>`;
      for (let v = 5; v <= 135; v += 5) m += tick(127, 135, velRaw(v), 1, 'sep');
      for (let v = 10; v <= 140; v += 10) m += tick(115.5, 123.5, velRaw(v), 3, v === 70 || v === 80 ? 'az' : '');
      for (const [n, x, y, w] of NUMS) m += text(x, y, n, 'n', w);
      // escala interna das marchas
      m += `<path class="marcha" d="${arco(62.5, -91, 70.5)}"/>` + MARCHAS.map(([a, x, y], i) => tick(62.5, 67, a, 1.1, 'mg') + text(x, y, i + 1, 'g')).join('');
      m += text(0, 91.2, 'km/h', 'b', 62.5);
      const parafuso = x => `<circle cx="${x}" r="5" fill="#0c0c0d"/><circle cx="${x}" r="3.4" fill="url(#cgMetal)"/><path d="M${x - 2.4},-2.4l4.8,4.8M${x + 2.4},-2.4l-4.8,4.8" stroke="#2a2c30" stroke-width=".9"/>`;
      return capsula + `<circle class="face" r="${RF}"/><g class="marks">${m}</g>${parafuso(-43)}${parafuso(43)}${drum('odo', 1.6, 51.2, 6, 16.1, 17.8)}` +
        `<circle r="16" fill="url(#cgCubo)"/><path id="nVel" class="needle" d="M-1,-128L1,-128L2.6,0L2,34L-2,34L-2.6,0Z"/><circle r="4.5" fill="#101011"/>`;
    },
    pod: () => capsula + `<circle class="face" r="${RF}"/>` +
      `<g class="marks">${Object.keys(LAMPS).map(lente).join('')}` +
      // ressalto em "D" no meio da cápsula
      `<path d="M-52,-6A52,41 0 0 1 52,-6V16Q52,23.5 44,23.5H-44Q-52,23.5 -52,16Z" fill="url(#cgDomo)" stroke="#3b3c40" stroke-width=".8"/>` +
      // marcador de combustível: leque cinza, faixa (reserva vermelha + 3 partes claras) e letras
      `<path class="leque" d="M-65,32H65L115,76.3A138,138 0 0 1 -115,76.3Z"/>${band(-36.5, -28, 'reserva')}${band(-28, 34.5, 'nivel')}` +
      [-6, 14].map(a => `<line class="div" x1="${((PIVO - 33.5) * Math.tan(a * RAD)).toFixed(1)}" y1="33.5" x2="${((PIVO - 67) * Math.tan(a * RAD)).toFixed(1)}" y2="67"/>`).join('') +
      text(-63.5, 58, 'E', 'b', 13) + text(63.5, 57, 'F', 'b', 12) + '</g>' +
      `<g transform="translate(0,${PIVO})"><path id="nFuel" class="needle" d="M-.9,-96L.9,-96L1.9,0L-1.9,0Z"/></g>` +
      // a tampa esconde o eixo do ponteiro
      `<path d="M-50,67H50Q56,67 60,71.5L86,108A138,138 0 0 1 -86,108L-60,71.5Q-56,67 -50,67Z" fill="url(#cgTampa)" stroke="#111112" stroke-width=".8"/>` +
      `<g class="marks"><path class="icf" fill-rule="evenodd" transform="translate(1.5,93.5) scale(1.3)" d="${ICONES.bomba}"/>${text(0, 118, 'FUEL', 'b', 53.6)}</g>`,
    // miolo da ignição: desligado = fenda em pé; contato = 45° para a direita
    ign: () => `<g id="chave" tabindex="0" role="button" aria-label="Ignição" aria-pressed="false"><circle r="44" fill="#0a0a0b"/><circle r="39.5" fill="#1b1b1e" filter="url(#cgGrao)"/>` +
      `<path id="cgIgn" fill="none" d="M${xy(36, -86)}A36,36 0 0 0 ${xy(36, 190)}"/><text class="relevo"><textPath href="#cgIgn" startOffset="50%" text-anchor="middle">IGNITION</textPath></text>` +
      `<g class="relevo nf"><circle cy="-31.5" r="4.2"/><path d="M-2.9,-34.4l5.8,5.8M2.9,-34.4l-5.8,5.8"/><path transform="translate(${xy(31.5, 45)})" d="M3.6,2.1A4.2,4.2 0 1 1 2.1,-3.6"/></g>` +
      `<g id="miolo"><circle r="23.2" fill="url(#cgMetal)" stroke="#08080a" stroke-width="1.4"/><rect x="-3.4" y="-15" width="6.8" height="30" rx=".8" fill="#4b5058" stroke="#23262b" stroke-width=".7"/></g></g>`,
  };
  // emblema da Honda entre as cápsulas, na posição e no tamanho em que aparece na foto do painel aceso
  PARTS.honda = () => `<image class="housing" href="honda.png" x="-33" y="-26.3" width="66" height="52.6"/>`;
  // disposição do painel original (centros das cápsulas e do furo da ignição na foto); peça com valor null não é desenhada
  const PLACE = { spd: [206.8, 196, 1], pod: [582.8, 196, 1], ign: [395.8, 403.7, 1], honda: [394.8, 266, 1] };

  const DEFS = `<defs>
    <linearGradient id="cgCorpo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d2d30"/><stop offset="1" stop-color="#19191b"/></linearGradient>
    <linearGradient id="cgAro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#85888c"/><stop offset=".4" stop-color="#3b3c40"/><stop offset="1" stop-color="#1a1a1c"/></linearGradient>
    <radialGradient id="cgFace"><stop offset="0" stop-color="#2c2c2f"/><stop offset="1" stop-color="#151516"/></radialGradient>
    <radialGradient id="cgCubo" cx=".35" cy=".3"><stop offset="0" stop-color="#3c3d41"/><stop offset=".7" stop-color="#151517"/></radialGradient>
    <linearGradient id="cgMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef0f2"/><stop offset=".45" stop-color="#9da2a8"/><stop offset=".6" stop-color="#d7dadd"/><stop offset="1" stop-color="#70757c"/></linearGradient>
    <linearGradient id="cgDomo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3033"/><stop offset=".5" stop-color="#1b1b1d"/><stop offset="1" stop-color="#141415"/></linearGradient>
    <linearGradient id="cgTampa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#37383a"/><stop offset="1" stop-color="#1f2021"/></linearGradient>
    <linearGradient id="cgVidro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <!-- trama das lentes: gotinhas em fileiras desencontradas, como o prisma do plástico -->
    <pattern id="cgTrama" width="6.4" height="5.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)"><ellipse cx="1.6" cy="1.4" rx="1.05" ry="1.6" fill="#fff"/><ellipse cx="4.8" cy="4.2" rx="1.05" ry="1.6" fill="#fff"/></pattern>
    <mask id="cgTramaM" maskUnits="userSpaceOnUse" x="-70" y="-130" width="140" height="80"><rect x="-70" y="-130" width="140" height="80" fill="url(#cgTrama)"/></mask>
    <filter id="cgGrao" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .53  0 0 0 .5 -.2"/><feComposite in2="SourceAlpha" operator="in" result="g"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge></filter>
  </defs>`;

  const CONTROLS = `<div>
    <div class="vel"><label>Velocidade <input id="vel" type="range" min="0" max="140" step="1" value="0"><output id="velO"></output></label>
      <label><input id="semLimite" type="checkbox"> Desbloquear limite de velocidade</label></div>
    <label>Combustível <input id="comb" type="range" min="0" max="100" value="0"><output id="combO"></output></label>
    <label>Tempo <select id="mult"><option value="1">1× (real)</option><option value="20" selected>20×</option><option value="200">200×</option></select></label>
    <label><input id="boia" type="checkbox"> Mau contato na boia de combustível</label>
  </div>
  <div id="luzes"><button id="chaveBtn" aria-pressed="false">🔑 Ignição</button><button id="luz" aria-pressed="false">💡 Iluminação</button></div>`;

  // CG 125 Titan 2000 para o controle e o teclado: motor OHV de 12,5 cv a 9.000 rpm e 1,0 kgf.m a 7.500 rpm, 5 marchas, pneu traseiro 90/90-18
  // (dados da geração 2000 a 2004). O peso é aproximado e as relações (primária 4,055, coroa 43 e pinhão 14)
  // não achei em fonte confiável e são as que se costuma citar; final = primária x coroa/pinhão. Moto não tem ré.
  const VEICULO = { cv: 12.5, rpmCv: 9000, kgfm: 1, rpmKgfm: 7500, rpmMax: 9800, lenta: 1400, marchas: [2.769, 1.722, 1.272, 1, .815], re: 0, final: 4.055 * 43 / 14,
    pneu: [90, 90, 18], kg: 114, cxA: .6, inercia: .006 };

  /**
   * Desenha o painel dentro de `target` (um <g> do SVG) e liga os controles em #ctl.
   * place: { spd | pod | ign | honda: [x, y, escala] } para mudar de lugar qualquer peça (o resto fica na posição original); null tira a peça
   */
  function build({ target, place = {} }) {
    const root = target.ownerSVGElement, pl = { ...PLACE, ...place };
    root.insertAdjacentHTML('afterbegin', DEFS);
    target.innerHTML = Object.entries(pl).filter(([, lugar]) => lugar).map(([k, [x, y, s]]) => `<g transform="translate(${x},${y}) scale(${s})">${PARTS[k]()}</g>`).join('');

    $('ctl').innerHTML = CONTROLS;
    const lamp = Object.fromEntries(Object.entries(LAMPS).map(([id, [label, , , c]]) => {
      const b = document.createElement('button');
      b.textContent = label; b.dataset.luz = id; b.style.setProperty('--c', c); b.setAttribute('aria-pressed', false);
      b.set = on => b.setAttribute('aria-pressed', $('i_' + id).classList.toggle('on', on));
      b.onclick = () => b.set();
      $('luzes').append(b);
      return [id, b];
    }));

    // sem contato nada acende e o ponteiro do combustível cai para o descanso
    let ligada = false, luz = false;
    // balanço da boia: desvio = quanto o ponteiro está fora do lugar agora; prox = número da próxima ida (IDAS = parado)
    let desvio = 0, durIda = 0, prox = IDAS, sinal = 1, fim = 0;
    const parar = () => { prox = IDAS; desvio = durIda = fim = 0; };
    const rot = (id, a) => $(id).style.transform = `rotate(${a}deg)`;
    const fuel = () => {
      $('nFuel').style.transitionDuration = durIda ? durIda + 'ms' : '.6s';
      rot('nFuel', (ligada ? fuelAngle($('comb').value / 100) : DESCANSO) + desvio);
    };
    const upd = () => {
      rot('nVel', velAngle(+$('vel').value)); fuel();
      $('velO').textContent = $('vel').value + ' km/h'; $('combO').textContent = $('comb').value + ' %';
    };
    const estado = () => {
      const aceso = ligada && luz;
      root.classList.toggle('ign', ligada); root.classList.toggle('lit', aceso); document.body.classList.toggle('lit', aceso);
      $('luz').setAttribute('aria-pressed', luz);
      for (const e of [$('chave'), $('chaveBtn')]) e.setAttribute('aria-pressed', ligada);
      rot('miolo', ligada ? 45 : 0); fuel();
    };
    // ao ligar o contato a luz do neutro acende (dá para apagar no botão, como ao engatar uma marcha)
    const ignicao = () => { ligada = !ligada; lamp.neutro.set(ligada); if (!ligada) parar(); estado(); };
    $('chave').onclick = $('chaveBtn').onclick = ignicao;
    $('chave').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') ignicao(); };
    $('luz').onclick = () => { luz = !luz; estado(); };
    $('boia').onchange = () => { parar(); fuel(); };
    $('vel').oninput = $('comb').oninput = upd;
    $('semLimite').onchange = () => { $('vel').max = $('semLimite').checked ? 500 : 140; upd(); }; // ao desmarcar, o navegador traz a velocidade de volta ao limite
    upd(); estado();

    let odo = 0, last = performance.now(), vRef = 0, tRef = last;
    (function frame(now) {
      const dt = Math.min(now - last, 250) / 1000; last = now; // limite: aba em segundo plano não dá salto
      const v = +$('vel').value;
      odo = (odo + v * dt / 3600 * $('mult').value) % 1e5;
      setDrum('odo', odo * 10);
      // mudança brusca de velocidade (5 km/h ou mais em 1/4 de segundo) = moto balançando: a boia volta a balançar com força total;
      // com a velocidade calma, as idas vão diminuindo até o ponteiro parar
      if (now - tRef >= 250) {
        if ($('boia').checked && ligada && Math.abs(v - vRef) >= 5) prox = 0;
        vRef = v; tRef = now;
      }
      if (now >= fim && (prox < IDAS || desvio)) {
        if (prox < IDAS) { const { amp, dur } = ida(prox++); sinal = -sinal; desvio = sinal * amp; durIda = dur; fim = now + dur + PAUSA; fuel(); }
        else { desvio = 0; durIda = 250; fuel(); durIda = 0; } // acabou: volta ao lugar
      }
      requestAnimationFrame(frame);
    })(last);
    if (typeof Controle !== 'undefined') Controle.ligar(VEICULO); // controle de videogame, se o controle.js estiver junto
  }

  return { build, PLACE };
})();
