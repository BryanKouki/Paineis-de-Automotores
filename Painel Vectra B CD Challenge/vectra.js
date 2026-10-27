// Painel Vectra B CD Challenge: desenho e lógica compartilhados pelas páginas.
// Medidas em unidades do painel (pixels do desenho de frente com escalas, referência 22). As formas (placa, janelas, setas, pinos),
// a posição de cada escala, cubo e ponteiro, os símbolos e as escalas escaneadas vêm de vectra-dados.js, carregado antes.
const Vectra = (() => {
  const $ = id => document.getElementById(id), RAD = Math.PI / 180;
  const P = (cx, cy, r, a) => [+(cx + r * Math.sin(a * RAD)).toFixed(2), +(cy - r * Math.cos(a * RAD)).toFixed(2)];
  const n1 = v => (+v).toFixed(1);
  const F = FORMAS.caminhos, M = FORMAS.medidas;
  const linha = (cx, cy, a, r1, r2, w, cls = '') => { const [x1, y1] = P(cx, cy, r1, a), [x2, y2] = P(cx, cy, r2, a); return `<line${cls && ` class="${cls}"`} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/>`; };
  // número na direção do traço: o centro recua o necessário para a caixa do número ficar a `folga` do fim do traço
  const num = (cx, cy, a, rFim, folga, txt, cw, ch, cls = '') => { const s = Math.abs(Math.sin(a * RAD)), c = Math.abs(Math.cos(a * RAD));
    const [x, y] = P(cx, cy, rFim - folga - (s * String(txt).length * cw + c * ch) / 2, a); return `<text${cls && ` class="${cls}"`} x="${n1(x)}" y="${n1(y)}">${txt}</text>`; };

  // ---- mostradores: posição, tamanho e giro de cada escala, cubo e ponteiro medidos no desenho 22 ----
  const E = M.escalas;
  // velocímetro: concêntrico à janela, com a coroa de blocos (desenhada no raio 168) encostada na moldura. A escala do mostrador
  // verdadeiro é girada uns graus no sentido anti-horário (o 0 mais baixo que o 260: desenho 22, arte do mostrador e foto 18); os
  // números e o "km/h" ficam em pé
  const SPD = { cx: E.spd.centro[0], cy: E.spd.centro[1], r: 168 }, KV = E.spd.K;
  const velA = v => -92.5 + E.spd.giro + Math.min(270, Math.max(0, v)) / 260 * 185;  // desbloqueado, passa do 260 até o batente
  // conta-giros: ângulo de cada traço (a cada 500 rpm, do 0 ao 7.000) medido do eixo da escala no scan; 0 rpm é o traço do 0, no pé
  // do arco (o 7.000 é a última perna da zona vermelha, 8,5° depois do 6.500, como os últimos intervalos)
  const RPM_ANG = [-96.2, -86.57, -76.91, -67.23, -57.59, -47.94, -38.56, -29.27, -20.02, -10.99, -2.23, 6.32, 14.7, 23.15, 31.6];
  const rpmEsc = v => { const x = Math.min(14, Math.max(0, v / 500)), i = Math.min(13, Math.floor(x)); return RPM_ANG[i] + (RPM_ANG[i + 1] - RPM_ANG[i]) * (x - i); };
  // temperatura e combustível vão de uma ponta à outra da escala (marcadas pelo Bryan): frio na ponta de fora do bloco azul, quente na
  // do vermelho; vazio na ponta de fora do bloco vermelho, cheio no traço do 1/1 (ângulos medidos no scan)
  const tempEsc = t => 90.4 - (Math.min(130, Math.max(50, t)) - 50) / 80 * 91.8;
  const combEsc = f => 90.6 - Math.min(1, Math.max(0, f)) * 91.9;
  // no desenho o cubo (eixo do ponteiro) não fica bem no centro das escalas: o ponteiro aponta do cubo para o ponto da escala, no raio
  // rho (unidades do scan) do eixo dela, que corresponde ao valor: no conta-giros o meio dos traços (555), na temperatura e no
  // combustível a borda de fora (410), onde estão os limites
  const mira = (e, rho, esc) => v => { const [tx, ty] = P(e.eixo[0], e.eixo[1], rho * e.esc, esc(v) + e.giro); return Math.atan2(tx - e.cubo[0], e.cubo[1] - ty) / RAD; };
  const rpmA = mira(E.tach, 555, rpmEsc), tempA = mira(E.temp, 410, tempEsc), combA = mira(E.fuel, 410, combEsc);
  console.assert(Math.abs(velA(130) - E.spd.giro) < 1e-9 && rpmA(0) < rpmA(3500) && rpmA(3500) < rpmA(7000) && tempA(50) > tempA(130) && combA(0) > combA(1), 'escalas');
  const TANQUE = 57, RESERVA = 8; // litros

  function marcas() {
    // conta-giros: scan 1:1 do redesenho nítido que o Bryan aprovou (arco, traços, números, texto, zona vermelha); o 7 e o 0 na fonte
    // dos outros números
    const pos = (e, eixo) => `translate(${e.eixo[0]},${e.eixo[1]}) rotate(${e.giro}) scale(${e.esc}) translate(${-eixo[0]},${-eixo[1]})`;
    const tach = `<g transform="${pos(E.tach, TACH94.eixo)}"><path class="bloco" fill-rule="evenodd" d="${TACH94.branco}"/>` +
      `<path class="vermf" fill-rule="evenodd" d="${TACH94.verm}"/><text class="sete" x="890" y="242">7</text><text class="sete" x="141" y="743">0</text></g>`;
    // velocímetro: coroa de blocos (um a cada 10 km/h) e um traço fino em cada vão; números grandes nos múltiplos de 20, pequenos no
    // 10, 30 e 50
    let s = '';
    for (let v = 0; v < 260; v += 10) { const a1 = velA(v) + .9, a2 = velA(v + 10) - .9, [x1, y1] = P(SPD.cx, SPD.cy, SPD.r, a1), [x2, y2] = P(SPD.cx, SPD.cy, SPD.r, a2),
      [x3, y3] = P(SPD.cx, SPD.cy, SPD.r - 8, a2), [x4, y4] = P(SPD.cx, SPD.cy, SPD.r - 8, a1);
      s += `<path class="bloco" d="M${x1},${y1}A${SPD.r},${SPD.r} 0 0 1 ${x2},${y2}L${x3},${y3}A${SPD.r - 8},${SPD.r - 8} 0 0 0 ${x4},${y4}Z"/>`; }
    // números grandes na direção do traço, com o centro onde está no desenho 22 (a caixa de cada número que entra na conta é a dos
    // números do desenho: 11,8 por algarismo e 13,5 de altura, a 3,1 do fim do traço; medido nos 13 números, erro de até 3 px)
    for (let v = 0; v <= 260; v += 10) { const fim = SPD.r - 18.5; s += linha(SPD.cx, SPD.cy, velA(v), fim, SPD.r, 1.6);
      if (v % 20 === 0) s += num(SPD.cx, SPD.cy, velA(v), fim, 3.07, v, 11.83, 13.46);
      else if (v <= 50) s += num(SPD.cx, SPD.cy, velA(v), fim, 2.5, v, 5, 6.4, 'p'); }
    s += `<text class="u" x="${SPD.cx}" y="${n1(SPD.cy - 75.6)}">km/h</text>`;
    const spd = `<g transform="translate(${SPD.cx},${SPD.cy}) scale(${KV.toFixed(4)}) translate(${-SPD.cx},${-SPD.cy})">${s}</g>`;
    // temperatura e combustível: scan 1:1 do redesenho nítido (cada um no seu eixo, com o giro do desenho)
    const tf = ['temp', 'fuel'].map(k => { const d = TF95[k];
      return `<g transform="${pos(E[k], d.eixo)}"><path class="bloco" fill-rule="evenodd" d="${d.branco}"/>` +
        `<path class="vermf" fill-rule="evenodd" d="${d.verm}"/><path class="azulf" fill-rule="evenodd" d="${d.azul}"/></g>`; }).join('');
    // cada escala recortada pela janela dela: o mostrador fica atrás da placa
    return [['tach', tach], ['spd', spd], ['tf', tf]].map(([k, m]) => `<g class="marks" clip-path="url(#vj_${k})">${m}</g>`).join('');
  }

  // ---- luzes-espia: id -> [rótulo, cor] (símbolos decalcados em SIMB); posição pelas legendas do desenho do manual ----
  const LAMPS = {
    neblinaT: ['Neblina traseira', '#ffb020'], abs: ['ABS', '#ffb020'], alto: ['Farol alto', '#2f8dff'], bat: ['Bateria', '#ff3b30'],
    neblinaD: ['Farol de neblina', '#2fd15a'], freio: ['Freio', '#ff3b30'], tc: ['Controle de tração', '#ffb020'],
    porta: ['Porta aberta', '#ffb020'], cruzeiro: ['Piloto automático', '#2fd15a'], inj: ['Injeção', '#ffb020'],
    velmax: ['Velocidade máxima', '#ffb020'], bomba: ['Reserva', '#ffb020'], oleo: ['Óleo', '#ff3b30'], airbag: ['Airbag', '#ff3b30'],
    cinto: ['Cinto', '#ff3b30'], seta: ['Setas', '#2fd15a'],
  };
  // [id, x, y] no desenho do manual (911x350) e as janelas dele; cada luz vai para a mesma fração da janela daqui
  const LUZES = [['neblinaT', 72, 277], ['abs', 112, 277], ['alto', 159, 277], ['bat', 205, 277], ['neblinaD', 261, 277], ['freio', 290, 277], ['tc', 316, 277],
    ['porta', 362, 277], ['cruzeiro', 389, 277], ['inj', 414, 277], ['bomba', 677, 248], ['oleo', 655, 282], ['airbag', 692, 282], ['cinto', 727, 282]];
  const MANUAL = { b1: [51, 268, 227, 286], b2: [247, 268, 328, 286], b3: [347, 268, 431, 286], velmax: [631, 235, 701, 261], direita: [624, 270, 795, 294] };
  const naJanela = (x, y) => { const [k, o] = Object.entries(MANUAL).find(([, b]) => x >= b[0] - 3 && x <= b[2] + 3 && y >= b[1] - 15 && y <= b[3] + 15), n = M.caixas[k];
    return [n[0] + (x - o[0]) / (o[2] - o[0]) * (n[2] - n[0]), (n[1] + n[3]) / 2, k]; };
  const lampada = (id, conteudo) => `<g id="i_${id}" class="luz${id === 'seta' ? ' blink' : ''}" style="--c:${LAMPS[id][1]}">${conteudo}</g>`;
  // as de baixo à direita (óleo, airbag, cinto) quase enchem a altura da janela, como na foto de noite
  const luz = ([id, x0, y0]) => { const [x, y, k] = naJanela(x0, y0), e = k === 'direita' ? 1.25 : .72;
    return lampada(id, `<path class="simb" fill-rule="evenodd" transform="translate(${n1(x)},${n1(y)}) scale(${e})" d="${SIMB[id]}"/>`); };
  const velmax = () => { const [x, y] = naJanela(648, 248);
    return lampada('velmax', `<text class="vt" x="${n1(x)}" y="${n1(y - 4.5)}">VEL</text><text class="vt" x="${n1(x)}" y="${n1(y + 4.5)}">MAX</text>`); };
  // setas: cabeça e rabo retangular medidos no desenho, espelhadas no eixo do velocímetro e na mesma altura
  const seta = lado => { const s = M.setas, X = d => n1(SPD.cx + lado * d), y = s.y;
    return `<path class="seta" d="M${X(s.ponta)},${y}L${X(s.costas)},${n1(y - s.meia_cabeca)}V${n1(y - s.meia_rabo)}H${X(s.fim)}V${n1(y + s.meia_rabo)}H${X(s.costas)}V${n1(y + s.meia_cabeca)}Z"/>`; };

  // ---- visor (cristal líquido): duas linhas de algarismos grandes em sete segmentos, parcial com "km" em cima e total embaixo ----
  const SEG = { a: [[1, 0], [9, 0], [8, 2], [2, 2]], b: [[9.4, .4], [9.4, 9], [8, 8], [8, 2]], c: [[9.4, 11], [9.4, 19.6], [8, 18], [8, 12]], d: [[1, 20], [9, 20], [8, 18], [2, 18]],
    e: [[.6, 11], [.6, 19.6], [2, 18], [2, 12]], f: [[.6, .4], [.6, 9], [2, 8], [2, 2]], g: [[1.2, 10], [2, 9], [8, 9], [8.8, 10], [8, 11], [2, 11]] };
  const DIG = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
  // algarismo de 10 x 20, esticado na largura como no desenho (0,6 da altura)
  const digito = (d, x, y, h) => Object.entries(SEG).map(([k, pts]) => `<polygon class="seg${DIG[d].includes(k) ? '' : ' off'}" points="${pts.map(([px, py]) => `${n1(x + (px * 1.2 - py * .12) * h / 20)},${n1(y + py * h / 20)}`).join(' ')}"/>`).join('');
  const texto = (s, x, y, h, passo) => [...s].map((ch, i) => ch === ' ' ? '' : digito(+ch, x + i * passo, y, h)).join('');
  const V = M.visor;
  const visor = (trip, total) => { const [ti, td] = trip.toFixed(1).split('.'), c = V.cima, b = V.baixo;
    return texto(ti.padStart(c.n, ' '), c.x, c.y, c.h, c.passo) + `<circle class="seg" cx="${V.ponto[0]}" cy="${V.ponto[1]}" r="${n1(c.h * .07)}"/>` + texto(td, V.decimal, c.y, c.h, c.passo) +
      `<text class="km" x="${V.km[0]}" y="${V.km[1]}">km</text>` + texto(String(Math.floor(total)).padStart(b.n, ' '), b.x, b.y, b.h, b.passo); };

  // ---- ponteiros e cubos ----
  // ponteiro como nas fotos 23 e 24: barra branca que afina pouco (0,3 do raio do cubo junto dele, 0,16 na ponta arredondada). No
  // conta-giros e no velocímetro sai do outro lado do cubo o contrapeso, uma lingueta clara (0,42 do raio de largura, até 1,55 raio
  // do eixo); temperatura e combustível não têm. O ponteiro fica atrás da placa: o que passasse da janela some atrás dela
  const agulha = (id, [cx, cy, r], len, contrapeso, jan) => { const b = r * .15, p = r * .08, w = r * .21, L = r * 1.55;
    return `<g clip-path="url(#vj_${jan})"><g transform="translate(${cx},${cy})"><g id="${id}">` +
      (contrapeso ? `<rect class="contrapeso" x="${n1(-w)}" y="0" width="${n1(2 * w)}" height="${n1(L)}" rx="${n1(w * .25)}"/>` : '') +
      `<path class="needle" d="M${n1(-p)},${n1(-len + p)}A${n1(p)},${n1(p)} 0 0 1 ${n1(p)},${n1(-len + p)}L${n1(b)},0L${n1(-b)},0Z"/></g></g></g>`; };
  // cubo como na foto 24: cúpula cinza-escura, mais clara no alto à esquerda e escurecendo para a borda, com sombra no mostrador
  const cubo = ([x, y, r]) => `<circle class="cubo" cx="${x}" cy="${y}" r="${n1(r)}" stroke-width="${n1(r * .05)}" filter="url(#vCuboSombra)"/>`;
  // pino de zerar o parcial (foto 25): base redonda em relevo na placa, da cor dela, com um anel por dentro e o botão preto no meio,
  // visto de frente
  const pino = ([x, y, r], id) => `<g${id ? ` id="${id}" tabindex="0" role="button" aria-label="Zerar hodômetro parcial"` : ''}><circle class="pinoBase" cx="${x}" cy="${y}" r="${r}" stroke-width="${n1(r * .035)}" filter="url(#vRelevo)"/>` +
    `<circle class="pinoAnel" cx="${x}" cy="${y}" r="${n1(r * .66)}" stroke-width="${n1(r * .04)}"/>` +
    `<circle cx="${x}" cy="${y}" r="${n1(r * .42)}" fill="url(#vPino)"/><circle cx="${n1(x - r * .14)}" cy="${n1(y - r * .16)}" r="${n1(r * .12)}" fill="#6b6f74" opacity=".7"/></g>`;

  const DEFS = `<defs>
    <linearGradient id="vPlaca" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4c6c9"/><stop offset=".45" stop-color="#a6a9ac"/><stop offset="1" stop-color="#8c8f93"/></linearGradient>
    <linearGradient id="vFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#303236"/><stop offset="1" stop-color="#2a2c2f"/></linearGradient>
    <radialGradient id="vCubo" cx=".42" cy=".38" r=".66" fx=".38" fy=".32"><stop offset="0" stop-color="#75787c"/><stop offset=".5" stop-color="#4b4e52"/><stop offset=".88" stop-color="#2d2f32"/><stop offset="1" stop-color="#1e1f21"/></radialGradient>
    <filter id="vCuboSombra" x="-40%" y="-40%" width="190%" height="190%"><feDropShadow dx="1.4" dy="2.2" stdDeviation="2" flood-color="#000" flood-opacity=".65"/></filter>
    <radialGradient id="vPino" cx=".4" cy=".35"><stop offset="0" stop-color="#3b3d41"/><stop offset="1" stop-color="#121315"/></radialGradient>
    <linearGradient id="vPinoBase" x1=".15" y1=".1" x2=".85" y2=".9"><stop offset="0" stop-color="#d3d5d7"/><stop offset=".55" stop-color="#a9acaf"/><stop offset="1" stop-color="#8a8d91"/></linearGradient>
    <filter id="vRelevo" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="1" dy="1.8" stdDeviation="1.4" flood-color="#000" flood-opacity=".5"/></filter>
    ${['tach', 'spd', 'tf'].map(k => `<clipPath id="vj_${k}"><path d="${F[k]}"/></clipPath>`).join('')}
    ${[['vSombra', 4, 3, 2.2, 1.2, false], ['vFundoP', 2.6, 2, 1.6, .8, true]].map(([id, dy, sd, dl, sl, fonte]) => `<filter id="${id}" x="-20%" y="-60%" width="140%" height="220%" color-interpolation-filters="sRGB">
      <feComponentTransfer in="SourceAlpha" result="fora"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>
      <feOffset in="fora" dy="${dy}"/><feGaussianBlur stdDeviation="${sd}" result="sb"/>
      <feFlood flood-color="#000" flood-opacity=".75"/><feComposite in2="sb" operator="in"/><feComposite in2="SourceAlpha" operator="in" result="sombra"/>
      <feOffset in="fora" dy="${-dl}"/><feGaussianBlur stdDeviation="${sl}" result="lb"/>
      <feFlood flood-color="#dfe1e3" flood-opacity=".32"/><feComposite in2="lb" operator="in"/><feComposite in2="SourceAlpha" operator="in" result="labio"/>
      <feMerge>${fonte ? '<feMergeNode in="SourceGraphic"/>' : ''}<feMergeNode in="sombra"/><feMergeNode in="labio"/></feMerge></filter>`).join('')}
  </defs>`;

  // placa prateada; janelas, barras, visor, setas e pinos rebaixados nela (sombra da borda de cima, lábio claro na de baixo),
  // sem contorno desenhado em volta
  const placa = () => `<path class="placa" d="${F.placa}"/>` +
    ['tach', 'spd', 'tf'].map(k => `<path class="face" d="${F[k]}"/>`).join('') +
    ['meio', 'b1', 'b2', 'b3', 'velmax', 'direita'].map(k => `<path class="barra" d="${F[k]}" filter="url(#vFundoP)"/>`).join('') +
    `<path class="barra" d="${F.lcdFora}" filter="url(#vFundoP)"/><path class="lcd" d="${F.lcd}" filter="url(#vFundoP)"/>` + lampada('seta', seta(-1) + seta(1)) +
    pino(M.pinos[0], 'knob') + pino(M.pinos[1]) +
    // a sombra da borda de cima e o lábio de baixo das janelas dos mostradores vão por cima da escala: ela está no fundo do rebaixo
    marcas() + ['tach', 'spd', 'tf'].map(k => `<path class="sombra" d="${F[k]}" filter="url(#vSombra)"/>`).join('') + LUZES.map(luz).join('') + velmax() +
    `<g id="visor"></g>` +
    [['nRpm', 'tach', 'tach'], ['nVel', 'spd', 'spd'], ['nTemp', 'temp', 'tf'], ['nComb', 'fuel', 'tf']].map(([id, k, jan]) => agulha(id, E[k].cubo, E[k].agulha, E[k].contrapeso, jan)).join('') +
    ['tach', 'spd', 'temp', 'fuel'].map(k => cubo(E[k].cubo)).join('');
  // origem da placa (para `place`): o meio dela
  const [ox0, oy0, ox1, oy1] = M.placa, ORIGEM = [(ox0 + ox1) / 2, (oy0 + oy1) / 2], TAMANHO = [ox1 - ox0, oy1 - oy0];

  const CONTROLS = `<div>
    <label>RPM <input id="rpm" type="range" min="0" max="7000" step="50" value="0"><output id="rpmO"></output></label>
    <div class="vel"><label>Velocidade <input id="vel" type="range" min="0" max="260" step="1" value="0"><output id="velO"></output></label>
      <label><input id="semLimite" type="checkbox"> Desbloquear limite de velocidade</label></div>
    <label>Combustível <input id="comb" type="range" min="0" max="${TANQUE}" value="0"><output id="combO"></output></label>
    <label>Temperatura <input id="temp" type="range" min="50" max="130" value="50"><output id="tempO"></output></label>
    <label>Tempo <select id="mult"><option value="1" selected>1× (real)</option><option value="20">20×</option><option value="200">200×</option></select></label>
    <button id="reset">Zerar parcial</button>
  </div>
  <div id="luzes"><button id="luz" aria-pressed="false">💡 Iluminação</button><button id="todas">Todas as luzes</button></div>`;

  // Vectra Challenge 2.2 16V para o teclado e o controle. Potência, torque, peso, pneus, tanque, entre-eixos e aerodinâmica (Cx x área)
  // são da ficha técnica; as relações do câmbio (F17) e do diferencial não achei em fonte confiável e são as que se costuma citar.
  // Distribuição de peso, altura do centro de gravidade, divisão dos freios e esterço são valores típicos de um sedã médio de tração
  // dianteira, não medidos neste carro. Na ignição, como no manual: bateria, óleo e injeção até o motor pegar; ABS, controle de tração,
  // airbag e reserva acendem para teste
  const VEICULO = { cv: 138, rpmCv: 5400, kgfm: 20.7, rpmKgfm: 4000, rpmMax: 6500, lenta: 850, marchas: [3.58, 2.02, 1.35, .98, .81], re: 3.31, final: 3.94,
    pneu: [205, 55, 16], kg: 1345, cxA: .574, inercia: .17, tanque: TANQUE,
    entreEixos: 2.64, frente: .62, hcg: .53, tracao: 'D', freioDiant: .8, esterco: .58,
    chave: { ateLigar: ['bat', 'oleo', 'inj'], teste: ['abs', 'tc', 'airbag', 'bomba'] } };

  /**
   * Desenha o painel dentro de `target` (um <g> do SVG) e liga os controles em #ctl.
   * place: [x, y, escala] = onde fica o meio da placa (padrão: as unidades do painel)
   */
  function build({ target, place }) {
    const root = target.ownerSVGElement, [x, y, s] = place || [...ORIGEM, 1];
    root.insertAdjacentHTML('afterbegin', DEFS);
    target.innerHTML = `<g transform="translate(${x},${y}) scale(${s}) translate(${-ORIGEM[0]},${-ORIGEM[1]})">${placa()}</g>`;

    // ---- controles ----
    $('ctl').innerHTML = CONTROLS;
    const lightBtns = Object.entries(LAMPS).filter(([id]) => $('i_' + id)).map(([id, [label, c]]) => {
      const b = document.createElement('button');
      b.textContent = label; b.dataset.luz = id; b.style.setProperty('--c', c); b.setAttribute('aria-pressed', false);
      b.set = on => b.setAttribute('aria-pressed', $('i_' + id).classList.toggle('on', on));
      b.onclick = () => b.set();
      $('todas').before(b);
      return b;
    });
    $('todas').onclick = () => { const on = lightBtns.some(b => b.getAttribute('aria-pressed') === 'false'); lightBtns.forEach(b => b.set(on)); };
    $('luz').onclick = () => { const on = root.classList.toggle('lit'); document.body.classList.toggle('lit', on); $('luz').setAttribute('aria-pressed', on); };

    const rot = (id, a) => $(id).style.transform = `rotate(${a}deg)`;
    let reserva = null; // a luz da reserva acompanha o nível só quando ele entra ou sai da reserva; entre uma coisa e outra, o botão manda
    const upd = () => {
      rot('nRpm', rpmA(+$('rpm').value)); rot('nVel', velA(+$('vel').value));
      rot('nComb', combA($('comb').value / TANQUE)); rot('nTemp', tempA(+$('temp').value));
      const baixo = +$('comb').value <= RESERVA;
      if (baixo !== reserva) { reserva = baixo; document.querySelector('[data-luz="bomba"]').set(baixo); }
      $('rpmO').textContent = $('rpm').value + ' rpm'; $('velO').textContent = $('vel').value + ' km/h';
      $('combO').textContent = $('comb').value + ' L'; $('tempO').textContent = $('temp').value + ' °C';
    };
    for (const id of ['rpm', 'vel', 'comb', 'temp']) $(id).oninput = upd;
    $('semLimite').onchange = () => { $('vel').max = $('semLimite').checked ? 500 : 260; upd(); }; // ao desmarcar, o navegador traz a velocidade de volta ao limite
    upd();

    let odo = 0, trip = 0, last = performance.now(), mostrado = '';
    const resetTrip = () => trip = 0;
    $('reset').onclick = $('knob').onclick = resetTrip;
    $('knob').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') resetTrip(); };
    (function frame(now) {
      const dt = Math.min(now - last, 250) / 1000; last = now; // limite: aba em segundo plano não dá salto
      const d = $('vel').value * dt / 3600 * $('mult').value;
      odo = (odo + d) % 1e6; trip = (trip + d) % 1e4;
      const agora = Math.floor(trip * 10) + '|' + Math.floor(odo); // o visor só é redesenhado quando muda o que ele mostra
      if (agora !== mostrado) { mostrado = agora; $('visor').innerHTML = visor(Math.floor(trip * 10) / 10, odo); }
      requestAnimationFrame(frame);
    })(last);
    if (typeof Controle !== 'undefined') Controle.ligar(VEICULO); // teclado e controle, se o controle.js estiver junto
  }

  return { build, ORIGEM, TAMANHO };
})();
