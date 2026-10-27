// o conteúdo fixo do svg#p: gradientes, fundo e o grupo onde o painel é desenhado
document.getElementById('p').innerHTML = `  <defs>
    <radialGradient id="face"><stop offset="0" stop-color="#22262b"/><stop offset=".85" stop-color="#121417"/><stop offset="1" stop-color="#08090a"/></radialGradient>
    <linearGradient id="aro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d959d"/><stop offset=".5" stop-color="#3a4047"/><stop offset="1" stop-color="#6c747c"/></linearGradient>
    <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3baa3"/><stop offset="1" stop-color="#9aa18a"/></linearGradient>
    <linearGradient id="lcdLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lcd1)"/><stop offset="1" style="stop-color:var(--lcd2)"/></linearGradient>
    <radialGradient id="vinheta" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
    <linearGradient id="sombraTopo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".15" stop-color="#000" stop-opacity="0"/></linearGradient>
    <radialGradient id="shiftOff" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#6a1e1a"/><stop offset=".6" stop-color="#3a0d0b"/><stop offset="1" stop-color="#1c0605"/></radialGradient>
    <radialGradient id="shiftOn" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#fff2d8"/><stop offset=".25" stop-color="#ff8a5a"/><stop offset=".6" stop-color="#ff2a1a"/><stop offset="1" stop-color="#b80c06"/></radialGradient>
  </defs>
  <rect width="1280" height="480" fill="#0b0c0e"/>
  <g id="g"></g>
`;
const Q = new URLSearchParams(location.search), $ = id => document.getElementById(id), RAD = Math.PI / 180;
const f = n => (+n).toFixed(1);
const P = (cx, cy, r, a) => [cx + r * Math.sin(a * RAD), cy - r * Math.cos(a * RAD)];
const line = ([x1, y1], [x2, y2], w, cls = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke-width="${w}"${cls && ` class="${cls}"`}/>`;
const txt = ([x, y], t, cls = '', extra = '') => `<text x="${f(x)}" y="${f(y)}"${cls && ` class="${cls}"`}${extra}>${t}</text>`;
const arcD = (cx, cy, r, a1, a2) => { const [x1, y1] = P(cx, cy, r, a1), [x2, y2] = P(cx, cy, r, a2); return `M${f(x1)},${f(y1)}A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${f(x2)},${f(y2)}`; };
// ponteiro do Corsa original (corsa.js)
const needle = (id, cx, cy, len, k) => { const n = v => f(v * k);
  return `<g transform="translate(${cx},${cy})"><path id="${id}" class="needle" d="M${n(-1.2)},${-len}L${n(1.2)},${-len}L${n(4)},${n(-15)}Q${n(13.4)},0 ${n(4.3)},${n(15)}L${n(3.8)},${n(32.5)}Q0,${n(35.5)} ${n(-3.8)},${n(32.5)}L${n(-4.3)},${n(15)}Q${n(-13.4)},0 ${n(-4)},${n(-15)}Z"/></g>`; };
const mostrador = (cx, cy, r) => `<circle class="face" cx="${cx}" cy="${cy}" r="${r}"/><circle class="ring" cx="${cx}" cy="${cy}" r="${r + 3}" stroke-width="6"/>`;
const visor = (cx, cy, w, h, cls = 'dw') => `<rect class="${cls}" x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${w}" height="${h}" rx="4"/>`;
// telinha de LCD (estilo relógio Casio): moldura escura, fundo LCD, sombra nos cantos e no topo; d = contorno qualquer, senão retângulo
const VALS = {}, BARRAS = {}; let CX = null; // caixas dos valores e das barras na tela (para a Ghost)
const lcdCaixa = (x, y, w, h, d) => { CX = [x, y, w, h]; const forma = d ? `<path d="${d}"` : `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="4"`;
  return (d ? `<path d="${d}" fill="#1a1d21" stroke="#3a4047" stroke-width="8" stroke-linejoin="round"/>`
    : `<rect x="${f(x - 3)}" y="${f(y - 3)}" width="${w + 6}" height="${h + 6}" rx="7" fill="#1a1d21" stroke="#3a4047" stroke-width="1.5"/>`) +
    `${forma} class="lcdbg"/>${forma} fill="url(#vinheta)"/>${forma} fill="url(#sombraTopo)"/>`; };
// valor no LCD: algarismos escuros alinhados à direita em x, unidade pequena depois
const lcdValor = (x, y, v, un, tam = 30, k) => { if (k) VALS[k] = [CX[0] + 4, y - tam * .6, x - CX[0] - 4, tam * 1.2, tam].map(n => +n.toFixed(1));
  return `<text class="lv val"${k ? ` id="v_${k}"` : ''} x="${f(x)}" y="${f(y)}" style="font-size:${tam}px">${v}</text>` + (un ? `<text class="lu" x="${f(x + 4)}" y="${f(y + tam * .3)}">${un}</text>` : ''); };
// coroa de LEDs do concept: amarelo, laranja e vermelho no fim
const mix = t => { const c = [[245, 210, 30], [255, 140, 26], [224, 53, 43]], k = t < .6 ? 0 : 1, u = k ? (t - .6) / .4 : t / .6;
  return `rgb(${c[k].map((v, j) => Math.round(v + (c[k + 1][j] - v) * u)).join(',')})`; };
const leds = (cx, cy, r1, r2, a1, a2, n) => { let s = '';
  for (let i = 0; i < n; i++) { const a = a1 + (a2 - a1) * (i + .5) / n, w = (a2 - a1) / n * .55;
    s += `<path d="${arcD(cx, cy, (r1 + r2) / 2, a - w / 2, a + w / 2)}" stroke-width="${r2 - r1}" fill="none" stroke="${mix(i / (n - 1))}"/>`; }
  return s; };

const val = (k, d) => Q.has(k) ? +Q.get(k) : d;
const V = { rpm: val('rpm', 6100), vel: val('vel', 112), marcha: val('marcha', 5), turbo: val('turbo', 1.2), oleo: val('oleo', 5.2), comb_p: val('comb_p', 3.0),
  temp: val('temp', 93.2), tar: val('tar', 45.5), sonda: val('sonda', .85), bat: val('bat', 13.8), tps: val('tps', 85), tanque: val('tanque', 65),
  toleo: val('toleo', 98), avanco: val('avanco', 28) };
const br = (n, d = 1) => n.toFixed(d).replace('.', ','); // vírgula decimal, como na FT450
let s = '';

// ---- conta-giros: escala do original (0 a 7, -130° a 131°) com a coroa de LEDs do concept ----
const T = { cx: 432, cy: 205, r: 180 }, rpmA = v => -130 + v / 1000 * 37.3;
s += mostrador(T.cx, T.cy, T.r) + '<g class="mk">' + leds(T.cx, T.cy, T.r * .87, T.r * .97, rpmA(0), rpmA(7000), 42) +
  `<path class="red" stroke-width="5" fill="none" d="${arcD(T.cx, T.cy, T.r * .84, rpmA(6000), rpmA(7000))}"/>`;
for (let v = 0; v <= 7; v += .5) s += line(P(T.cx, T.cy, T.r * (v % 1 ? .79 : .75), rpmA(v * 1000)), P(T.cx, T.cy, T.r * .845, rpmA(v * 1000)), v % 1 ? 2.5 : 4.5, v >= 6 ? 'red' : '');
for (let v = 1; v <= 7; v++) s += txt(P(T.cx, T.cy, T.r * .63, rpmA(v * 1000)), v, v >= 6 ? 'rz' : '');
s += txt([T.cx, T.cy + 38], 'x 1000', 's') + txt([T.cx, T.cy + 51], 'min⁻¹', 's') + '</g>' +
  lcdCaixa(T.cx - 72, T.cy + 74, 150, 44) + lcdValor(T.cx + 40, T.cy + 97, V.rpm, 'RPM', 32, 'rpm');

// ---- velocímetro: escala do original (20 a 220) com visor de velocidade e hodômetros digitais ----
const S = { cx: 848, cy: 205, r: 180 }, velA = v => -135 + (v - 20) * 1.352;
s += mostrador(S.cx, S.cy, S.r) + '<g class="mk">';
for (let v = 20; v <= 220; v += 10) s += line(P(S.cx, S.cy, S.r * (v % 20 ? .87 : .83), velA(v)), P(S.cx, S.cy, S.r * .97, velA(v)), v % 20 ? 3 : 5.5);
for (let v = 20; v <= 220; v += 20) s += txt(P(S.cx, S.cy, S.r * .69, velA(v)), v, 'm', ' style="font-size:24px"');
// velocidade embaixo, na mesma altura do visor de rpm; total e parcial numa telinha só, entre o eixo e a velocidade
s += '</g>' + lcdCaixa(S.cx - 64, S.cy + 104, 128, 44) + lcdValor(S.cx + 20, S.cy + 127, V.vel, 'km/h', 28, 'vel') +
  lcdCaixa(S.cx - 60, S.cy + 22, 120, 46) + `<text class="lr" x="${S.cx - 54}" y="${S.cy + 34}">TOTAL</text><text class="lr" x="${S.cx - 54}" y="${S.cy + 57}">PARCIAL</text>` +
  lcdValor(S.cx + 54, S.cy + 34, '27917,0', '', 17, 'total') + lcdValor(S.cx + 54, S.cy + 57, '34,5', '', 17, 'parcial');

// ---- turbo: mostrador preto no meio, de -1 a 2 bar, com visor ----
const B = { cx: 640, cy: 382, r: 88 }, turA = v => -125 + (v + 1) / 3 * 250;
s += mostrador(B.cx, B.cy, B.r) + '<g class="mk">' + `<path class="red" stroke-width="6" fill="none" d="${arcD(B.cx, B.cy, B.r * .9, turA(1.5), turA(2))}"/>`;
for (let v = -1; v <= 2.0001; v += .25) { const maj = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
  s += line(P(B.cx, B.cy, B.r * (maj ? .78 : .85), turA(v)), P(B.cx, B.cy, B.r * .95, turA(v)), maj ? 3.2 : 1.8, v >= 1.5 ? 'red' : ''); }
for (const v of [-1, 0, 1, 2]) s += txt(P(B.cx, B.cy, B.r * .6, turA(v)), v, 'm');
s += txt([B.cx, B.cy - 30], 'TURBO', 's') + '</g>' + lcdCaixa(B.cx - 33, B.cy + 50, 66, 26) + lcdValor(B.cx + 10, B.cy + 63, br(V.turbo), 'bar', 18, 'turbo');

// ---- marcha, entre os dois mostradores ----
// LCD que segue o contorno: os lados são arcos concêntricos aos mostradores, por fora do aro; topo abaixo das setas, fundo acima do turbo
{ const RA = T.r + 10, y0 = 88, y1 = 178, xl = y => T.cx + Math.sqrt(RA * RA - (y - T.cy) ** 2), xr = y => S.cx - Math.sqrt(RA * RA - (y - S.cy) ** 2);
  const d = `M${f(xl(y0))},${y0}H${f(xr(y0))}A${RA},${RA} 0 0 0 ${f(xr(y1))},${y1}H${f(xl(y1))}A${RA},${RA} 0 0 0 ${f(xl(y0))},${y0}Z`;
  s += lcdCaixa(0, 0, 0, 0, d) + `<text class="lr" x="640" y="${y0 + 13}" text-anchor="middle">MARCHA</text>` +
    `<text class="lv val" id="v_marcha" x="640" y="${y0 + 56}" style="font-size:64px;text-anchor:middle">${V.marcha}</text>`; VALS.marcha = [612, y0 + 56 - 38, 56, 76, 64]; }

// ---- informações dos lados (estilo FT450), cada uma numa telinha de LCD como a de um relógio Casio, com sombra nos cantos ----
// combustível embaixo à esquerda e temperatura do motor embaixo à direita, no lugar dos mostradores pequenos do original
const LW = 168, HB = 70, HS = 50, GAP = 10; // largura; altura com barra e sem barra
function lcd(x, y, h, rot, v, un, frac) {
  let s = lcdCaixa(x, y, LW, h) + `<text class="lr" x="${x + 8}" y="${y + 11}">${rot}</text>` + lcdValor(x + LW - 30, y + 30, v, un, 30, rot);
  // barra de segmentos: os apagados aparecem de leve, como num LCD de verdade
  if (frac !== undefined) BARRAS[rot] = [x + 8, y + h - 19, LW - 16, 11];
  if (frac !== undefined) for (let i = 0; i < 20; i++)
    s += `<rect class="lseg${(i + .5) / 20 <= frac ? ' aceso' : ''}" data-barra="${rot}" x="${f(x + 8 + i * (LW - 16) / 20)}" y="${y + h - 19}" width="${f((LW - 16) / 20 - 2)}" height="11" opacity="${(i + .5) / 20 <= frac ? .9 : .1}"/>`;
  return s;
}
const XE = 18, XD = 1280 - 18 - LW, Y0 = (480 - (2 * HB + 3 * HS + 4 * GAP)) / 2, Yn = k => Y0 + k * GAP + (k ? HB : 0) + Math.max(0, k - 1) * HS;
s += lcd(XE, Yn(0), HB, 'P.ÓLEO', br(V.oleo), 'bar', V.oleo / 8) + lcd(XE, Yn(1), HS, 'SONDA', br(V.sonda, 2), 'λ') +
  lcd(XE, Yn(2), HS, 'T.AR', br(V.tar), '°C') + lcd(XE, Yn(3), HS, 'T.ÓLEO', String(V.toleo), '°C') +
  lcd(XE, Yn(4), HB, 'COMBUSTÍVEL', String(V.tanque), '%', V.tanque / 100);
s += lcd(XD, Yn(0), HB, 'P.COMB', br(V.comb_p), 'bar', V.comb_p / 6) + lcd(XD, Yn(1), HS, 'TPS', String(V.tps), '%') +
  lcd(XD, Yn(2), HS, 'BATERIA', br(V.bat), 'V') + lcd(XD, Yn(3), HS, 'AVANÇO', String(V.avanco), '°') +
  lcd(XD, Yn(4), HB, 'T.MOTOR', br(V.temp), '°C', (V.temp - 50) / 80);

// ---- espias com as janelas e os símbolos do original ----
const IC = k => `<path class="tr" fill-rule="evenodd" d="${ICONES[k]}"/>`, R = '#ff3b30', A = '#ffb23a';
const LAMPS = { alto: ['#2f96ff', '<path class="nf" d="M3-8.5a9 9 0 0 1 0 17z"/><path class="nf" d="M-2-8h-10M-2-4h-10M-2 0h-10M-2 4h-10M-2 8h-10"/>'],
  nebl: [A, IC('neblina')], setaE: ['#33e6c8', '<path class="nf" d="M7-3.5h-6v-4l-8 7.5 8 7.5v-4h6z"/>', .8], setaD: ['#33e6c8', '<path class="nf" d="M-7-3.5h6v-4l8 7.5-8 7.5v-4h-6z"/>', .8],
  freio: [R, IC('freio')], bat: [R, IC('bateria')], inj: ['#ffc02e', IC('motor')], oleo: [R, IC('oleo')], cinto: [R, IC('cinto')], reserva: [R, IC('bomba')], quente: [R, IC('temp')],
  eletr: [A, '<circle class="nf" r="7.5"/><circle class="nf" r="10.4" stroke-width="2.6" stroke-dasharray="2.72 2.725"/><path d="M1.5-5.5l-4.5 6h3l-1.5 5 4.5-6.5h-3z"/>', .78] };
function fenda(cx, cy, w, h, ids, off = '#1a1c20') {
  const x = cx - w / 2, y = cy - h / 2, m = 2.5, r = h / 2 - m, t = y + m, bt = y + h - m;
  return `<rect class="slot" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${off}"/>` + ids.map(([id, f0, f1, simb]) => {
    const a = x + Math.max(f0 * w, m), b = x + Math.min(f1 * w, w - m), a1 = f0 ? a : a + r, b1 = f1 < 1 ? b : b - r;
    const d = `M${a1},${t}H${b1}${f1 < 1 ? `V${bt}` : `A${r},${r} 0 0 1 ${b1},${bt}`}H${a1}${f0 ? '' : `A${r},${r} 0 0 1 ${a1},${t}`}Z`;
    return `<g id="i_${id}" class="lamp${simb ? ' simb' : ''}${id === 'quente' ? ' pisca' : ''}" style="--c:${LAMPS[id][0]}">${simb ? '' : `<path class="bg" d="${d}"/>`}` +
      `<g class="sym" transform="translate(${f(simb && !f0 ? x + f1 * w / 2 : (a + b) / 2)},${cy}) scale(${f(h / 26 * (LAMPS[id][2] || 1))})">${LAMPS[id][1]}</g></g>`;
  }).join('');
}
s += fenda(640, 25, 160, 34, [['eletr', 0, .3, 1], ['alto', .32, .63], ['nebl', .685, 1]], '#454c55') + fenda(640, 68, 96, 30, [['setaE', 0, .48], ['setaD', .52, 1]], '#454c55') +
  // reserva e temperatura alta: logo abaixo do meio das telinhas de combustível e de T.Motor
  fenda(XE + LW / 2, Yn(4) + HB + 28, 64, 34, [['reserva', 0, 1]]) + fenda(XD + LW / 2, Yn(4) + HB + 28, 64, 34, [['quente', 0, 1]]) +
  fenda(440, 452, 140, 38, [['oleo', 0, .48], ['inj', .52, 1]]) + fenda(840, 452, 150, 38, [['freio', 0, .31], ['bat', .345, .655], ['cinto', .69, 1]]);

// shift light logo acima do turbo, no vão entre os dois mostradores: aro cromado e lente vermelha
const SH = { cx: 640, cy: 258, r: 14 };
s += `<circle cx="${SH.cx}" cy="${SH.cy}" r="${SH.r + 4}" fill="#1a1d21" stroke="url(#aro)" stroke-width="3"/>` +
  `<g id="i_shift" class="lamp shift${V.rpm >= 6000 ? ' on' : ''}"><circle class="bg" cx="${SH.cx}" cy="${SH.cy}" r="${SH.r}"/></g>`;

// ponteiros por cima de tudo
const AGULHAS = { nRpm: [T.cx, T.cy, T.r * .86], nVel: [S.cx, S.cy, S.r * .86], nTur: [B.cx, B.cy, B.r * .85] };
s += needle('nRpm', T.cx, T.cy, T.r * .86, 1.5) + needle('nVel', S.cx, S.cy, S.r * .86, 1.5) + needle('nTur', B.cx, B.cy, B.r * .85, .85);
$('g').innerHTML = s;
const rot = (id, a) => $(id).setAttribute('transform', `rotate(${f(a)})`);
rot('nRpm', rpmA(V.rpm)); rot('nVel', Math.max(-136.5, velA(V.vel))); rot('nTur', turA(Math.min(2, Math.max(-1, V.turbo))));
if (Q.has('sem')) document.querySelectorAll('.needle').forEach(n => n.style.display = 'none');
if (Q.get('noite') === '1') $('p').classList.add('lit');
if (Q.has('cor')) $('p').classList.add(Q.get('cor'));
if (Q.get('luzes') === '1') document.querySelectorAll('.lamp').forEach(l => l.classList.add('on'));
// na amostra, as duas acendem pelos valores: reserva até 15% do tanque, temperatura a partir de 110 °C
if (V.tanque <= 15) $('i_reserva').classList.add('on');
if (V.temp >= 110) $('i_quente').classList.add('on');

// ---- exportação para a Ghost (gerar_ghost.py): ?ghost=fundo | luzes | agulha&id= | dados ----
const G_ = Q.get('ghost'), svgEl = $('p');
const saida = o => document.body.insertAdjacentHTML('beforeend', `<pre id="out" hidden>${JSON.stringify(o)}</pre>`);
if (G_) document.head.insertAdjacentHTML('beforeend', '<style>html,body{background:transparent!important}</style>');
if (G_ === 'fundo') { // sem ponteiros, sem valores, barras todas apagadas, luzes apagadas: o resto vem dos widgets
  document.querySelectorAll('.needle,.val').forEach(e => e.remove()); document.querySelectorAll('.lamp.on').forEach(l => l.classList.remove('on'));
  document.querySelectorAll('.lseg').forEach(e => e.setAttribute('opacity', .1));
} else if (G_ === 'luzes') { // só as luzes acesas (ou só a de &id=), em fundo transparente, e as caixas delas
  document.head.insertAdjacentHTML('beforeend', '<style>#g>*:not(.lamp),svg>rect{display:none}</style>');
  const out = {};
  document.querySelectorAll('.lamp').forEach(l => { if (Q.has('id') && l.id !== 'i_' + Q.get('id')) return l.remove(); l.classList.add('on'); const b = l.getBBox(); out[l.id.slice(2)] = [b.x, b.y, b.width, b.height].map(v => +v.toFixed(1)); });
  saida(out);
} else if (G_ === 'agulha') { // um ponteiro para cima, eixo no centro de uma imagem quadrada
  const id = Q.get('id'), [cx, cy, len] = AGULHAS[id], L = 2.1 * len * 1.05;
  $(id).removeAttribute('transform');
  [...$('g').children].forEach(c => { if (!c.contains($(id))) c.remove(); }); svgEl.querySelector('svg>rect').remove();
  svgEl.setAttribute('viewBox', `${cx - L / 2} ${cy - L / 2} ${L} ${L}`);
  document.head.insertAdjacentHTML('beforeend', '<style>svg{width:100vw;height:100vh}</style>');
} else if (G_ === 'dados') {
  const ang = { nRpm: [0, 7000, rpmA(0), rpmA(7000)], nVel: [20, 220, velA(20), velA(220)], nTur: [-1, 2, turA(-1), turA(2)] };
  saida({ agulhas: Object.fromEntries(Object.entries(AGULHAS).map(([k, [cx, cy, len]]) => { const L = 2.1 * len * 1.05; return [k, [cx - L / 2, cy - L / 2, L, ...ang[k]].map(v => +v.toFixed(2))]; })),
    valores: VALS, barras: BARRAS });
}
