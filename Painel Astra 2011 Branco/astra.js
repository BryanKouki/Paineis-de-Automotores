// Painel Astra 2011 (mostradores brancos): desenho e lógica compartilhados pelos três painéis.
// Cada peça é desenhada em volta do próprio centro (0,0); `place` diz onde cada uma fica: [x, y, escala].
// Escalas, números, segmento escuro e posição dos símbolos medidos no acetato do painel (1 px do acetato = 0,824 unidade).
// Precisa de icones.js (símbolos decalcados) carregado antes.
const Astra = (() => {
  const $ = id => document.getElementById(id), RAD = Math.PI / 180;
  const pol = (r, a) => [r * Math.sin(a * RAD), -r * Math.cos(a * RAD)];
  const RB = 140, FB = 123.6;        // mostradores grandes: raio do aro cromado e do mostrador visível
  const RS = 67, FS = 52.3, PY = 27; // pequenos: idem; PY = eixo do ponteiro abaixo do centro
  // Ângulos em graus, 0 = para cima, horário positivo.
  const rpmAngle = rpm => -122.2 + rpm / 7000 * 244.4;
  // o velocímetro não é linear: abre mais até 40 e fecha depois de 140 (pontos medidos no acetato)
  const VEL = [[0, -121.8], [40, -72.6], [140, 39.1], [220, 114.3], [230, 123.7]];
  const velAngle = v => { const i = Math.max(1, VEL.findIndex(([k]) => k >= v)), [v0, a0] = VEL[i - 1], [v1, a1] = VEL[i]; return a0 + (v - v0) * (a1 - a0) / (v1 - v0); };
  console.assert([[0, -121.8], [100, -5.58], [220, 114.3]].every(([v, a]) => Math.abs(velAngle(v) - a) < .01), 'velAngle');
  const smallAngle = f => -44.5 + Math.min(1, Math.max(0, f)) * 89.5;
  const TANQUE = 52, RESERVA = 7;    // litros; até RESERVA a luz da bomba acende
  // luz de troca de marcha: giro alto com o carro ainda devagar
  const MARCHA_RPM = 3000, MARCHA_VEL = 60;
  const AUTO = ['reserva', 'marcha', 'velmax']; // luzes sem botão de liga/desliga comum

  // traço radial; off = deslocamento lateral (para os traços duplos, que são paralelos)
  const tick = (r1, r2, a, w, cls = '', off = 0) => {
    const [x1, y1] = pol(r1, a), [x2, y2] = pol(r2, a), ox = off * Math.cos(a * RAD), oy = off * Math.sin(a * RAD);
    return `<line x1="${(x1 + ox).toFixed(1)}" y1="${(y1 + oy).toFixed(1)}" x2="${(x2 + ox).toFixed(1)}" y2="${(y2 + oy).toFixed(1)}" stroke-width="${w}"${cls && ` class="${cls}"`}/>`;
  };
  const text = (x, y, txt, cls = '') => `<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}"${cls && ` class="${cls}"`}>${txt}</text>`;
  // traços dos grandes: 0 = grosso, 1 = fino comprido, 2 = fino curto; vão até a borda do mostrador
  const bigTick = (a, k, red) => tick(FB * [.877, .877, .93][k], FB * .995, a, [2.8, 1.9, 1.2][k], red ? 'red' : '');

  // ---- símbolos: decalcados da imagem de referência (T) ou desenhados conforme o acetato ----
  const T = k => `<path class="tr" fill-rule="evenodd" d="${ICONES[k]}"/>`;
  const GEAR = '<circle class="nf" r="7.5"/><circle class="nf" r="10.4" stroke-width="2.6" stroke-dasharray="2.72 2.725"/>';
  const R = '#ff3b30', A = '#ffb300', G = '#39e06a';
  // id -> [rótulo, cor, símbolo]
  const LAMPS = {
    neblina: ['Farol de neblina', G, `<g transform="scale(-1,1)">${T('neblina')}</g>`],
    alto: ['Farol alto', '#3aa0ff', '<path class="nf" d="M3-8.5a9 9 0 0 1 0 17z"/><path class="nf" d="M-2-8h-10M-2-4h-10M-2 0h-10M-2 4h-10M-2 8h-10"/>'],
    nebltras: ['Neblina traseira', A, T('neblina')],
    seta: ['Setas', G, '<path d="M-27,0l9-9v5h9v8h-9v5zM27,0l-9-9v5h-9v8h9v5z"/>'],
    tc: ['Controle de tração', A, '<path class="nf" d="M-8-10q-6 7-3 17h22q3-10-3-17M-9 7.5v2.5M-4.5 7.5v2.5M0 7.5v2.5M4.5 7.5v2.5M9 7.5v2.5"/><text y="-1.5" style="font-size:9px">TC</text>'],
    cruise: ['Piloto automático', G, '<path class="nf" d="M-8.5 8a10.5 10.5 0 1 1 17 0M0 2l-5.5-6.5"/><circle cy="2" r="2.2"/><path d="M-13.5-13l6.5 1.5-4.5 4.5z"/>'],
    cambio: ['Falha no câmbio', A, GEAR + '<text style="font-size:11px">!</text>'],
    sport: ['Modo esportivo', A, GEAR + '<text style="font-size:10px">S</text>'],
    frio: ['Partida a frio', A, '<path class="nf" d="M-11-6h22v13h-22zM4-6v-3.5h6v3.5M0-3.5v8M-3.5-1.5l7 4M-3.5 2.5l7-4"/>'],
    marcha: ['Troca de marcha', A, GEAR + '<path class="nf" stroke-width="1.2" d="M-7.5 0h15M0-7.5v15"/>'],            // acende sozinha
    imob: ['Anomalia / imobilizador', A, '<path d="M-14 3.5q0-4.5 3-5l4.5-.8 3.5-4.7h9l5 4.7 4.5 1q2.5.5 2.5 4.8h-3a3.2 3.2 0 0 0-6.4 0h-11.2a3.2 3.2 0 0 0-6.4 0z"/>'],
    bat: ['Bateria', R, T('bateria')],
    inj: ['Emissões (motor)', A, T('motor')],
    oleo: ['Óleo', R, T('oleo')],
    airbag: ['Airbag', R, T('airbag')],
    cinto: ['Cinto', R, T('cinto')],
    arref: ['Líquido de arrefecimento', R, T('temp')],
    freio: ['Freio de estacionamento', R, T('freio')],
    velmax: ['Velocidade máxima', G, '<path class="nf" stroke-dasharray="2.4 2" d="M-10 7a11 11 0 1 1 16.5-1.5"/><path class="nf" d="M-1.5 2l-5.5-6M11 0v5.5M11 8.5v.4"/><circle cx="-1.5" cy="2" r="2.2"/>'], // botão próprio
    abs: ['ABS', A, T('abs')],
    reserva: ['Reserva de combustível', A, T('bomba')],                                                                 // acende sozinha
    reboque: ['Reboque (engate)', G, '<path d="M-15 0l6.5-6.5v4h6v5h-6v4z"/><path class="nf" d="M1-6h13v8.5h-13zM1 1.5h-3.5"/><circle class="nf" cx="9" cy="5.5" r="2.4"/>'],
    catalisador: ['Catalisador', A, '<path class="nf" d="M-8 0h16v8.5h-16zM-8 4.2h-5M8 4.2h5M-5-3q-2.2-2 0-4t0-4M0-3q-2.2-2 0-4t0-4M5-3q-2.2-2 0-4t0-4"/>'],
  };
  const lamp = ([id, x, y, k]) =>
    `<g id="i_${id}" class="lamp${id === 'seta' ? ' blink' : ''}" style="--c:${LAMPS[id][1]}"><g class="sym" transform="translate(${x},${y}) scale(${k})">${LAMPS[id][2]}</g></g>`;
  const pill = (w, h) => `<rect class="jan" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8"/>`;
  // janelas das espias na moldura: forma + [luz, x, y, escala], nas posições do acetato
  const JANELAS = {
    topo: ['<path class="jan" d="M-57.3,-31.3H57.3V0L28,31.3H-28L-57.3,0Z"/>', [['neblina', -38, -15.7, .68], ['alto', 0, -15.7, .8], ['nebltras', 38, -15.7, .68], ['seta', 0, 16.5, .78]]],
    esq: [pill(83.2, 35.7), [['tc', -21, .5, .78], ['cruise', 22.7, 1.5, .78]]],
    dir: [pill(83.2, 35.7), [['cambio', -21.4, 0, .8], ['sport', 21.4, 0, .8]]],
    baixoEsq: [pill(191, 35.4), [['airbag', -77.5, 0, .82], ['cinto', -39.6, 0, .78], ['arref', -.8, 0, .74], ['freio', 37.9, 0, .78]]],
    baixoDir: [pill(191, 35.4), [['velmax', -78.7, 0, .8], ['abs', -43.3, 0, .78], ['reserva', -1.2, 0, .82], ['reboque', 36.7, 0, .8], ['catalisador', 77.9, 1, .8]]],
  };

  // ---- visor digital (7 segmentos) do hodômetro: desenha da direita para a esquerda ----
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  function lcd(str, xr, y, h) {
    const w = h * .56, t = h * .14, hh = (h - 3 * t) / 2, g = h * .03;
    const box = (x0, y0, w0, h0) => `M${x0.toFixed(1)},${y0.toFixed(1)}h${w0.toFixed(1)}v${h0.toFixed(1)}h${(-w0).toFixed(1)}z`;
    let x = xr, d = '';
    for (const ch of [...str].reverse()) {
      if (ch === '.') { d += box(x - t, y + h - t, t, t); x -= t * 2; continue; }
      const x0 = x - w, s = {
        a: box(x0 + t + g, y, w - 2 * t - 2 * g, t), g: box(x0 + t + g, y + t + hh, w - 2 * t - 2 * g, t), d: box(x0 + t + g, y + h - t, w - 2 * t - 2 * g, t),
        f: box(x0, y + t + g, t, hh - 2 * g), b: box(x - t, y + t + g, t, hh - 2 * g), e: box(x0, y + 2 * t + hh + g, t, hh - 2 * g), c: box(x - t, y + 2 * t + hh + g, t, hh - 2 * g),
      };
      for (const k of SEG[ch] || '') d += s[k];
      x -= w + h * .2;
    }
    return d;
  }
  console.assert(lcd('1', 10, 0, 10).split('M').length - 1 === 2 && lcd('8.', 10, 0, 10).split('M').length - 1 === 8, 'lcd');

  // ---- peças ----
  const needle = (id, len, tail, w) => `<path id="${id}" class="needle" d="M${-w * .3},${-len}L${w * .3},${-len}L${w},0L${w * .7},${tail}L${-w * .7},${tail}L${-w},0Z"/>`;
  function big(marks, lower, needleId) {
    const [ex, ey] = pol(FB, 127).map(v => v.toFixed(1)), tx = FB * .387, ty = (FB * .367).toFixed(1);
    // mostrador branco = círculo menos o segmento escuro de baixo (trapézio de cantos arredondados)
    return `<circle class="aro housing" r="${RB - 3.5}" stroke-width="7"/><circle class="seg" r="${FB}"/>` +
      `<path class="face" d="M-${ex},${ey}A${FB},${FB} 0 1 1 ${ex},${ey}L${(tx + 6).toFixed(1)},${(+ty + 3.4).toFixed(1)}Q${tx.toFixed(1)},${ty} ${(tx - 7).toFixed(1)},${ty}H${(7 - tx).toFixed(1)}Q${(-tx).toFixed(1)},${ty} ${(-tx - 6).toFixed(1)},${(+ty + 3.4).toFixed(1)}Z"/>` +
      `<g class="marks">${marks}</g>${lower}${needle(needleId, FB * .93, FB * .28, 3.6)}<circle class="hub" r="${(FB * .16).toFixed(1)}"/>`;
  }
  // pequenos: traço duplo nas pontas, 3 traços no meio (escala concêntrica ao eixo do ponteiro)
  const sTick = (a, w, cls) => tick(46.1, 62.2, a, w, cls);
  const dbl = (a, cls) => tick(46.1, 62.2, a, 1.7, cls, -2.9) + tick(46.1, 62.2, a, 1.7, cls, 2.9);
  const small = (marks, needleId) =>
    `<circle class="aro housing" r="${RS - 2.7}" stroke-width="5.4"/><circle class="face" r="${FS}"/><g class="marks" transform="translate(0,${PY})">${marks}</g>` +
    `<g transform="translate(0,${PY})">${needle(needleId, 58, 22, 2.6)}<circle class="hub" r="18.8"/></g>`;
  const F = (x, y) => [FB * x, FB * y];
  const PARTS = {
    // conta-giros: 0 a 70 (x100), vermelho de 65 a 70; seis espias no segmento escuro
    tach: () => {
      let m = '';
      for (let i = 0; i <= 28; i++) m += bigTick(rpmAngle(i * 250), i % 4 === 0 ? 0 : i % 2 === 0 ? 1 : 2, i >= 26);
      [[-.675, .393], [-.772, -.021], [-.595, -.443], [-.2315, -.7085], [.2315, -.7085], [.595, -.443], [.772, -.021], [.705, .36]].forEach(([x, y], i) => m += text(...F(x, y), i * 10));
      return big(m + text(0, -FB * .393, 'x100', 's') + text(0, -FB * .307, 'min⁻¹', 's'),
        [['frio', -38.3, 70, .78], ['marcha', 0, 70, .82], ['imob', 38.3, 71.5, .8], ['bat', -38.3, 101, .78], ['inj', 0, 101, .74], ['oleo', 38.3, 101, .74]].map(lamp).join(''), 'nRpm');
    },
    // velocímetro: 0 a 220 (traços até 230), marca dos 50 em vermelho, visor digital no segmento escuro
    spd: () => {
      let m = '';
      for (let v = 0; v <= 230; v += 5) m += bigTick(velAngle(v), v % 20 === 0 ? 0 : v % 10 === 0 ? 1 : 2, v === 50);
      [[-.694, .393], [-.807, .097], [-.771, -.237], [-.597, -.493], [-.371, -.67], [-.094, -.773], [.219, -.73], [.473, -.573], [.619, -.373], [.706, -.167], [.719, .08], [.706, .327]]
        .forEach(([x, y], i) => m += text(...F(x, y), i * 20, 'v'));
      return big(m + text(-4.5, -FB * .36, 'km/h', 'm') + text(-6, FB * .287, 'km', 'xs'),
        `<rect class="lcdbg" x="-41.5" y="69.7" width="83" height="45.3" rx="4"/><g transform="skewX(-5) translate(9,0)"><path id="lcdTrip" class="lcd"/><path id="lcdOdo" class="lcd"/></g>`, 'nVel');
    },
    // temperatura: traço duplo frio à esquerda, traço duplo vermelho (superaquecido) à direita
    temp: () => small(dbl(-41.3) + sTick(-22.75, 2.5) + sTick(0, 1.3) + sTick(22.75, 2.5) + dbl(41.3, 'red') +
      `<g class="icf" transform="translate(34.2,-3.9) scale(.8)">${T('temp')}</g>`, 'nTemp'),
    // combustível: traço duplo vermelho = reserva, 1/2 no meio, 1/1 = cheio
    fuel: () => small(dbl(-41.3, 'red') + sTick(-22.75, 1.6) + sTick(0, 2.9) + sTick(22.75, 1.6) + sTick(45, 2.9) + text(.6, -37.9, '1/2', 'f') + text(26.6, -26.4, '1/1', 'f') +
      `<g class="icf" transform="translate(33.4,-4.7) scale(.87)">${T('bomba')}</g>`, 'nFuel'),
    // botão de zerar o parcial, visto de frente
    pino: () => `<g id="knob" tabindex="0" role="button" aria-label="Zerar hodômetro parcial"><circle r="9" fill="#08090b" stroke="#2c2d31" stroke-width="1.5"/><circle r="5.5" fill="#15171a"/><circle cx="-2" cy="-2" r="1.8" fill="#3d4148"/></g>`,
  };
  for (const [k, [shape, lamps]] of Object.entries(JANELAS)) PARTS[k] = () => shape + lamps.map(lamp).join('');
  // disposição do painel original (posições do acetato)
  const PLACE = { topo: [600, 127.3, 1], esq: [232.7, 214.1, 1], dir: [967.3, 214.1, 1], baixoEsq: [252.9, 401, 1], baixoDir: [947.1, 401, 1],
    temp: [232.7, 309.4, 1], fuel: [967.3, 309.4, 1], tach: [442.9, 235.2, 1], spd: [757.1, 235.2, 1], pino: [898, 356, 1] };

  const DEFS = `<defs>
    <radialGradient id="face"><stop offset="0" stop-color="#f6f6f4"/><stop offset="1" stop-color="#dedfdd"/></radialGradient>
    <radialGradient id="faceLit"><stop offset="0" stop-color="#ffc79a"/><stop offset=".7" stop-color="#f4a86e"/><stop offset="1" stop-color="#e08a48"/></radialGradient>
    <radialGradient id="cubo" cx=".35" cy=".3"><stop offset="0" stop-color="#3a3b40"/><stop offset=".6" stop-color="#141416"/></radialGradient>
    <linearGradient id="cromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#b9bec4"/><stop offset=".5" stop-color="#f1f3f5"/><stop offset=".75" stop-color="#8d9299"/><stop offset="1" stop-color="#e6e8eb"/></linearGradient>
    <linearGradient id="moldura" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d3f43"/><stop offset=".45" stop-color="#5c5e63"/><stop offset="1" stop-color="#67696e"/></linearGradient>
  </defs>`;

  const CONTROLS = `<div>
    <label>RPM <input id="rpm" type="range" min="0" max="7000" step="50" value="0"><output id="rpmO"></output></label>
    <label>Velocidade <input id="vel" type="range" min="0" max="220" step="1" value="0"><output id="velO"></output></label>
    <label>Combustível <input id="comb" type="range" min="0" max="${TANQUE}" value="0"><output id="combO"></output></label>
    <label>Temperatura <input id="temp" type="range" min="50" max="130" value="50"><output id="tempO"></output></label>
    <label>Tempo <select id="mult"><option value="1">1× (real)</option><option value="20" selected>20×</option><option value="200">200×</option></select></label>
    <button id="reset">Zerar parcial</button>
  </div>
  <div id="luzes"><button id="luz" aria-pressed="false">💡 Iluminação</button><button id="todas">Todas as luzes</button></div>`;

  /**
   * Desenha o painel dentro de `target` (um <g> do SVG) e liga os controles em #ctl.
   * place: { peça: [x, y, escala] } para mudar de lugar qualquer peça de PLACE (o resto fica na posição original)
   */
  function build({ target, place = {} }) {
    const root = target.ownerSVGElement, pl = { ...PLACE, ...place };
    root.insertAdjacentHTML('afterbegin', DEFS);
    target.innerHTML = Object.entries(pl).map(([k, [x, y, s]]) => `<g transform="translate(${x},${y}) scale(${s})">${PARTS[k]()}</g>`).join('');

    // ---- controles ----
    $('ctl').innerHTML = CONTROLS;
    const lightBtns = Object.entries(LAMPS).filter(([id]) => !AUTO.includes(id)).map(([id, [label, c]]) => {
      const b = document.createElement('button');
      b.textContent = label; b.style.setProperty('--c', c); b.setAttribute('aria-pressed', false);
      b.set = on => b.setAttribute('aria-pressed', $('i_' + id).classList.toggle('on', on));
      b.onclick = () => b.set();
      $('todas').before(b);
      return b;
    });
    $('todas').onclick = () => { const on = lightBtns.some(b => b.getAttribute('aria-pressed') === 'false'); lightBtns.forEach(b => b.set(on)); };
    $('luz').onclick = () => { const on = root.classList.toggle('lit'); document.body.classList.toggle('lit', on); $('luz').setAttribute('aria-pressed', on); };

    // aviso de velocidade máxima: o botão grava a velocidade do momento; passou dela, a luz verde pisca
    let limite = null;
    const btnLim = document.createElement('button');
    btnLim.style.setProperty('--c', G);
    btnLim.onclick = () => { limite = limite == null ? +$('vel').value : null; upd(); };
    $('todas').before(btnLim);

    const rot = (id, a) => $(id).style.transform = `rotate(${a}deg)`;
    const upd = () => {
      const rpm = +$('rpm').value, vel = +$('vel').value, comb = +$('comb').value, temp = +$('temp').value;
      rot('nRpm', rpmAngle(rpm)); rot('nVel', velAngle(vel));
      rot('nFuel', smallAngle(comb / TANQUE)); rot('nTemp', smallAngle((temp - 50) / 80));
      $('i_reserva').classList.toggle('on', comb <= RESERVA); // a luz da reserva acende sozinha
      $('i_marcha').classList.toggle('on', rpm >= MARCHA_RPM && vel <= MARCHA_VEL);
      $('i_velmax').classList.toggle('on', limite != null);
      $('i_velmax').classList.toggle('blink', limite != null && vel > limite);
      btnLim.textContent = limite == null ? 'Programar velocidade máxima' : `Velocidade máxima: ${limite} km/h`;
      btnLim.setAttribute('aria-pressed', limite != null);
      $('rpmO').textContent = rpm + ' rpm'; $('velO').textContent = vel + ' km/h';
      $('combO').textContent = comb + ' L'; $('tempO').textContent = temp + ' °C';
    };
    for (const id of ['rpm', 'vel', 'comb', 'temp']) $(id).oninput = upd;
    upd();

    let odo = 0, trip = 0, last = performance.now(), shown = '';
    const resetTrip = () => trip = 0;
    $('reset').onclick = $('knob').onclick = resetTrip;
    $('knob').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') resetTrip(); };
    (function frame(now) {
      const dt = Math.min(now - last, 250) / 1000; last = now; // limite: aba em segundo plano não dá salto
      const d = $('vel').value * dt / 3600 * $('mult').value;
      odo = (odo + d) % 1e6; trip = (trip + d) % 1000;
      const t = (Math.floor(trip * 10) / 10).toFixed(1), o = String(Math.floor(odo)).padStart(6, '0');
      if (t + o !== shown) { shown = t + o; $('lcdTrip').setAttribute('d', lcd(t, 26, 74.5, 17)); $('lcdOdo').setAttribute('d', lcd(o, 26, 97, 13)); }
      requestAnimationFrame(frame);
    })(last);
  }

  return { build, PLACE };
})();
