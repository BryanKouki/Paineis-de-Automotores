// Painel Corsa azul com conta-giros: desenho e lógica compartilhados pelos três painéis.
// As medidas dos mostradores são pixels da foto de referência; cada painel reposiciona tudo com `place` e `slots`.
// Precisa de icones.js (símbolos decalcados) carregado antes.
const Corsa = (() => {
  const $ = id => document.getElementById(id), RAD = Math.PI / 180;
  const P = (cx, cy, r, a) => [(cx + r * Math.sin(a * RAD)).toFixed(1), (cy - r * Math.cos(a * RAD)).toFixed(1)];

  // Ângulos em graus, 0 = para cima, horário positivo.
  const TACH = { cx: 415, cy: 261, r: 178, bevel: 13, holes: [[357.5, 260], [476, 262]] };
  const SPD  = { cx: 811, cy: 268, r: 174, bevel: 13, holes: [[742.5, 270], [874.6, 272]] };
  // px,py = eixo do ponteiro (abaixo do centro do mostrador); a escala é concêntrica ao eixo
  const FUEL = { cx: 144, cy: 390.5, r: 93, bevel: 16, px: 138.5, py: 431 };
  const TEMP = { cx: 1069, cy: 414, r: 91.5, bevel: 16, px: 1061, py: 456 };
  const G = { tach: TACH, spd: SPD, fuel: FUEL, temp: TEMP };
  const rpmAngle = rpm => -130 + rpm / 1000 * 37.3;
  // a escala começa em 20 e o ponteiro descansa num batente logo abaixo dela
  const velAngle = v => Math.max(-136.5, -135 + (v - 20) * 1.352);
  const fuelAngle = l => -45 + l * 2.25;                                  // 0 L na marca vermelha, 20 L no topo
  const tempAngle = t => Math.min(50, Math.max(-51, -23 + (t - 90) * 4.2)); // frio = batente antes do 1º traço
  const RESERVA = 5; // litros: até aqui o ponteiro está na faixa vermelha

  const tick = (cx, cy, a, r1, r2, w, cls = '') => {
    const [x1, y1] = P(cx, cy, r1, a), [x2, y2] = P(cx, cy, r2, a);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"${cls && ` class="${cls}"`}/>`;
  };
  const arc = (cx, cy, r, a1, a2, w) => { const [x1, y1] = P(cx, cy, r, a1), [x2, y2] = P(cx, cy, r, a2); return `<path class="red" stroke-width="${w}" d="M${x1},${y1}A${r},${r} 0 0 1 ${x2},${y2}"/>`; };
  const text = (x, y, txt, cls = '') => `<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}"${cls && ` class="${cls}"`}>${txt}</text>`;
  // traços grandes vão até a borda; os pequenos ficam recuados
  const TICK_IN = .845; // onde começa o traço grande, em fração do raio
  const bigTick = (g, a, major, cls) => major ? tick(g.cx, g.cy, a, g.r * TICK_IN, g.r * .985, g.r * .028, cls) : tick(g.cx, g.cy, a, g.r * .875, g.r * .965, g.r * .018, cls);
  const sTick = (g, a, major) => major ? tick(g.px, g.py, a, 82, 102, 6) : tick(g.px, g.py, a, 88, 101, 3.6);
  // ponteiro: haste fina, "meia-lua" de cada lado no eixo e um toco atrás; k = escala do miolo
  const needle = (id, cx, cy, len, k) => {
    const n = v => (v * k).toFixed(1);
    return `<g transform="translate(${cx},${cy})"><path id="${id}" class="needle" d="M${n(-1.2)},${-len}L${n(1.2)},${-len}L${n(4)},${n(-15)}Q${n(13.4)},0 ${n(4.3)},${n(15)}L${n(3.8)},${n(32.5)}Q0,${n(35.5)} ${n(-3.8)},${n(32.5)}L${n(-4.3)},${n(15)}Q${n(-13.4)},0 ${n(-4)},${n(-15)}Z"/></g>`;
  };

  // ---- luzes-espia: id -> [rótulo, cor, símbolo] ----
  // T = símbolo decalcado da imagem de referência (icones.js); os outros são desenhados
  const T = k => `<path class="tr" fill-rule="evenodd" d="${ICONES[k]}"/>`;
  // cores como aparecem na foto do painel aceso: setas em verde-água, ABS mais laranja que a injeção
  const R = '#ff3b30', A = '#ffb23a', GR = '#4fd69a';
  // id -> [rótulo, cor, símbolo, fator de tamanho opcional]
  const LAMPS = {
    alto: ['Farol alto', '#2f96ff', '<path class="nf" d="M3-8.5a9 9 0 0 1 0 17z"/><path class="nf" d="M-2-8h-10M-2-4h-10M-2 0h-10M-2 4h-10M-2 8h-10"/>'],
    nebl: ['Neblina', A, T('neblina')],
    seta: ['Setas', '#33e6c8', '<path class="nf" d="M-3-3.5h-6v-4l-8 7.5 8 7.5v-4h6zM3-3.5h6v-4l8 7.5-8 7.5v-4h-6z"/>', .8],
    freio: ['Freio de mão', R, T('freio')],
    bat: ['Bateria', R, T('bateria')],
    inj: ['Injeção', '#ffc02e', T('motor')],
    oleo: ['Óleo', R, T('oleo')],
    eng: ['Engate', GR, '<path class="nf" d="M-5-7h15v10h-15zM-5 0h-8v3"/><circle class="nf" cx="3" cy="5" r="2.5"/>'],
    abs: ['ABS', '#ff8f33', T('abs')],
    cinto: ['Cinto', R, T('cinto')],
    airbag: ['Airbag', R, T('airbag')],
    eletr: ['Eletrônica', A, '<circle class="nf" r="7.5"/><circle class="nf" r="10.4" stroke-width="2.6" stroke-dasharray="2.72 2.725"/><path d="M1.5-5.5l-4.5 6h3l-1.5 5 4.5-6.5h-3z"/>', .78],
  };
  const lamp = (id, bg, x, y, k, off, cls = '') =>
    `<g id="i_${id}" class="lamp${id === 'seta' ? ' blink' : ''}${cls}" style="--c:${LAMPS[id][1]}${off ? `;--off:${off}` : ''}">${bg}` +
    `<g class="sym" transform="translate(${(+x).toFixed(1)},${(+y).toFixed(1)}) scale(${(k * (LAMPS[id][3] || 1)).toFixed(3)})">${LAMPS[id][2]}</g></g>`;
  // fendas das espias: [cx, cy, largura, altura, luzes, cor da fenda]
  // cada luz = [id, início, fim] em fração da largura da fenda, medidos na foto do painel aceso: as janelas têm um vão escuro entre elas.
  // 'simb' = quem acende é o símbolo (sem janela). Também aceita só os ids: ['a'] ou ['a', 'b'].
  const SLOTS = [[620, 89.5, 164, 35, [['eletr', 0, .2, 'simb'], ['alto', .32, .63], ['nebl', .685, 1]], '#454c55'], [618.5, 135.5, 83, 33, [['seta', 0, 1]], '#454c55'],
    [149, 256, 119, 35, [['freio', 0, .46], ['bat', .54, 1]]], [1071, 279, 117, 33, [['oleo', 0, .46], ['eng', .54, 1]]], [310.5, 466, 82, 29, [['inj', 0, 1]]], [902.5, 478, 78, 27, [['abs', 0, 1]]]];
  const slot = ([cx, cy, w, h, ids, off = '#1a1c20']) => {
    const x = cx - w / 2, y = cy - h / 2, m = 2.5, r = h / 2 - m, t = y + m, bt = y + h - m;
    const wins = typeof ids[0] !== 'string' ? ids : ids.length === 1 ? [[ids[0], 0, 1]] : [[ids[0], 0, .46], [ids[1], .54, 1]];
    return `<rect class="slot" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${off}"/>` + wins.map(([id, f0, f1, simb]) => {
      const a = x + Math.max(f0 * w, m), b = x + Math.min(f1 * w, w - m), a1 = f0 ? a : a + r, b1 = f1 < 1 ? b : b - r;
      // ponta arredondada só onde a janela encosta na ponta da fenda
      const d = `M${a1},${t}H${b1}${f1 < 1 ? `V${bt}` : `A${r},${r} 0 0 1 ${b1},${bt}`}H${a1}${f0 ? '' : `A${r},${r} 0 0 1 ${a1},${t}`}Z`;
      // símbolo com cerca de 70% da altura da fenda, como na foto
      return lamp(id, simb ? '' : `<path class="bg" d="${d}"/>`, (a + b) / 2, cy, h / 26, null, simb ? ' simb' : '');
    }).join('');
  };

  // ---- hodômetro de tambores ----
  function drum(id, cx, cy, n, W, H, tenth) {
    let s = `<g id="${id}" data-h="${H}"><rect class="dwin" x="${cx - n * W / 2 - 2}" y="${cy - H / 2 - 1.5}" width="${n * W + 4}" height="${H + 3}" rx="2"/>`;
    for (let i = 0; i < n; i++) {
      // <svg> aninhado recorta o tambor na janela
      s += `<svg x="${cx - n * W / 2 + i * W}" y="${cy - H / 2}" width="${W}" height="${H}"${tenth && i === n - 1 ? ' class="tenth"' : ''}>${tenth && i === n - 1 ? `<rect x="2" width="${W - 4}" height="${H}"/>` : ''}<g class="strip">`;
      // próximo algarismo fica acima: o tambor gira para baixo
      for (let k = 0; k <= 10; k++) s += `<text x="${W / 2}" y="${H / 2 + 6.8 - k * H}">${k % 10}</text>`;
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
  console.assert(drumPos(9.5, 0) === 9.5 && drumPos(9.5, 1) === 0.5 && drumPos(199.5, 2) === 1.5 && drumPos(123, 1) === 2 && drumPos(123, 2) === 1, 'drumPos');
  function setDrum(id, value) {
    const strips = $(id).querySelectorAll('.strip'), n = strips.length, H = $(id).dataset.h;
    strips.forEach((s, j) => s.setAttribute('transform', `translate(0,${(drumPos(value, n - 1 - j) * H).toFixed(2)})`));
  }

  // ---- conteúdo de cada mostrador (em coordenadas da foto) ----
  function marks() {
    // conta-giros: faixa vermelha de 6 a 7, cortada no 6,5, e o traço do 7 vermelho
    let tach = arc(TACH.cx, TACH.cy, TACH.r * .945, rpmAngle(6000) + 1.5, rpmAngle(7000) - .5, TACH.r * .085) + tick(TACH.cx, TACH.cy, rpmAngle(6500), TACH.r * .89, TACH.r, 3, 'gap');
    for (let v = 0; v <= 7; v += .5) if (v !== 6.5) tach += bigTick(TACH, rpmAngle(v * 1000), v % 1 === 0, v === 7 ? 'red' : '');
    // Números: cada um fica na direção do seu traço, no raio rMax, e recua o que for preciso para não encostar no traço.
    // (Copiar a posição da foto fazia os da direita entrarem nos traços: a fonte real é mais estreita que a Arial.)
    const DIG = 26.5 * .556, CAP = 19; // largura de um algarismo e altura dos números na fonte dos mostradores
    const num = (g, a, txt, rMax) => {
      const s = Math.abs(Math.sin(a * RAD)), c = Math.abs(Math.cos(a * RAD)), w = String(txt).length * DIG + 3; // +3 = inclinação do itálico
      return text(...P(g.cx, g.cy, Math.min(g.r * rMax, g.r * TICK_IN - 4 - (s * w + c * CAP) / 2), a), txt);
    };
    for (let v = 0; v <= 7; v++) tach += num(TACH, rpmAngle(v * 1000), v, .765);
    tach += text(418, 305.5, 'x 1000', 's') + text(418, 319, 'min⁻¹', 's');

    // velocímetro: os números de 3 algarismos do lado direito acabam mais para dentro, como no painel
    let spd = '';
    for (let v = 20; v <= 220; v += 10) spd += bigTick(SPD, velAngle(v), v % 20 === 0);
    for (let v = 20; v <= 220; v += 20) spd += num(SPD, velAngle(v), v, .735);
    spd += text(SPD.cx, 198.5, 'km', 's') + text(SPD.cx, 350.5, 'km/h', 's') + text(SPD.cx, 363.5, 'W=1134', 'xs');

    const fuel = arc(FUEL.px, FUEL.py, 91.5, fuelAngle(0) - 6, fuelAngle(0) + 6, 23) + [10, 20, 30, 40].map(l => sTick(FUEL, fuelAngle(l), l % 20 === 0)).join('') +
      text(143, 363, 20, 'm') + text(193, 377.5, 40, 'm') + text(220, 416, 'L', 'm') +
      `<g id="pump" transform="translate(80,413) scale(1.2)"><path class="icf" fill-rule="evenodd" d="M-7-8h10v16h-10zM-5-6v5h6v-5z"/><path class="ic" d="M3-3h2.5q2 0 2 2v6"/></g>`;
    const temp = [85, 90, 95, 100, 105].map(t => sTick(TEMP, tempAngle(t), t % 10 === 0)).join('') + arc(TEMP.px, TEMP.py, 99, 43, 50.5, 20) +
      text(1033.7, 393.1, 90, 'm') + text(1088.5, 389.5, 100, 'm') + text(995.6, 434.4, '°C', 'm') +
      `<g transform="translate(1130,431) scale(1.2)"><path class="ic" d="M0-10v10M0-8h4M0-4h4M-10 8q2.5-3 5 0M5 8q2.5-3 5 0M-8 4h16"/><circle class="icf" cy="3" r="3"/></g>`;
    return { tach, spd, fuel, temp };
  }
  const OVER = {
    fuel: needle('nFuel', FUEL.px, FUEL.py, 90, 1),
    temp: needle('nTemp', TEMP.px, TEMP.py, 87, 1),
    tach: needle('nRpm', TACH.cx, TACH.cy, TACH.r * .97, 1.4),
    // pino de zerar o parcial, visto de frente, na parte de baixo do velocímetro
    spd: `<g class="drum">${drum('odo', SPD.cx, 220, 6, 27.7, 23)}${drum('trip', SPD.cx, 317.5, 4, 31.75, 25, true)}</g>` + needle('nVel', SPD.cx, SPD.cy, SPD.r * .97, 1.4) +
      `<g id="knob" tabindex="0" role="button" aria-label="Zerar hodômetro parcial"><circle cx="811" cy="413" r="12" fill="#05070a"/><circle cx="811" cy="413" r="8" fill="#12161a"/><circle cx="808.5" cy="410.5" r="2.5" fill="#39414a"/></g>`,
  };
  // as duas janelas do conta-giros existem mesmo apagadas: cinto e airbag acendem dentro delas.
  // Cada uma é um trapézio curvo (setor de anel) de 14° a 33° para cada lado do ponto de baixo, medido na foto.
  const sector = (a1, a2) => {
    const r1 = TACH.r * .745, r2 = TACH.r * .945, p = (r, a) => P(TACH.cx, TACH.cy, r, a).join(',');
    return `<path class="bg" stroke="#16223a" stroke-width="2" stroke-linejoin="round" d="M${p(r2, a1)}A${r2},${r2} 0 0 1 ${p(r2, a2)}L${p(r1, a2)}A${r1},${r1} 0 0 0 ${p(r1, a1)}Z"/>`;
  };
  const UNDER = {
    tach: lamp('cinto', sector(194, 213), ...P(TACH.cx, TACH.cy, TACH.r * .845, 203.5), 1, '#1e2030') +
      lamp('airbag', sector(147, 166), ...P(TACH.cx, TACH.cy, TACH.r * .845, 156.5), 1.2, '#22304a'),
  };

  const DEFS = `<defs>
    <radialGradient id="face"><stop offset="0" stop-color="#37598c"/><stop offset=".8" stop-color="#29456f"/><stop offset="1" stop-color="#1a2c48"/></radialGradient>
    <radialGradient id="faceLit"><stop offset="0" stop-color="#15294f"/><stop offset="1" stop-color="#060e20"/></radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".2" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6873"/><stop offset=".7" stop-color="#66717c"/><stop offset="1" stop-color="#4c545d"/></linearGradient>
    <linearGradient id="ring" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#242a31"/><stop offset=".55" stop-color="#4a5560"/><stop offset="1" stop-color="#93a0ad"/></linearGradient>
  </defs>`;

  const CONTROLS = `<div>
    <label>RPM <input id="rpm" type="range" min="0" max="7000" step="50" value="0"><output id="rpmO"></output></label>
    <label>Velocidade <input id="vel" type="range" min="0" max="220" step="1" value="0"><output id="velO"></output></label>
    <label>Combustível <input id="comb" type="range" min="0" max="46" value="0"><output id="combO"></output></label>
    <label>Temperatura <input id="temp" type="range" min="50" max="110" value="50"><output id="tempO"></output></label>
    <label>Tempo <select id="mult"><option value="1">1× (real)</option><option value="20" selected>20×</option><option value="200">200×</option></select></label>
    <button id="reset">Zerar parcial</button>
  </div>
  <div id="luzes"><button id="luz" aria-pressed="false">💡 Iluminação</button><button id="todas">Todas as luzes</button></div>`;

  /**
   * Desenha o painel dentro de `target` (um <g> do SVG) e liga os controles em #ctl.
   * place: { tach|spd|fuel|temp: [x, y, escala] } = onde fica o centro de cada mostrador (padrão: posição da foto)
   * slots: janelas das espias no formato de SLOTS (padrão: posição da foto)
   * ring:  fator da largura do aro em volta dos mostradores (1 = como na carcaça)
   */
  function build({ target, place = {}, slots = SLOTS, ring = 1 }) {
    const root = target.ownerSVGElement, m = marks();
    root.insertAdjacentHTML('afterbegin', DEFS);
    const gauge = name => {
      const g = G[name], [x, y, s] = place[name] || [g.cx, g.cy, 1];
      const holes = (g.holes || []).map(([hx, hy]) => `<circle class="hole" cx="${hx}" cy="${hy}" r="4.5"/>`).join('');
      return `<g transform="translate(${x},${y}) scale(${s}) translate(${-g.cx},${-g.cy})">` +
        `<circle class="housing" cx="${g.cx}" cy="${g.cy}" r="${g.r + g.bevel * ring}" fill="url(#ring)"/><circle class="face" cx="${g.cx}" cy="${g.cy}" r="${g.r}"/>` +
        `${holes}${UNDER[name] || ''}<circle class="shade" cx="${g.cx}" cy="${g.cy}" r="${g.r}"/><g class="marks">${m[name]}</g>${OVER[name]}</g>`;
    };
    target.innerHTML = slots.map(slot).join('') + ['fuel', 'temp', 'tach', 'spd'].map(gauge).join('');

    // ---- controles ----
    $('ctl').innerHTML = CONTROLS;
    const lightBtns = Object.entries(LAMPS).filter(([id]) => $('i_' + id)).map(([id, [label, c]]) => {
      const b = document.createElement('button');
      b.textContent = label; b.style.setProperty('--c', c); b.setAttribute('aria-pressed', false);
      b.set = on => b.setAttribute('aria-pressed', $('i_' + id).classList.toggle('on', on));
      b.onclick = () => b.set();
      $('todas').before(b);
      return b;
    });
    $('todas').onclick = () => { const on = lightBtns.some(b => b.getAttribute('aria-pressed') === 'false'); lightBtns.forEach(b => b.set(on)); };
    $('luz').onclick = () => { const on = root.classList.toggle('lit'); document.body.classList.toggle('lit', on); $('luz').setAttribute('aria-pressed', on); };

    const rot = (id, a) => $(id).style.transform = `rotate(${a}deg)`;
    const upd = () => {
      rot('nRpm', rpmAngle(+$('rpm').value)); rot('nVel', velAngle(+$('vel').value));
      rot('nFuel', fuelAngle(+$('comb').value)); rot('nTemp', tempAngle(+$('temp').value));
      $('pump').classList.toggle('low', +$('comb').value <= RESERVA);
      $('rpmO').textContent = $('rpm').value + ' rpm'; $('velO').textContent = $('vel').value + ' km/h';
      $('combO').textContent = $('comb').value + ' L'; $('tempO').textContent = $('temp').value + ' °C';
    };
    for (const id of ['rpm', 'vel', 'comb', 'temp']) $(id).oninput = upd;
    upd();

    let odo = 0, trip = 0, last = performance.now();
    const resetTrip = () => trip = 0;
    $('reset').onclick = $('knob').onclick = resetTrip;
    $('knob').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') resetTrip(); };
    (function frame(now) {
      const dt = Math.min(now - last, 250) / 1000; last = now; // limite: aba em segundo plano não dá salto
      const d = $('vel').value * dt / 3600 * $('mult').value;
      odo = (odo + d) % 1e6; trip = (trip + d) % 1000;
      setDrum('odo', odo); setDrum('trip', trip * 10);
      requestAnimationFrame(frame);
    })(last);
  }

  return { build, SLOTS, G };
})();
