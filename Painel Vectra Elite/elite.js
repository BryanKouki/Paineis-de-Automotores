const RAD = Math.PI / 180, E = ELITE, X0 = E.eixo;
const P = (cx, cy, r, a) => [cx + r * Math.sin(a * RAD), cy - r * Math.cos(a * RAD)];
const f = v => (+v).toFixed(2);
// enquadramento: a caixa dos elementos (aros, janelas) centrada na tela, 16 px de margem
const CX = { x0: 29.5, y0: E.grande.y - E.grande.r_fora, x1: 2 * X0 - 29.5, y1: 313.5 };
const S = Math.min((1280 - 32) / (CX.x1 - CX.x0), (480 - 32) / (CX.y1 - CX.y0)), YM = (CX.y0 + CX.y1) / 2;

// ---- janelas das luzes: contorno de fora medido linha a linha na referência 07, nos dois lados (média do direito com o esquerdo
// espelhado); medidas nas da direita, a da esquerda é o espelho ----
const arred = (pts, rs) => { // polígono de cantos arredondados, um raio por canto
  let d = ''; const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [a, b, c] = [pts[(i + n - 1) % n], pts[i], pts[(i + 1) % n]], r = rs[i];
    const u = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
    const ua = u(b, a), uc = u(b, c), p1 = [b[0] + ua[0] * r, b[1] + ua[1] * r], p2 = [b[0] + uc[0] * r, b[1] + uc[1] * r];
    d += (i ? 'L' : 'M') + f(p1[0]) + ',' + f(p1[1]) + 'Q' + f(b[0]) + ',' + f(b[1]) + ' ' + f(p2[0]) + ',' + f(p2[1]);
  }
  return d + 'Z';
};
const espelha = pts => pts.map(([x, y]) => [2 * X0 - x, y]).reverse();
// de cima: o lado de dentro é um arco concêntrico ao mostrador grande (raio 139,66), o topo é um arco largo abaulado para cima
// (raio 611,38), o lado de fora é reto (x = 0,1211·y + 720,92) e a base é reta (y = 162,03); ajustados nos dois lados da referência 07
// (resíduo médio até 0,2 px). Cantos arredondados (o Bryan pediu um pouco mais)
const [SUP, R_SUP] = (() => {
  const C = [X0 + E.grande.dx, E.grande.y], RI = 139.66, CT = [550.68, 708.04], RT = 611.38, fora = y => .1211 * y + 720.92, YB = 162.03;
  const topoY = x => CT[1] - Math.sqrt(RT * RT - (x - CT[0]) ** 2), dentroX = y => C[0] + Math.sqrt(RI * RI - (y - C[1]) ** 2);
  const corta = (f, a, b) => { for (let i = 0; i < 60; i++) { const m = (a + b) / 2; (f(a) * f(m) <= 0 ? (b = m) : (a = m)); } return (a + b) / 2; };
  const xTL = corta(x => Math.hypot(x - C[0], topoY(x) - C[1]) - RI, 600, 700), xTR = corta(x => x - fora(topoY(x)), 700, 760);
  const pts = [], rs = [];
  for (let i = 0; i <= 12; i++) { const x = xTL + (xTR - xTL) * i / 12; pts.push([x, topoY(x)]); rs.push(i === 12 ? 4 : 0); } // trechos de 7,2: erro de 0,01
  pts.push([fora(YB), YB]); rs.push(4);
  const yTL = topoY(xTL);
  for (let i = 0; i < 8; i++) { const y = YB + (yTL - YB) * i / 8; pts.push([dentroX(y), y]); rs.push(i === 0 ? 5.5 : 0); } // trechos de 7,1: erro de 0,05
  rs[0] = 5.5; return [pts, rs];
})();
// de baixo: na ponta de dentro, canto de cima redondo, desce reto até perto do meio e daí corta em diagonal até a base (recua 6);
// a ponta de fora é reta
const INF = [[578.8, 289.5], [760, 289.5], [760, 313], [584.8, 313], [578.8, 300.5]], R_INF = [5, 2.5, 2.5, 1.5, 2.5];
const par = (pts, rs) => [arred(pts, rs), arred(espelha(pts), [...rs].reverse())];
// janela de cima: as laterais acompanham os aros grandes (arco de raio 126,5 em volta de cada um), o topo é um arco largo e o fundo é reto
const topo = (() => {
  const g = E.grande, RL = 126.5, RT = 720, yT = 48.4, yB = 132.4, ct = [X0 - g.dx, g.y], cs = [X0 + g.dx, g.y];
  // canto de cima: cruzamento do arco de cima (centro no eixo, abaixo) com o arco em volta do aro esquerdo, por bisseção
  const topoY = x => yT + RT - Math.sqrt(RT * RT - (x - X0) ** 2);
  let a = ct[0], b = X0; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; (Math.hypot(m - ct[0], topoY(m) - ct[1]) < RL ? (a = m) : (b = m)); }
  const xc = (a + b) / 2, yc = topoY(xc), xb = ct[0] + Math.sqrt(RL * RL - (yB - ct[1]) ** 2);
  return `M${f(xc)},${f(yc)}A${RT},${RT} 0 0 1 ${f(2 * X0 - xc)},${f(yc)}A${RL},${RL} 0 0 0 ${f(2 * X0 - xb)},${yB}L${f(xb)},${yB}A${RL},${RL} 0 0 0 ${f(xc)},${f(yc)}Z`;
})();
const janelas = [...par(SUP, R_SUP), ...par(INF, R_INF), topo].map(d => `<path class="jan" d="${d}" filter="url(#fundo)"/>`).join('') +
  // pino de zerar o parcial (só do lado direito, como na referência 07)
  `<circle cx="618.5" cy="277.5" r="5.5" fill="url(#pino)" stroke="#060607" stroke-width=".6"/><circle cx="617.2" cy="276.2" r="1.4" fill="#5d6166" opacity=".8"/>`;

// ---- mostradores grandes: medidas da película em frações de R (borda de fora do arco) ----
const RG = E.grande.arco * E.grande.r_dentro; // borda de fora do arco: 0,875 da borda de dentro do aro cromado (referência 11)
const G = {
  ESP: .0315, FAIXA: [.0475, .115], CURTO: .077, LONGO: .112, L_CURTO: .020, L_LONGO: .025, NUM: .822, FONTE: .137,
};
// setor de anel entre os raios r1 < r2, dos ângulos a1 a a2
const setor = (cx, cy, r1, r2, a1, a2, cls) => { const [x1, y1] = P(cx, cy, r2, a1), [x2, y2] = P(cx, cy, r2, a2), [x3, y3] = P(cx, cy, r1, a2), [x4, y4] = P(cx, cy, r1, a1), g = a2 - a1 > 180 ? 1 : 0;
  return `<path class="${cls}" d="M${f(x1)},${f(y1)}A${r2},${r2} 0 ${g} 1 ${f(x2)},${f(y2)}L${f(x3)},${f(y3)}A${r1},${r1} 0 ${g} 0 ${f(x4)},${f(y4)}Z"/>`; };
// traço: retângulo radial de largura w (centrado no ângulo), do raio r1 ao r2
const traco = (cx, cy, a, r1, r2, w, cls) => { const t = a * RAD, u = [Math.sin(t), -Math.cos(t)], n = [Math.cos(t), Math.sin(t)], h = w / 2;
  const q = [[r1, -h], [r2, -h], [r2, h], [r1, h]].map(([r, s]) => f(cx + u[0] * r + n[0] * s) + ',' + f(cy + u[1] * r + n[1] * s));
  return `<path class="${cls}" d="M${q.join('L')}Z"/>`; };

function grande(cx, cy, cfg) {
  const R = RG, ang = cfg.ang, rIn = R * (1 - G.ESP);
  let s = '';
  // faixa cinza por dentro do arco (vermelha na zona vermelha) e o arco
  const [a0, a1] = [ang(cfg.min), ang(cfg.max)], hw = G.L_LONGO * R / 2 / R / RAD; // meia largura do traço da ponta, em graus
  const vr = cfg.verm ? ang(cfg.verm) : a1 + hw;
  s += setor(cx, cy, R * (1 - G.FAIXA[1]), R * (1 - G.FAIXA[0]), a0 - hw, vr, 'faixa');
  if (cfg.verm) s += setor(cx, cy, R * (1 - G.FAIXA[1]), R * (1 - G.FAIXA[0]), vr, a1 + hw, 'verm');
  s += setor(cx, cy, rIn, R, a0 - hw, vr, 'marca');
  if (cfg.verm) s += setor(cx, cy, rIn, R, vr, a1 + hw, 'verm');
  // traços
  for (let v = cfg.min; v <= cfg.max + 1e-9; v += cfg.passo) {
    const longo = Math.abs(v / cfg.longo - Math.round(v / cfg.longo)) < 1e-6, a = ang(v);
    const cls = (cfg.verm && v >= cfg.verm) || (cfg.tracoVerm || []).includes(v) ? 'verm' : 'marca';
    s += traco(cx, cy, a, R * (1 - G.ESP - (longo ? G.LONGO : G.CURTO)), rIn + .3, R * (longo ? G.L_LONGO : G.L_CURTO), cls);
  }
  return s;
}
// números: na direção do traço, o centro recua até a caixa do número ficar na distância medida (NUM·R menos meia caixa)
function numeros(cx, cy, cfg, alvo) {
  const R = RG, fs = G.FONTE * R, h = .716 * fs;
  for (const v of cfg.nums) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('class', 'num'); t.style.fontSize = fs + 'px';
    t.textContent = cfg.rotulo(v); if (cfg.laranja && cfg.laranja.includes(v)) t.style.fill = '#ef9a36';
    // os de três algarismos são mais apertados no painel: 0,19 R de largura contra 0,216 R na Arial (película e referência 11)
    if (t.textContent.length === 3) t.style.letterSpacing = f(-.013 * R) + 'px';
    alvo.appendChild(t); const w = t.getComputedTextLength(), a = ang0(cfg, v), sn = Math.abs(Math.sin(a * RAD)), cs = Math.abs(Math.cos(a * RAD));
    const [x, y] = P(cx, cy, G.NUM * R - (sn * w + cs * h) / 2, a); t.setAttribute('x', f(x)); t.setAttribute('y', f(y));
  }
}
const ang0 = (cfg, v) => cfg.ang(v);
const TACH = { min: 0, max: 7000, passo: 500, longo: 1000, ang: v => -123.55 + v / 7000 * 247.1, verm: 6275, nums: [0, 1, 2, 3, 4, 5, 6, 7].map(k => k * 1000), rotulo: v => String(v / 100), laranja: [7000] };
const SPD = { min: 0, max: 220, passo: 10, longo: 20, ang: v => -123.05 + v / 220 * 246.1, tracoVerm: [50], nums: Array.from({ length: 12 }, (_, i) => i * 20), rotulo: String };

// texto impresso: tamanho e linha de base em frações de R (alturas conferidas na referência 11, a foto de perto dos mostradores)
const texto = (cx, cy, s, fs, base, cls) => `<text class="txt ${cls}" x="${f(cx)}" y="${f(cy + base * RG)}" style="font-size:${f(fs * RG)}px">${s}</text>`;
// impressos laranja, desenhados ponto a ponto na ampliação da película (em px da foto, com origem no meio de cada um); a decalcagem
// automática borrava, de tão pequenos. x: no eixo do mostrador; y: a altura medida, em px da foto a partir do eixo
// gravata: só o contorno, com as medidas da película (largura 53,1, barra do meio 18,2 x 18,5, braços 9,9 de altura, pontas inclinadas
// 0,383) e as bordas retas: na película ela sai girada uns 4° porque a película está torta ali. Centro 0,281 R abaixo do eixo do
// conta-giros (referência 11; R da película 144,33)
const GRAVATA = (() => { const W = 26.57, P_ = 22.79, C = 9.1, B = 4.94, T = 9.23; // meia largura, ponta de dentro, barra, braço, topo da barra
  const p = [[-W, B], [-P_, -B], [-C, -B], [-C, -T], [C, -T], [C, -B], [W, -B], [P_, B], [C, B], [C, T], [-C, T], [-C, B]];
  return 'M' + p.map(([x, y]) => f(x) + ',' + f(y)).join('L') + 'Z'; })();
// termômetro: o símbolo de sempre (o da tabela de símbolos, o mesmo do Kadett e do Vectra B), a pedido do Bryan; na película ele
// tem 23,3 x 19,7 (o símbolo, 25,1 x 21,5: escala 0,92) e o centro 33,2 acima do eixo (R da película 75)
const TERMOMETRO = 'M1.1,-10.8L0.6,-10.6L-0.8,-9.7L-1.0,-9.4L-1.0,1.8L-1.1,2.1L-1.5,2.6L-2.0,3.0L-2.4,3.9L-2.5,4.5L-2.5,5.1L-2.3,5.6L-1.7,6.6L-0.7,7.2L-0.1,7.3L0.8,7.2L1.7,6.7L2.3,6.0L2.5,5.6L2.6,4.6L2.5,3.8L2.3,3.4L1.6,2.5L1.5,2.1L1.5,0.5L1.8,0.3L3.3,0.4L3.8,0.5L4.7,0.3L5.0,0.1L5.1,-0.4L5.0,-0.8L4.7,-1.0L3.8,-1.2L1.8,-1.1L1.6,-1.2L1.5,-1.4L1.4,-2.8L1.6,-3.1L1.8,-3.2L2.3,-3.1L4.7,-3.2L5.0,-3.4L5.1,-3.9L5.0,-4.2L4.7,-4.5L3.7,-4.6L1.8,-4.6L1.6,-4.7L1.4,-5.0L1.4,-7.0L1.6,-7.1L1.8,-7.2L3.3,-7.2L4.7,-7.3L4.9,-7.4L5.1,-7.9L4.9,-8.4L4.6,-8.6L3.8,-8.7L1.8,-8.6L1.6,-8.7L1.5,-9.0L1.5,-10.5L1.3,-10.8ZM9.6,2.5L8.3,2.9L7.3,3.7L6.3,4.1L4.3,4.4L4.2,4.5L4.1,4.9L4.1,5.6L4.3,5.8L4.7,5.9L6.3,5.8L7.4,5.3L8.5,4.5L9.3,4.3L10.6,4.4L11.7,5.1L12.1,5.3L12.3,5.3L12.5,5.0L12.5,4.6L12.1,3.5L11.2,2.9ZM-10.4,2.8L-11.8,3.4L-12.5,3.9L-12.6,4.2L-12.5,5.0L-12.3,5.3L-11.9,5.2L-10.3,4.4L-9.7,4.3L-8.8,4.4L-8.4,4.8L-7.8,4.9L-7.3,5.2L-6.2,5.6L-4.7,5.8L-4.4,5.6L-4.1,5.2L-4.1,5.0L-4.2,4.6L-4.6,4.3L-5.8,4.2L-8.6,2.8ZM9.9,7.6L7.8,8.7L6.6,8.8L6.1,8.8L4.5,7.9L3.4,7.7L2.5,7.9L1.1,8.7L0.2,9.0L-0.8,9.0L-2.9,8.0L-3.7,7.9L-4.7,7.9L-6.1,8.4L-6.7,8.7L-7.2,8.7L-7.7,8.6L-8.3,8.3L-9.1,8.1L-9.7,7.8L-10.7,7.7L-10.9,7.8L-11.1,8.0L-11.2,8.5L-11.1,8.9L-10.8,9.2L-9.7,9.5L-8.2,10.2L-7.7,10.3L-6.6,10.3L-4.7,9.5L-3.8,9.4L-2.4,9.9L-1.9,10.3L-0.2,10.5L1.4,10.3L2.1,9.9L3.4,9.5L3.8,9.5L5.9,10.5L6.4,10.7L7.9,10.2L9.9,9.2L10.3,8.8L10.4,8.2L10.3,7.7Z';
// bomba: corpo cheio com o visor vazado e a mangueira à direita; centro 30,9 acima do eixo (R da película 71,3, a ponta direita da
// película está encolhida)
const BOMBA = 'M-8.2,-9.6h11v19.4h-11zM-5.6,-6.9v5.7h5.7v-5.7z' + 'M2.8,-8.2l2.6,1.4q1.4,.8 1.4,2.4v8.6q0,1.9-1.7,1.9t-1.7,-1.9v-3.6h1.2v3.6q0,.8 .5,.8t.5,-.8v-8.6q0,-.9-.8,-1.4l-2,-1.1z';
const simbolo = (d, cx, cy, k, cls, extra = '') => `<path class="${cls}" fill-rule="evenodd" d="${d}" transform="translate(${f(cx)},${f(cy)}) scale(${f(k)})"${extra}/>`;

// ---- mostradores pequenos (temperatura e combustível) ----
// pequenos: a corda do arco é 0,54 do raio de fora do aro grande (fotos 01 e 06; o aro preto da referência 07 é mais largo que o
// cromado do carro, então o tamanho vai pelo mostrador grande) e o topo do arco fica 0,52 do raio do aro acima do centro (foto 01)
const RP = .54 * E.grande.r_fora / (2 * Math.sin(43.7 * RAD)), EIXO_P = RP - .52 * E.pequeno.r_fora;
function pequeno(cx, cy, lado) { // lado 1: temperatura (vermelho na direita), -1: combustível (vermelho na esquerda)
  const R = RP, cyE = cy + EIXO_P, MEIO = 43.7, PONTA = 42.6, ESP = .04, FX = [.069, .183], W = .04 * R;
  let s = setor(cx, cyE, R * (1 - FX[1]), R * (1 - FX[0]), -MEIO, MEIO, 'faixa') + setor(cx, cyE, R * (1 - ESP), R, -MEIO, MEIO, 'marca');
  const [v1, v2] = lado > 0 ? [37, 40.4] : [-40.4, -37];
  s += setor(cx, cyE, R * (1 - FX[1]), R * (1 - FX[0]), v1, v2, 'verm');
  for (const a of [-PONTA, PONTA]) s += traco(cx, cyE, a, R * (1 - ESP - .19), R * (1 - ESP) + .2, W, 'marca');
  for (const a of [-21.3, 0, 21.3]) s += traco(cx, cyE, a, R * (1 - ESP - .143), R * (1 - ESP) + .2, W, 'marca');
  return s;
}

// ---- montagem ----
const g = E.grande, p = E.pequeno, cT = [X0 - g.dx, g.y], cS = [X0 + g.dx, g.y], cTe = [X0 - p.dx, p.y], cCo = [X0 + p.dx, p.y];
// os quatro mostradores têm só o aro cromado de fora (pedido do Bryan; foto 01): sem a faixa cinza por dentro nos grandes. Nos
// pequenos o aro tem 0,85 da espessura do dos grandes (foto 01) e o mostrador vai até ele
const AP = p.r_fora - .85 * (g.r_fora - g.r_dentro);
const aro = (c, r1, r2, cls) => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f((r1 + r2) / 2)}" fill="none" class="${cls}" stroke-width="${f(r2 - r1)}"/>`;
const face = (c, r) => `<circle class="faceC" cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="url(#face)"/>`;
// luzes-espia que a Ghost acende: os símbolos do Vectra B e do Astra no lugar e no tamanho medidos na película (luzes.py), com as
// cores das fotos 06 e da referência 07
const COR = { neblinaD: '#7ee03c', alto: '#2f8dff', neblinaT: '#ffb020', esq: '#7ee03c', dir: '#7ee03c', porta: '#ff3b30', bat: '#ff3b30', inj: '#ffb020', oleo: '#ff3b30', freio: '#ff3b30' };
const luzes = Object.entries(LUZES_ELITE).map(([id, l]) => `<g class="luz" id="l_${id}" style="--c:${COR[id]}"><path fill-rule="evenodd" d="${l.d}" transform="translate(${l.x},${l.y}) scale(${l.k})"/></g>`).join('');
// ---- ponteiros: barra vermelha que afina um pouco até a ponta redonda, com um toco atrás do eixo; cubo escuro por cima ----
// grandes: até 0,935 do raio do arco (a ponta entra nos traços, fotos 01 e 02), cubo de 0,15 R (cobre o furo da película, 0,13 R)
// pequenos: até 0,93 do raio do arco, cubo de 0,235 R (o furo da película dos pequenos)
const agulha = (id, c, len, base, ponta, toco) => `<g transform="translate(${f(c[0])},${f(c[1])})"><g id="${id}">` +
  `<path class="agulha" d="M${f(-ponta)},${f(-len + ponta)}A${f(ponta)},${f(ponta)} 0 0 1 ${f(ponta)},${f(-len + ponta)}L${f(base)},${f(toco)}L${f(-base)},${f(toco)}Z"/></g></g>`;
const cubo = (c, r) => `<circle class="cubo" cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="url(#cubo)" stroke="#0b0b0c" stroke-width="${f(r * .06)}" filter="url(#relevo)"/>`;
let svg = `<defs>
  <linearGradient id="tela" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0f12"/><stop offset="1" stop-color="#181b1f"/></linearGradient>
  <radialGradient id="face" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#303337"/><stop offset=".75" stop-color="#26282b"/><stop offset="1" stop-color="#1c1d20"/></radialGradient>
  <linearGradient id="cromo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f8f9"/><stop offset=".45" stop-color="#d3d6d9"/><stop offset="1" stop-color="#a2a6ab"/></linearGradient>
  <radialGradient id="pino" cx=".4" cy=".35"><stop offset="0" stop-color="#3b3d41"/><stop offset="1" stop-color="#0e0f11"/></radialGradient>
  <radialGradient id="cubo" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#4a4d51"/><stop offset=".6" stop-color="#2a2c2f"/><stop offset="1" stop-color="#161719"/></radialGradient>
  <filter id="fundo" x="-10%" y="-30%" width="120%" height="160%" color-interpolation-filters="sRGB">
    <feComponentTransfer in="SourceAlpha" result="fora"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>
    <feOffset in="fora" dy="1.6"/><feGaussianBlur stdDeviation="1.2" result="sb"/>
    <feFlood flood-color="#000" flood-opacity=".8"/><feComposite in2="sb" operator="in"/><feComposite in2="SourceAlpha" operator="in" result="sombra"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sombra"/></feMerge></filter>
  <filter id="relevo" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx=".6" dy="1.2" stdDeviation="1" flood-color="#000" flood-opacity=".7"/></filter>
</defs><rect width="1280" height="480" fill="url(#tela)"/>
<g id="painel" transform="translate(640,240) scale(${f(S)}) translate(${-X0},${-YM})">${janelas}` +
  face(cT, g.r_dentro + .5) + face(cS, g.r_dentro + .5) + face(cTe, AP + .5) + face(cCo, AP + .5) +
  // visor fora das marcas: de noite ele não ganha o brilho delas
  `<rect class="lcd" x="${f(cS[0] - .3317 * RG)}" y="${f(cS[1] + .5764 * RG)}" width="${f(.6634 * RG)}" height="${f(.2634 * RG)}" rx="1.5"/>` +
  `<g class="marcas">` + grande(...cT, TACH) + grande(...cS, SPD) + pequeno(...cTe, 1) + pequeno(...cCo, -1) +
  texto(cT[0], cT[1], 'x100', .0935, -.4185, 'laranja') + texto(cT[0], cT[1], 'rpm', .0845, -.327, 'laranja') +
  texto(cS[0], cS[1], 'km/h', .0928, -.408, 'laranja') + texto(cS[0], cS[1], 'km', .091, .313, 'laranja') +
  simbolo(GRAVATA, cT[0], cT[1] + 40.6 / 144.33 * RG, RG / 144.33, 'gravata', ' stroke-width=".9" stroke-linejoin="miter"') +
  simbolo(TERMOMETRO, cTe[0], cTe[1] + EIXO_P - 33.2 / 75 * RP, .92 * RP / 75, 'laranja') + simbolo(BOMBA, cCo[0], cCo[1] + EIXO_P - 30.9 / 71.3 * RP, RP / 71.3, 'laranja') +
  `<g id="nums"></g></g>` + luzes +
  agulha('nRpm', cT, .935 * RG, .030 * RG, .016 * RG, .12 * RG) + agulha('nVel', cS, .935 * RG, .030 * RG, .016 * RG, .12 * RG) +
  agulha('nTemp', [cTe[0], cTe[1] + EIXO_P], .93 * RP, .045 * RP, .024 * RP, .2 * RP) + agulha('nComb', [cCo[0], cCo[1] + EIXO_P], .93 * RP, .045 * RP, .024 * RP, .2 * RP) +
  cubo(cT, .15 * RG) + cubo(cS, .15 * RG) + cubo([cTe[0], cTe[1] + EIXO_P], .235 * RP) + cubo([cCo[0], cCo[1] + EIXO_P], .235 * RP) +
  aro(cT, g.r_dentro, g.r_fora, 'cromo') + aro(cS, g.r_dentro, g.r_fora, 'cromo') + aro(cTe, AP, p.r_fora, 'cromo') + aro(cCo, AP, p.r_fora, 'cromo') + '</g>';
const svgEl = document.getElementById('p'); svgEl.innerHTML = svg;
svgEl.querySelectorAll('.cromo').forEach(c => { c.setAttribute('stroke', 'url(#cromo)'); c.setAttribute('filter', 'url(#relevo)'); });
numeros(...cT, TACH, document.getElementById('nums')); numeros(...cS, SPD, document.getElementById('nums'));
document.querySelectorAll('#nums text').forEach(t => { if (t.style.fill) { t.style.fill = ''; t.classList.add('laranja'); } }); // o 70 é impresso em laranja

// ---- ponteiros: ângulos (0 = para cima, horário) ----
const lim = (v, a, b) => Math.min(b, Math.max(a, v));
const ANG = { nRpm: v => TACH.ang(lim(v, 0, 7000)), nVel: v => SPD.ang(lim(v, 0, 220)),
  nTemp: t => -42.6 + (lim(t, 50, 130) - 50) / 80 * 85.2, nComb: c => -42.6 + lim(c, 0, 100) / 100 * 85.2 }; // dos traços das pontas
const gira = (id, v) => document.getElementById(id).setAttribute('transform', `rotate(${f(ANG[id](v))})`);
const q = new URLSearchParams(location.search), $ = id => document.getElementById(id);
gira('nRpm', +(q.get('rpm') || 0)); gira('nVel', +(q.get('vel') || 0)); gira('nTemp', +(q.get('temp') || 50)); gira('nComb', +(q.get('comb') || 0));
if (q.get('noite')) svgEl.classList.add('lit');
if (q.get('luzes')) document.querySelectorAll('.luz').forEach(l => l.classList.add('on'));
const AGULHAS = ['nRpm', 'nVel', 'nTemp', 'nComb'];
const semPonteiros = () => { AGULHAS.forEach(id => $(id).parentNode.remove()); document.querySelectorAll('.cubo').forEach(c => c.remove()); };
if (q.get('sem') === 'ponteiros') semPonteiros();

// ---- exportação para a Ghost ----
const G_ = q.get('ghost');
const tela = (x, y) => [640 + (x - X0) * S, 240 + (y - YM) * S];
const saida = o => document.body.insertAdjacentHTML('beforeend', `<pre id="out" hidden>${JSON.stringify(o)}</pre>`);
if (G_) document.head.insertAdjacentHTML('beforeend', '<style>html,body{background:transparent!important}svg{width:100vw;max-width:none}</style>');
if (G_ === 'fundo') semPonteiros();
else if (G_ === 'luzes') { // só as luzes acesas, em fundo transparente, e as caixas delas na tela
  document.head.insertAdjacentHTML('beforeend', '<style>#painel>*:not(.luz),svg>rect{display:none}</style>');
  const out = {}, raiz = svgEl.getScreenCTM().inverse();
  document.querySelectorAll('.luz').forEach(l => { l.classList.add('on'); const e = l.firstElementChild, b = e.getBBox(), m = raiz.multiply(e.getScreenCTM());
    const c = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
    const xs = c.map(p => p.x), ys = c.map(p => p.y); out[l.id.slice(2)] = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map(v => +v.toFixed(1)); });
  saida(out);
} else if (G_ === 'agulha') { // um ponteiro com o cubo, para cima, eixo no centro de uma imagem quadrada de lado L (px da tela)
  const id = q.get('id'), L = +q.get('lado'), g = $(id).parentNode, m = g.transform.baseVal[0].matrix;
  $(id).removeAttribute('transform');
  const cb = [...document.querySelectorAll('.cubo')].find(c => Math.hypot(c.cx.baseVal.value - m.e, c.cy.baseVal.value - m.f) < .5);
  const pai = $('painel'); [...pai.children].forEach(c => { if (c !== g && c !== cb) c.remove(); }); svgEl.querySelector('svg>rect').remove();
  pai.removeAttribute('transform'); const Lp = L / S; svgEl.setAttribute('viewBox', `${m.e - Lp / 2} ${m.f - Lp / 2} ${Lp} ${Lp}`);
  document.head.insertAdjacentHTML('beforeend', '<style>svg{width:100vw;height:100vh}</style>');
} else if (G_ === 'dados') { // eixos, raios e comprimentos na tela, e o retângulo do visor
  const o = { escala: S, cubos: {} };
  for (const [id, c, r, len] of [['nRpm', cT, .15 * RG, .935 * RG], ['nVel', cS, .15 * RG, .935 * RG], ['nTemp', [cTe[0], cTe[1] + EIXO_P], .235 * RP, .93 * RP], ['nComb', [cCo[0], cCo[1] + EIXO_P], .235 * RP, .93 * RP]])
    o.cubos[id] = [...tela(...c), r * S, len * S].map(v => +v.toFixed(2));
  o.angulos = { rpm: [0, 7000, ANG.nRpm(0), ANG.nRpm(7000)], vel: [0, 220, ANG.nVel(0), ANG.nVel(220)], temp: [50, 130, ANG.nTemp(50), ANG.nTemp(130)], comb: [0, 100, ANG.nComb(0), ANG.nComb(100)] };
  const lc = svgEl.querySelector('.lcd'); const x = +lc.getAttribute('x'), y = +lc.getAttribute('y'), w = +lc.getAttribute('width'), h = +lc.getAttribute('height');
  o.lcd = [...tela(x, y), w * S, h * S].map(v => +v.toFixed(1));
  saida(o);
}
