// Painel Kadett GLS 98: desenho e lógica compartilhados pelos três painéis.
// As medidas são pixels da foto de referência (painel só com a luz de bateria, 1200x1038); cada painel reposiciona as peças com `place`.
// Duas versões do miolo central de cima: 'bateria' (só a luz de carga) e 'completa' (voltímetro e pressão do óleo).
const Kadett = (() => {
  const $ = id => document.getElementById(id), RAD = Math.PI / 180;
  const P = (cx, cy, r, a) => [+(cx + r * Math.sin(a * RAD)).toFixed(1), +(cy - r * Math.cos(a * RAD)).toFixed(1)];

  // Ângulos em graus, 0 = para cima, horário positivo. Centros achados pelo cruzamento das retas dos traços, na foto.
  // Mostrador redondo cortado reto embaixo (CORTE abaixo do centro), onde passa a faixa das luzes.
  const SPD = { cx: 317.2, cy: 276.5, r: 143 }, TACH = { cx: 887.6, cy: 280.2, r: 143 }, CORTE = 108;
  // escalas medidas na foto: 12,55° a cada 10 km/h com o 120 no alto; 35,6° a cada 1.000 rpm, simétrico
  // abaixo de 20 o ponteiro descansa no batente; desbloqueado, segue além do 220 até encostar por trás no batente
  const velAngle = v => Math.min(233, Math.max(-127, (v - 120) * 1.2557));
  const rpmAngle = rpm => -124.6 + rpm / 1000 * 35.6;
  // miolo central: coluna de x 525 a 682 (meio em 603,5); quadro de cima (y 130 a 265) e de baixo (290 a 422).
  // Os mostradores do miolo giram em volta de eixos escondidos fora do quadro: à esquerda os da esquerda, à direita os da direita
  const COL = { x0: 525, x1: 682, meio: 603.5, topo: [130, 265], baixo: [290, 422] };
  const EIXO = { esq: 494, dir: 713, topo: 197.5, baixo: 348 }, RM = 83; // RM = raio das marcas
  const tempAngle = t => 120 - (Math.min(130, Math.max(50, t)) - 50) / 80 * 56;   // frio embaixo (azul), quente em cima
  const combAngle = f => -122 + Math.min(1, Math.max(0, f)) * 64;                  // vazio embaixo (reserva), cheio em cima
  const voltAngle = v => 122 - (Math.min(16, Math.max(10, v)) - 10) / 6 * 60;       // 10 V embaixo, 16 V em cima
  const oleoAngle = b => -62 - Math.min(5, Math.max(0, b)) / 5 * 60;                // 0 bar em cima, 5 bar embaixo
  console.assert(Math.abs(velAngle(220) - 125.57) < .01 && velAngle(0) === -127 && Math.abs(rpmAngle(7000) - 124.6) < 1e-9, 'escalas');
  const TANQUE = 60, RESERVA = 7; // litros

  const n1 = v => (+v).toFixed(1);
  const tick = (cx, cy, a, r1, r2, w, cls = '') => { const [x1, y1] = P(cx, cy, r1, a), [x2, y2] = P(cx, cy, r2, a); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"${cls && ` class="${cls}"`}/>`; };
  const dot = (cx, cy, a, r, rr) => { const [x, y] = P(cx, cy, r, a); return `<circle class="dot" cx="${x}" cy="${y}" r="${rr}"/>`; };
  const text = (x, y, txt, cls = '') => `<text x="${n1(x)}" y="${n1(y)}"${cls && ` class="${cls}"`}>${txt}</text>`;
  // bloco colorido de fim de escala, girado na direção do eixo
  const bloco = (cx, cy, a, r, w, h, cls) => { const [x, y] = P(cx, cy, r, a); return `<rect class="${cls}" x="${n1(x - w / 2)}" y="${n1(y - h / 2)}" width="${w}" height="${h}" rx="1" transform="rotate(${n1(a)} ${x} ${y})"/>`; };

  // ---- mostradores grandes ----
  const T_IN = 118, T_OUT = 140, T_MEIO = 128; // traço grande (colorido, em cunha) de 118 a 140; traço pequeno (branco) de 128 a 140
  // números: no máximo a 104 do centro, na direção do traço, recuados o necessário para a caixa do número ficar a 4 px do começo
  // do traço (Arial a 22 px: 12,2 px por algarismo, 15,8 px de altura)
  const num = (g, a, txt) => {
    const s = Math.abs(Math.sin(a * RAD)), c = Math.abs(Math.cos(a * RAD)), w = String(txt).length * 12.2;
    return text(...P(g.cx, g.cy, Math.min(104, T_IN - 4 - (s * w + c * 15.8) / 2), a), txt);
  };
  // traço grande do painel verdadeiro: cunha amarela, fina por dentro e larga por fora
  const cunha = (g, a, cls) => { const f = (r, w) => [P(g.cx, g.cy, r, a - w / r / RAD / 2), P(g.cx, g.cy, r, a + w / r / RAD / 2)];
    const [[x1, y1], [x2, y2]] = f(T_IN, 2.6), [[x3, y3], [x4, y4]] = f(T_OUT, 7); return `<path class="${cls}" d="M${x1},${y1}L${x3},${y3}L${x4},${y4}L${x2},${y2}Z"/>`; };
  const face = g => `<path class="face" d="M${n1(g.cx - Math.sqrt(g.r ** 2 - CORTE ** 2))},${g.cy + CORTE}A${g.r},${g.r} 0 1 1 ${n1(g.cx + Math.sqrt(g.r ** 2 - CORTE ** 2))},${g.cy + CORTE}Z"/>`;
  const furos = g => [-57, 56].map(dx => `<circle class="furo" cx="${n1(g.cx + dx)}" cy="${n1(g.cy + 2)}" r="4.5"/>`).join('');
  // ponteiro claro e fino, com um toco além do eixo; o cubo redondo fica por cima
  const ponteiro = (id, g, len, cubo) => `<g transform="translate(${g.cx},${g.cy})"><path id="${id}" class="needle" d="M-1.6,${-len}L1.6,${-len}L3.2,0L3,19L-3,19L-3.2,0Z"/><circle class="cubo" r="${cubo}"/></g>`;

  // ---- hodômetro de tambores (algarismos brancos em fundo preto; o décimo do parcial em tambor claro) ----
  function drum(id, cx, cy, n, W, H, tenth) {
    let s = `<g id="${id}" data-h="${H}"><rect class="dwin" x="${n1(cx - n * W / 2 - 2)}" y="${n1(cy - H / 2 - 1.5)}" width="${n * W + 4}" height="${H + 3}" rx="1.5"/>`;
    for (let i = 0; i < n; i++) {
      s += `<svg x="${n1(cx - n * W / 2 + i * W)}" y="${n1(cy - H / 2)}" width="${W}" height="${H}"${tenth && i === n - 1 ? ' class="tenth"' : ''}>${tenth && i === n - 1 ? `<rect x="2" width="${W - 4}" height="${H}"/>` : ''}<g class="strip">`;
      for (let k = 0; k <= 10; k++) s += `<text x="${W / 2}" y="${n1(H / 2 + 5.4 - k * H)}">${k % 10}</text>`; // próximo algarismo acima: gira para baixo
      s += '</g></svg>';
    }
    return s + '</g>';
  }
  // posição (0..10) do tambor i (0 = menos significativo): o último gira contínuo, os outros só na virada do de baixo
  function drumPos(value, i) {
    if (i === 0) return value % 10;
    const p = 10 ** i, d = Math.floor(value / p) % 10;
    return d + Math.max(0, value % p - (p - 1));
  }
  console.assert(drumPos(9.5, 0) === 9.5 && drumPos(9.5, 1) === 0.5 && drumPos(199.5, 2) === 1.5 && drumPos(123, 2) === 1, 'drumPos');
  function setDrum(id, value) {
    const strips = $(id).querySelectorAll('.strip'), n = strips.length, H = $(id).dataset.h;
    strips.forEach((s, j) => s.setAttribute('transform', `translate(0,${(drumPos(value, n - 1 - j) * H).toFixed(2)})`));
  }

  // ---- luzes-espia: id -> [rótulo, cor, símbolo] ----
  // símbolos decalcados por programa da tabela de símbolos que o Bryan mandou (iguais aos do painel), centrados na origem
  const SIMB = {
    alto: 'M-0.5,-8.7L-1.5,-8.6L-2.0,-8.3L-2.2,-7.4L-2.5,-6.9L-3.0,-4.4L-3.3,-0.9L-3.0,3.7L-2.6,5.5L-2.5,6.6L-1.9,8.3L-1.7,8.6L-1.2,8.7L3.2,8.6L5.5,8.2L6.9,7.7L7.6,7.3L8.2,7.1L9.9,5.7L10.6,4.9L10.9,4.7L11.4,3.8L11.8,3.4L12.2,2.4L12.5,0.8L12.6,-0.4L12.3,-2.3L12.0,-2.8L11.9,-3.4L11.5,-3.8L11.4,-4.2L10.8,-5.0L9.0,-6.7L8.6,-6.8L8.2,-7.2L7.6,-7.4L6.2,-8.1L4.6,-8.4L4.0,-8.6ZM-12.4,-7.8L-12.6,-7.7L-12.7,-7.4L-12.7,-6.1L-12.5,-5.8L-12.2,-5.7L-7.9,-5.8L-4.8,-5.8L-4.3,-6.1L-4.1,-7.1L-3.8,-7.6L-4.0,-7.8L-4.4,-7.9ZM0.4,-6.2L-0.0,-6.1L-0.4,-5.4L-0.9,-2.6L-1.1,-0.6L-1.0,1.6L-0.9,3.1L-0.3,5.9L0.0,6.2L0.2,6.3L2.9,6.3L4.1,6.1L4.6,5.8L5.4,5.7L6.4,5.2L7.8,4.2L8.8,3.2L9.3,2.4L9.7,1.1L9.9,-0.1L9.4,-2.2L8.8,-3.2L8.2,-3.9L6.6,-5.1L5.6,-5.6L4.1,-6.1L3.2,-6.2ZM-12.4,-4.7L-12.7,-4.4L-12.6,-2.7L-12.6,-2.4L-12.2,-2.3L-8.0,-2.4L-5.4,-2.3L-5.1,-2.4L-4.7,-3.1L-4.6,-4.4L-4.8,-4.6L-5.0,-4.7ZM-7.6,-0.9L-12.4,-0.9L-12.6,-0.7L-12.7,-0.4L-12.6,1.1L-12.4,1.3L-12.0,1.3L-5.2,1.3L-5.0,0.9L-4.9,-0.2L-5.0,-0.6L-5.2,-0.9L-6.8,-0.9L-7.2,-1.0ZM-12.4,2.8L-12.6,3.2L-12.6,4.4L-12.5,4.9L-12.2,5.1L-11.5,5.0L-5.9,4.9L-5.0,5.1L-4.8,5.0L-4.6,4.7L-4.7,3.2L-4.9,2.9L-5.2,2.7ZM-12.4,6.2L-12.6,6.6L-12.6,7.8L-12.5,8.2L-12.2,8.4L-4.4,8.4L-4.0,8.3L-3.8,8.1L-4.1,6.5L-4.2,6.3L-4.5,6.2L-5.2,6.1Z',
    seta: 'M-5.5,-5.3L-6.0,-5.1L-6.9,-4.4L-8.1,-3.6L-8.5,-3.3L-9.0,-3.0L-12.1,-0.8L-12.6,-0.5L-13.0,0.0L-12.9,0.2L-12.1,0.7L-10.8,1.7L-10.3,1.9L-10.0,2.2L-5.5,5.2L-5.3,5.1L-5.2,4.9L-5.2,3.2L-5.0,2.9L-1.5,2.9L-1.0,2.6L-0.8,2.0L-0.9,-2.4L-1.0,-2.8L-1.2,-3.0L-1.5,-3.1L-5.0,-3.2L-5.2,-3.4L-5.2,-3.6L-5.2,-5.0L-5.4,-5.2ZM5.5,-5.3L5.1,-5.0L5.1,-3.5L4.9,-3.2L4.5,-3.1L1.2,-3.1L1.0,-3.0L0.9,-2.4L0.9,2.6L1.1,2.8L1.6,3.0L4.7,3.0L5.1,3.5L5.1,4.6L5.2,4.9L5.5,5.1L8.0,3.4L8.5,3.1L9.7,2.2L10.0,2.0L12.1,0.6L12.8,0.1L12.9,-0.1L12.8,-0.5L12.6,-0.6L11.5,-1.3L11.1,-1.6L9.9,-2.2L8.9,-3.0L8.4,-3.3L8.1,-3.6L7.5,-3.8L7.2,-4.1L6.1,-4.7L5.8,-5.2ZM-7.0,-2.4L-8.6,-1.2L-9.7,-0.6L-10.2,-0.1L-10.2,0.1L-10.1,0.2L-8.2,1.4L-8.0,1.6L-7.0,2.3L-6.8,2.1L-6.5,1.7L-6.2,1.5L-3.1,1.5L-2.8,1.3L-2.6,1.0L-2.6,-0.6L-2.7,-1.1L-2.9,-1.5L-6.4,-1.5L-6.6,-1.6L-6.8,-2.2ZM6.8,-2.3L6.2,-1.6L6.0,-1.4L3.2,-1.5L2.9,-1.3L2.6,-0.9L2.6,0.9L2.7,1.2L3.1,1.5L6.1,1.4L6.4,1.6L6.5,2.1L6.9,2.2L7.2,2.1L8.7,1.0L9.2,0.7L9.9,0.2L10.1,0.0L9.9,-0.5L9.4,-0.8L7.2,-2.2Z',
    bomba: 'M-8.8,-12.6L-9.2,-12.4L-9.8,-12.0L-10.2,-11.2L-10.3,-10.8L-10.2,10.2L-10.5,10.6L-11.0,10.7L-11.6,10.6L-11.9,10.8L-12.1,11.2L-12.0,12.2L-11.6,12.5L-10.8,12.6L-7.4,12.5L4.2,12.5L4.6,12.4L4.8,12.0L4.7,11.0L4.6,10.6L4.4,10.5L3.1,10.4L2.9,10.3L2.8,10.1L2.9,9.6L2.8,8.9L2.9,7.4L2.8,-0.1L2.9,-0.5L3.4,-0.9L3.6,-0.7L4.1,0.2L4.1,4.2L4.2,7.5L4.3,7.8L4.6,8.2L4.9,9.1L5.4,9.8L6.2,10.3L6.8,10.5L8.6,10.4L10.1,9.8L10.6,9.2L11.2,8.4L11.5,6.1L11.1,2.6L10.5,-1.1L10.5,-1.8L10.3,-2.4L10.4,-3.2L10.8,-4.1L11.5,-4.6L12.0,-5.2L11.8,-5.8L11.6,-6.4L11.1,-7.5L10.1,-9.0L8.6,-10.5L7.5,-11.4L6.9,-11.7L6.6,-12.0L5.5,-12.6L5.0,-12.5L4.7,-12.2L4.8,-10.8L5.3,-10.4L6.1,-9.5L7.1,-8.0L7.6,-6.7L7.8,-5.8L8.0,-5.2L8.0,-3.4L8.3,0.1L8.6,1.1L8.7,2.2L9.1,4.0L9.3,6.2L9.1,7.2L8.9,7.7L8.0,8.1L7.5,8.1L6.8,7.8L6.4,6.6L6.2,4.8L6.2,-0.4L5.8,-1.9L5.5,-2.4L4.8,-3.0L4.0,-3.2L3.5,-3.5L3.0,-3.5L2.8,-3.8L2.8,-10.8L2.7,-11.4L2.5,-11.9L2.0,-12.4L1.5,-12.7L1.1,-12.7L-7.0,-12.7L-8.4,-12.7ZM-6.9,-10.9L-7.7,-10.5L-8.0,-10.1L-8.0,-4.4L-7.6,-3.6L-6.5,-3.2L-5.5,-3.3L-1.5,-3.2L-0.5,-3.3L0.1,-3.5L0.5,-3.7L0.7,-4.2L0.8,-5.0L0.8,-9.8L0.5,-10.5L0.0,-10.9L-0.2,-10.9Z',
    temp: 'M1.1,-10.8L0.6,-10.6L-0.8,-9.7L-1.0,-9.4L-1.0,1.8L-1.1,2.1L-1.5,2.6L-2.0,3.0L-2.4,3.9L-2.5,4.5L-2.5,5.1L-2.3,5.6L-1.7,6.6L-0.7,7.2L-0.1,7.3L0.8,7.2L1.7,6.7L2.3,6.0L2.5,5.6L2.6,4.6L2.5,3.8L2.3,3.4L1.6,2.5L1.5,2.1L1.5,0.5L1.8,0.3L3.3,0.4L3.8,0.5L4.7,0.3L5.0,0.1L5.1,-0.4L5.0,-0.8L4.7,-1.0L3.8,-1.2L1.8,-1.1L1.6,-1.2L1.5,-1.4L1.4,-2.8L1.6,-3.1L1.8,-3.2L2.3,-3.1L4.7,-3.2L5.0,-3.4L5.1,-3.9L5.0,-4.2L4.7,-4.5L3.7,-4.6L1.8,-4.6L1.6,-4.7L1.4,-5.0L1.4,-7.0L1.6,-7.1L1.8,-7.2L3.3,-7.2L4.7,-7.3L4.9,-7.4L5.1,-7.9L4.9,-8.4L4.6,-8.6L3.8,-8.7L1.8,-8.6L1.6,-8.7L1.5,-9.0L1.5,-10.5L1.3,-10.8ZM9.6,2.5L8.3,2.9L7.3,3.7L6.3,4.1L4.3,4.4L4.2,4.5L4.1,4.9L4.1,5.6L4.3,5.8L4.7,5.9L6.3,5.8L7.4,5.3L8.5,4.5L9.3,4.3L10.6,4.4L11.7,5.1L12.1,5.3L12.3,5.3L12.5,5.0L12.5,4.6L12.1,3.5L11.2,2.9ZM-10.4,2.8L-11.8,3.4L-12.5,3.9L-12.6,4.2L-12.5,5.0L-12.3,5.3L-11.9,5.2L-10.3,4.4L-9.7,4.3L-8.8,4.4L-8.4,4.8L-7.8,4.9L-7.3,5.2L-6.2,5.6L-4.7,5.8L-4.4,5.6L-4.1,5.2L-4.1,5.0L-4.2,4.6L-4.6,4.3L-5.8,4.2L-8.6,2.8ZM9.9,7.6L7.8,8.7L6.6,8.8L6.1,8.8L4.5,7.9L3.4,7.7L2.5,7.9L1.1,8.7L0.2,9.0L-0.8,9.0L-2.9,8.0L-3.7,7.9L-4.7,7.9L-6.1,8.4L-6.7,8.7L-7.2,8.7L-7.7,8.6L-8.3,8.3L-9.1,8.1L-9.7,7.8L-10.7,7.7L-10.9,7.8L-11.1,8.0L-11.2,8.5L-11.1,8.9L-10.8,9.2L-9.7,9.5L-8.2,10.2L-7.7,10.3L-6.6,10.3L-4.7,9.5L-3.8,9.4L-2.4,9.9L-1.9,10.3L-0.2,10.5L1.4,10.3L2.1,9.9L3.4,9.5L3.8,9.5L5.9,10.5L6.4,10.7L7.9,10.2L9.9,9.2L10.3,8.8L10.4,8.2L10.3,7.7Z',
    oleo: 'M-11.1,-4.8L-11.5,-4.0L-11.7,-2.9L-11.9,-2.4L-11.9,-1.9L-12.1,-1.5L-12.0,-1.0L-11.6,-0.7L-8.2,0.5L-7.7,0.9L-7.6,1.1L-7.5,2.0L-7.6,4.1L-7.4,4.5L-6.9,4.6L-5.9,4.7L2.0,4.6L2.9,4.5L3.5,4.4L3.8,4.2L4.5,3.2L6.8,0.8L6.9,0.5L9.5,-2.1L9.8,-2.2L10.4,-2.3L11.1,-2.1L11.6,-2.4L11.8,-3.0L11.8,-3.4L11.6,-3.6L11.0,-3.9L10.1,-3.9L9.1,-3.6L8.5,-3.3L7.4,-3.1L6.6,-2.8L5.9,-2.6L2.0,-1.3L1.0,-1.8L0.5,-2.2L-1.9,-2.2L-2.1,-2.3L-2.3,-2.6L-2.1,-3.0L-1.9,-3.1L-1.4,-3.0L-0.7,-3.4L-0.9,-4.4L-1.1,-4.6L-3.6,-4.7L-5.1,-4.6L-5.4,-4.2L-5.6,-3.6L-5.5,-3.3L-5.0,-3.1L-4.2,-3.0L-3.9,-2.8L-3.8,-2.5L-3.9,-2.3L-4.0,-2.2L-5.2,-2.2L-5.5,-2.2L-5.8,-2.4L-6.3,-3.1L-7.2,-3.6L-7.8,-3.8L-8.5,-4.0L-9.3,-4.2L-9.9,-4.6L-10.5,-4.7L-10.9,-4.9ZM-10.2,-3.0L-10.5,-2.8L-10.6,-2.1L-10.6,-1.9L-10.4,-1.6L-8.0,-0.7L-7.6,-0.9L-7.5,-1.9L-7.6,-2.1L-8.9,-2.7L-9.5,-2.8L-9.9,-3.1ZM-3.0,-0.6L-5.5,-0.6L-6.0,-0.2L-6.1,0.1L-6.0,2.4L-5.8,2.8L-5.4,2.9L-4.9,2.8L2.5,2.8L3.1,2.3L4.3,1.0L5.7,-0.4L5.7,-0.5L5.5,-0.6L5.0,-0.6L4.0,-0.2L3.1,-0.0L2.6,0.3L1.4,0.5L1.0,0.4L0.5,0.0L-0.5,-0.7L-1.5,-0.7ZM11.0,-0.4L10.5,-0.1L10.2,0.6L9.9,1.0L9.7,2.4L9.7,2.8L10.0,3.4L10.2,3.6L10.8,3.7L11.1,3.7L11.6,3.4L11.8,3.1L12.0,2.6L11.7,1.4L11.4,0.6L11.2,-0.1L11.1,-0.3Z',
    bat: 'M5.2,-8.4L4.0,-8.4L3.8,-8.2L3.7,-8.1L3.7,-6.9L3.5,-6.6L3.4,-6.5L-2.6,-6.6L-4.5,-6.5L-4.6,-6.6L-4.8,-6.8L-4.8,-8.1L-5.0,-8.3L-5.5,-8.4L-8.4,-8.4L-8.6,-8.4L-8.9,-8.2L-8.9,-7.1L-9.0,-6.8L-9.2,-6.6L-12.1,-6.5L-12.6,-6.4L-12.8,-6.1L-12.8,4.9L-12.8,7.8L-12.6,8.2L-12.4,8.3L-12.0,8.4L-10.6,8.4L2.1,8.3L12.1,8.2L12.5,8.1L12.6,7.8L12.7,7.3L12.6,-5.9L12.6,-6.4L12.4,-6.6L12.2,-6.7L8.5,-6.7L8.2,-6.9L8.2,-8.1L8.0,-8.3L7.9,-8.4L7.5,-8.5L6.9,-8.4ZM4.9,-4.9L2.5,-4.8L-10.4,-4.8L-10.7,-4.7L-11.0,-4.2L-11.0,-2.6L-10.9,4.8L-11.0,5.6L-10.9,5.9L-10.8,6.4L-10.5,6.5L-8.9,6.5L-6.9,6.4L2.9,6.5L6.0,6.3L7.5,6.5L8.9,6.3L9.5,6.4L9.9,6.3L10.5,6.4L10.8,5.8L10.8,-2.1L10.7,-4.7L10.4,-4.9L5.5,-4.9ZM5.5,-2.7L5.3,-2.6L5.2,-2.3L5.2,-1.2L5.1,-0.9L4.9,-0.7L3.4,-0.7L3.2,-0.2L3.1,0.8L3.2,1.0L3.5,1.2L4.9,1.2L5.1,1.3L5.2,2.8L5.4,3.1L6.9,3.3L7.1,3.1L7.2,2.8L7.2,1.3L7.5,1.1L9.0,1.1L9.2,0.8L9.1,-0.3L9.0,-0.5L8.8,-0.7L7.6,-0.7L7.3,-0.8L7.2,-1.1L7.1,-2.3L7.0,-2.7L6.4,-2.8ZM-8.0,-0.7L-9.1,-0.7L-9.7,-0.3L-9.8,-0.1L-9.7,0.3L-9.7,0.8L-9.6,1.0L-9.4,1.1L-8.9,1.2L-4.5,1.2L-3.9,1.1L-3.6,0.8L-3.6,-0.2L-3.8,-0.5L-4.0,-0.7Z',
    freio: 'M-1.1,-9.4L-2.9,-9.0L-4.2,-8.4L-4.6,-8.1L-5.1,-7.9L-6.3,-7.0L-7.3,-6.0L-7.5,-5.6L-7.8,-5.4L-8.3,-4.6L-8.8,-3.6L-9.0,-2.6L-9.4,-1.9L-9.4,1.5L-8.8,3.5L-8.3,4.6L-7.4,5.9L-7.1,6.1L-6.9,6.5L-5.5,7.8L-5.0,8.0L-4.6,8.3L-3.6,8.8L-2.1,9.1L0.4,9.3L3.8,8.7L4.4,8.3L4.7,8.0L5.1,7.8L6.4,6.9L7.5,5.5L8.5,3.9L9.0,2.5L9.3,-0.2L9.2,-1.5L8.9,-2.6L8.5,-3.8L8.0,-4.8L7.4,-5.6L6.8,-6.4L5.2,-7.6L5.0,-7.9L4.5,-8.1L4.1,-8.4L2.8,-9.0L0.9,-9.4ZM8.1,-9.1L7.0,-8.5L6.8,-8.2L7.2,-7.6L7.9,-7.0L8.5,-6.2L9.0,-5.4L10.0,-3.5L10.2,-2.5L10.5,-1.8L10.6,-0.1L10.5,1.9L10.1,2.9L10.0,3.6L9.7,4.1L9.5,4.7L9.2,5.1L8.9,5.8L8.4,6.5L7.4,7.7L6.9,8.1L7.0,8.4L7.2,8.6L8.4,9.2L8.9,8.9L9.6,8.2L10.4,7.1L10.7,6.6L11.0,6.2L11.2,5.8L11.5,5.3L12.4,2.6L12.6,0.8L12.6,-0.8L12.4,-2.4L11.9,-4.0L11.4,-5.2L10.4,-7.0L9.7,-7.9L9.4,-8.4L8.8,-9.1L8.4,-9.2ZM-8.8,-9.0L-9.4,-8.5L-10.3,-7.4L-11.3,-5.6L-11.8,-4.5L-12.4,-2.6L-12.6,0.6L-12.4,2.9L-11.9,4.4L-11.4,5.7L-11.1,6.1L-10.5,7.2L-10.1,7.6L-9.8,8.2L-9.0,8.9L-8.2,9.3L-7.1,8.4L-7.0,8.1L-8.2,6.9L-8.5,6.5L-8.8,6.2L-9.6,4.6L-9.8,4.2L-10.0,3.6L-10.3,3.1L-10.7,0.6L-10.5,-1.9L-10.2,-3.0L-9.8,-4.2L-9.2,-5.3L-7.8,-7.4L-7.4,-7.7L-7.1,-8.2L-7.1,-8.4L-8.1,-9.1ZM-1.5,-7.0L-2.1,-6.7L-3.0,-6.5L-3.6,-6.1L-4.1,-5.9L-5.2,-4.9L-6.4,-3.4L-6.6,-2.6L-7.0,-1.8L-7.0,-0.2L-6.9,2.0L-6.6,2.6L-6.4,3.4L-6.1,3.8L-5.9,4.3L-5.1,5.0L-4.9,5.4L-3.6,6.3L-2.3,6.9L-0.6,7.2L0.6,7.2L2.2,6.9L2.8,6.5L3.4,6.3L3.6,6.1L4.2,5.8L5.5,4.5L5.8,4.0L6.0,3.8L6.5,2.8L7.0,1.2L7.0,-0.2L6.9,-1.5L6.5,-2.8L5.9,-3.9L5.0,-4.9L3.9,-5.9L2.9,-6.5L1.2,-7.0L-0.2,-7.1ZM-0.9,-5.6L-1.2,-5.4L-1.4,-5.1L-1.3,2.6L-1.2,2.8L-0.9,2.9L1.0,2.9L1.2,2.8L1.3,2.5L1.3,-5.2L1.1,-5.5L0.9,-5.6ZM-0.4,3.4L-0.8,3.6L-1.0,3.9L-1.2,4.6L-0.8,5.4L-0.1,5.7L0.5,5.5L0.9,5.2L1.1,4.8L1.1,4.2L1.0,4.0L0.4,3.5L0.0,3.4Z',
    inj: 'M-4.7,-8.8L-4.9,-8.6L-5.1,-8.2L-5.1,-7.5L-4.9,-7.2L-4.3,-7.1L-2.6,-7.0L-2.2,-6.9L-2.2,-6.6L-2.7,-6.5L-4.6,-6.4L-5.3,-5.9L-6.3,-5.0L-7.7,-4.8L-8.6,-4.4L-9.1,-3.8L-9.2,-2.2L-9.1,-1.5L-9.3,-1.0L-9.8,-1.0L-10.1,-1.1L-10.1,-1.2L-10.2,-3.9L-10.1,-4.6L-10.2,-4.9L-10.4,-5.0L-10.9,-4.9L-12.0,-4.1L-12.2,-3.6L-12.2,-0.2L-12.1,0.0L-11.6,0.5L-11.5,0.8L-11.4,3.8L-11.3,4.2L-11.1,4.6L-10.4,4.9L-10.2,4.6L-10.2,1.2L-10.1,0.9L-9.7,0.8L-9.3,1.0L-9.2,1.2L-9.2,3.9L-9.1,4.6L-9.0,4.9L-8.5,5.4L-8.3,5.5L-7.3,5.8L-5.1,5.9L-4.3,6.1L-3.7,6.7L-2.9,7.7L-1.7,8.5L-0.7,8.7L5.1,8.7L6.3,8.6L6.7,8.4L7.1,7.9L7.2,6.2L7.4,5.9L7.7,5.8L7.8,5.9L8.0,6.1L7.9,6.9L8.0,7.4L8.3,7.7L8.7,7.8L10.1,7.8L10.7,7.7L10.9,7.5L11.3,6.9L12.1,3.9L12.1,0.0L11.2,-3.4L10.8,-4.2L10.6,-4.4L10.2,-4.3L9.7,-4.4L9.1,-4.3L8.3,-4.4L8.1,-4.3L7.9,-3.8L7.9,-2.4L7.7,-2.1L7.4,-2.1L7.2,-2.4L7.1,-3.0L7.2,-3.8L6.9,-4.2L6.6,-4.3L6.1,-4.3L5.2,-4.3L4.3,-4.6L4.1,-4.8L3.2,-6.3L2.7,-6.5L1.8,-6.6L1.6,-6.8L1.7,-7.0L2.1,-7.2L3.4,-7.1L3.8,-7.2L4.1,-7.6L4.3,-8.1L4.2,-8.5L3.9,-8.8L3.6,-8.9ZM-2.3,-4.9L-3.3,-4.9L-3.9,-4.8L-4.6,-4.4L-5.1,-3.6L-5.7,-3.1L-6.1,-3.0L-7.1,-2.9L-7.4,-2.8L-7.5,-2.1L-7.5,3.2L-7.4,3.5L-7.2,3.9L-6.8,4.0L-4.8,4.0L-3.9,4.2L-2.8,5.1L-2.5,5.6L-2.1,6.1L-1.4,6.6L-0.7,6.9L0.1,7.0L3.2,7.0L5.1,7.0L5.4,6.8L5.6,6.2L5.5,4.4L5.8,4.0L6.2,3.9L8.7,3.9L9.1,4.1L9.2,4.4L9.2,5.4L9.3,6.6L9.6,6.9L9.8,6.8L10.1,6.2L10.3,5.5L10.5,3.8L10.5,-0.2L10.2,-2.0L9.8,-2.9L9.6,-3.0L9.3,-2.8L9.2,-1.2L9.1,-0.8L8.9,-0.6L8.6,-0.5L7.7,-0.5L6.1,-0.5L5.7,-0.6L5.5,-1.0L5.6,-2.1L5.4,-2.6L5.1,-2.8L4.2,-2.8L3.4,-2.9L3.2,-3.1L2.6,-3.8L2.3,-4.4L1.6,-4.8L1.1,-4.9ZM-0.4,-4.5L-1.0,-3.4L-1.2,-2.6L-1.5,-2.1L-2.3,0.0L-2.6,0.4L-2.8,1.1L-3.1,1.6L-3.2,2.2L-3.1,2.4L-2.8,2.4L-1.7,1.7L-0.8,1.4L-0.7,2.2L-1.0,3.0L-1.1,4.2L-1.0,4.8L-1.2,5.6L-1.1,6.1L-0.8,6.2L-0.5,6.0L-0.2,5.5L0.5,3.8L0.8,3.4L1.4,1.8L1.8,1.2L2.0,0.5L2.5,-0.8L2.8,-1.1L2.7,-1.4L2.3,-1.4L0.8,-0.5L0.1,-0.3L-0.2,-0.4L-0.3,-0.9L-0.1,-1.6L-0.1,-3.2L0.0,-3.8L-0.2,-4.4Z',
  };
  const T = k => `<path class="tr" fill-rule="evenodd" d="${SIMB[k]}"/>`;
  const R = '#ff3b30';
  const LAMPS = {
    inj: ['Injeção (EFI)', '#ffae1a', T('inj')],
    seta: ['Setas', '#3ddc84', T('seta')],
    alto: ['Farol alto', '#2f96ff', T('alto')],
    freio: ['Freio', R, T('freio')],
    temp: ['Temperatura', R, T('temp')],
    oleo: ['Óleo', R, T('oleo')],
    bat: ['Bateria', R, T('bat')],
  };
  // janela: quem acende é o fundo; o símbolo fica escuro por cima (como no painel aceso). k = escala do símbolo; 0 = janela lisa
  const lamp = (id, x, y, w, h, k) => id
    ? `<g id="i_${id}" class="lamp${id === 'seta' ? ' blink' : ''}" style="--c:${LAMPS[id][1]}"><rect class="bg" x="${n1(x)}" y="${n1(y)}" width="${w}" height="${h}" rx="2"/>` +
      (k ? `<g class="sym" transform="translate(${n1(x + w / 2)},${n1(y + h / 2)}) scale(${k})">${LAMPS[id][2]}</g>` : '') + '</g>'
    : `<rect class="jan" x="${n1(x)}" y="${n1(y)}" width="${w}" height="${h}" rx="2"/>`;
  // faixas embaixo dos mostradores grandes (medidas na foto): à esquerda a 3ª janela dá lugar ao botão de zerar o parcial
  const FAIXA_Y = 407, FAIXA_H = 26;
  const ESQ = [[157, 'inj'], [223, null], [288, null], [353, null], [418, 'seta']], DIR = [[735, 'alto'], [799, 'freio'], [863, 'temp'], [927, 'oleo'], [991, null]];

  // símbolos impressos no miolo, na cor das marcas: os mesmos da tabela
  const impresso = k => `<path class="icf" fill-rule="evenodd" d="${SIMB[k]}"/>`;
  const BATERIA = impresso('bat'), TERMO = impresso('temp'), BOMBA = impresso('bomba'), LATA = impresso('oleo');

  // ---- peças (cada uma desenhada em volta da própria origem; `place` decide onde e em que escala) ----
  function pecas(versao) {
    const spd = () => {
      let m = '';
      // traço grande amarelo a cada 20 e pequeno branco a cada 10, como no verdadeiro
      for (let v = 20; v <= 220; v += 20) m += cunha(SPD, velAngle(v), 'grande') + num(SPD, velAngle(v), v);
      for (let v = 30; v <= 210; v += 20) m += tick(SPD.cx, SPD.cy, velAngle(v), T_MEIO, T_OUT, 2.4);
      m += text(SPD.cx, SPD.cy + 77.5, 'km/h', 's') + text(SPD.cx, SPD.cy + 89.5, 'W·1094', 'xs');
      return face(SPD) + furos(SPD) + `<g class="marks">${m}</g>` +
        `<g class="drum">${drum('odo', SPD.cx, SPD.cy - 40.5, 6, 22.5, 18, true)}${drum('trip', SPD.cx, SPD.cy + 42, 4, 26, 18, true)}</g>` +
        ponteiro('nVel', SPD, 133, 17);
    };
    const tach = () => {
      let m = '';
      // traço grande amarelo a cada 1.000, pequeno branco a cada 200 e, de 6.000 a 7.000, traços vermelhos entre os brancos
      for (let v = 0; v <= 7; v++) m += cunha(TACH, rpmAngle(v * 1000), 'grande') + num(TACH, rpmAngle(v * 1000), v * 10);
      for (let r = 200; r < 7000; r += 200) if (r % 1000) m += tick(TACH.cx, TACH.cy, rpmAngle(r), T_MEIO, T_OUT, 2.2);
      for (let r = 6100; r < 7000; r += 200) m += tick(TACH.cx, TACH.cy, rpmAngle(r), T_MEIO - 3, T_OUT, 5, 'vermelho');
      m += text(TACH.cx, TACH.cy + 75, 'x100', 's') + text(TACH.cx, TACH.cy + 87, 'min⁻¹', 's');
      return face(TACH) + furos(TACH) + `<g class="marks">${m}</g>` + ponteiro('nRpm', TACH, 133, 18);
    };
    // quadro do miolo com mostrador de eixo escondido: o ponteiro só aparece dentro do quadro
    const quadro = (id, x0, x1, y0, y1, marcas, agulha) =>
      `<clipPath id="q_${id}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath>` +
      `<rect class="quadro" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="2"/><g class="marks">${marcas}</g><g clip-path="url(#q_${id})">${agulha}</g>`;
    const agulhaLado = (id, x, y, len) => `<g transform="translate(${x},${y})"><path id="${id}" class="needle" d="M-1.4,${-len}L1.4,${-len}L2.8,0L-2.8,0Z"/></g>`;
    const meio = COL.meio, e = EIXO;
    const escala = (x, y, ang, cores) => cores.map(([f, cls]) => cls === 'branco' ? tick(x, y, ang(f), RM - 6, RM + 2, 2.6) : cls.endsWith('B')
      ? bloco(x, y, ang(f), RM - 2, 8, 12, cls.slice(0, -1)) : tick(x, y, ang(f), RM - 12, RM + 2, 4.2, cls)).join('');
    const baixo = () => {
      const [y0, y1] = COL.baixo;
      // temperatura, como no verdadeiro: bloco vermelho no quente (em cima), traço branco, traço amarelo maior no meio, branco e
      // bloco amarelo no frio (embaixo)
      const temp = escala(e.esq, e.baixo, tempAngle, [[127, 'vermelhoB'], [110, 'branco'], [90, 'amarelo'], [70, 'branco'], [53, 'amareloB']]) +
        `<g transform="translate(${COL.x0 + 15},${y0 + 14}) scale(.64)">${TERMO}</g>`;
      // combustível: bloco amarelo no cheio, branco, amarelo maior no meio, branco e bloco vermelho da reserva embaixo
      const comb = escala(e.dir, e.baixo, combAngle, [[.96, 'amareloB'], [.75, 'branco'], [.5, 'amarelo'], [.25, 'branco'], [.05, 'vermelhoB']]) +
        `<g id="pump" transform="translate(${COL.x1 - 13},${y0 + 15}) scale(.54)">${BOMBA}</g>`;
      return quadro('temp', COL.x0, meio - 1, y0, y1, temp, agulhaLado('nTemp', e.esq, e.baixo, 96)) + quadro('comb', meio + 1, COL.x1, y0, y1, comb, agulhaLado('nComb', e.dir, e.baixo, 96));
    };
    const topo = () => {
      const [y0, y1] = COL.topo;
      if (versao === 'bateria') // só a luz de carga: símbolo impresso e, embaixo dele, a janela que acende em vermelho
        return `<rect class="quadro" x="${COL.x0}" y="${y0}" width="${COL.x1 - COL.x0}" height="${y1 - y0}" rx="2"/><g class="marks"><g transform="translate(${meio},${y0 + 46}) scale(1.08)">${BATERIA}</g></g>` +
          lamp('bat', meio - 19.5, y0 + 64, 39, 25, 0); // janela lisa: o símbolo é o impresso em cima
      // completa: voltímetro à esquerda (bateria) e pressão do óleo à direita; a luz de carga vira uma fenda pequena no voltímetro
      // completa (sem foto do verdadeiro): voltímetro e óleo no mesmo estilo dos mostradores de baixo
      const volt = escala(e.esq, e.topo, voltAngle, [[15.7, 'vermelhoB'], [14.5, 'branco'], [13, 'amarelo'], [11.5, 'branco'], [10.3, 'vermelhoB']]) +
        `<g transform="translate(${COL.x0 + 17},${y0 + 32}) scale(.8)">${BATERIA}</g>`;
      const oleo = escala(e.dir, e.topo, oleoAngle, [[.25, 'vermelhoB'], [1.5, 'branco'], [2.5, 'amarelo'], [3.5, 'branco'], [4.75, 'amareloB']]) +
        `<g transform="translate(${COL.x1 - 20},${y0 + 33}) scale(.75)">${LATA}</g>`;
      return quadro('volt', COL.x0, meio - 1, y0, y1, volt, agulhaLado('nVolt', e.esq, e.topo, 96)) + quadro('oleoP', meio + 1, COL.x1, y0, y1, oleo, agulhaLado('nOleo', e.dir, e.topo, 96)) +
        lamp('bat', meio - 13, y1 - 30, 9, 26, 0); // fenda lisa, sem símbolo (foto 4)
    };
    const faixaE = () => ESQ.map(([x, id]) => lamp(id, x, FAIXA_Y, id === 'inj' ? 55 : 50, FAIXA_H, .9)).join('') +
      // pino de zerar o parcial: cilindro visto de frente, uma bolinha logo embaixo do centro do velocímetro
      `<g id="knob" tabindex="0" role="button" aria-label="Zerar hodômetro parcial"><circle cx="317.2" cy="396" r="8" fill="url(#kPino)" stroke="#0b0c0d" stroke-width="1"/>` +
      `<circle cx="315" cy="393.6" r="2.3" fill="#6a6f75" opacity=".7"/></g>`;
    const faixaD = () => DIR.map(([x, id]) => lamp(id, x, FAIXA_Y, 50, FAIXA_H, .9)).join('');
    return { spd, tach, topo, baixo, faixaE, faixaD };
  }
  // origem de cada peça (para `place`): o centro do mostrador, o meio de cada quadro do miolo, o meio de cada faixa
  const ORIGEM = { spd: [SPD.cx, SPD.cy], tach: [TACH.cx, TACH.cy], topo: [COL.meio, 197.5], baixo: [COL.meio, 356], faixaE: [313, 420], faixaD: [888, 420] };

  const DEFS = `<defs>
    <linearGradient id="kFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#454b50"/><stop offset="1" stop-color="#393e43"/></linearGradient>
    <radialGradient id="kCubo" cx=".4" cy=".35"><stop offset="0" stop-color="#3a3e43"/><stop offset=".8" stop-color="#1b1d20"/><stop offset="1" stop-color="#2a2d31"/></radialGradient>
    <radialGradient id="kPino" cx=".4" cy=".35"><stop offset="0" stop-color="#3c4045"/><stop offset=".75" stop-color="#151618"/><stop offset="1" stop-color="#202225"/></radialGradient>
  </defs>`;

  const CONTROLS = `<div>
    <label>RPM <input id="rpm" type="range" min="0" max="7000" step="50" value="0"><output id="rpmO"></output></label>
    <div class="vel"><label>Velocidade <input id="vel" type="range" min="0" max="220" step="1" value="0"><output id="velO"></output></label>
      <label><input id="semLimite" type="checkbox"> Desbloquear limite de velocidade</label></div>
    <label>Combustível <input id="comb" type="range" min="0" max="${TANQUE}" value="0"><output id="combO"></output></label>
    <label>Temperatura <input id="temp" type="range" min="50" max="130" value="50"><output id="tempO"></output></label>
    <label class="soCompleta">Bateria <input id="volt" type="range" min="0" max="16" step=".1" value="0"><output id="voltO"></output></label>
    <label class="soCompleta">Óleo <input id="pOleo" type="range" min="0" max="5" step=".1" value="0"><output id="pOleoO"></output></label>
    <label>Tempo <select id="mult"><option value="1" selected>1× (real)</option><option value="20">20×</option><option value="200">200×</option></select></label>
    <label>Miolo central <select id="versao"><option value="bateria">Só luz de bateria</option><option value="completa">Completo (voltímetro e óleo)</option></select></label>
    <button id="reset">Zerar parcial</button>
  </div>
  <div id="luzes"><button id="luz" aria-pressed="false">💡 Iluminação</button><button id="todas">Todas as luzes</button></div>`;

  // Kadett GLS 2.0 MPFI 1998 para o teclado e o controle. Potência, torque, peso, pneus, entre-eixos e aerodinâmica são da ficha
  // técnica; as rotações de potência e torque máximos, o corte e as relações do câmbio e do diferencial não achei em fonte confiável
  // (motor da mesma família do Astra 2.0 8V: valores parecidos com os dele). Distribuição de peso, altura do centro de gravidade,
  // divisão dos freios e esterço são valores típicos de um hatch médio de tração dianteira, não medidos neste carro.
  const VEICULO = { cv: 110, rpmCv: 5600, kgfm: 17.6, rpmKgfm: 2800, rpmMax: 6300, lenta: 900, marchas: [3.55, 1.96, 1.30, .89, .71], re: 3.31, final: 3.94,
    pneu: [185, 65, 14], kg: 1050, cxA: .627, inercia: .16, tanque: TANQUE,
    entreEixos: 2.52, frente: .61, hcg: .52, tracao: 'D', freioDiant: .85, esterco: .6,
    chave: { ateLigar: ['bat', 'oleo', 'inj'], teste: [] } }; // luzes que o miolo da ignição comanda

  /**
   * Desenha o painel dentro de `target` (um <g> do SVG) e liga os controles em #ctl.
   * place: { spd|tach|topo|baixo|faixaE|faixaD: [x, y, escala] } = onde fica a origem de cada peça (padrão: posição da foto)
   */
  function build({ target, place = {} }) {
    const root = target.ownerSVGElement;
    root.insertAdjacentHTML('afterbegin', DEFS);
    let versao = 'bateria';
    try { versao = localStorage.kadettVersao === 'completa' ? 'completa' : 'bateria'; } catch (e) { }
    const desenha = () => {
      const p = pecas(versao);
      target.innerHTML = Object.keys(ORIGEM).map(k => {
        const [ox, oy] = ORIGEM[k], [x, y, s] = place[k] || [ox, oy, 1];
        return `<g transform="translate(${x},${y}) scale(${s}) translate(${-ox},${-oy})">${p[k]()}</g>`;
      }).join('');
      root.classList.toggle('completa', versao === 'completa');
    };
    desenha();

    // ---- controles ----
    $('ctl').innerHTML = CONTROLS;
    $('versao').value = versao;
    let lightBtns = [];
    const botoes = () => { // os botões das luzes seguem as janelas desenhadas; o estado de cada luz passa para a versão nova
      const acesas = lightBtns.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.luz);
      lightBtns.forEach(b => b.remove());
      lightBtns = Object.entries(LAMPS).filter(([id]) => $('i_' + id)).map(([id, [label, c]]) => {
        const b = document.createElement('button');
        b.textContent = label; b.dataset.luz = id; b.style.setProperty('--c', c); b.setAttribute('aria-pressed', false);
        b.set = on => b.setAttribute('aria-pressed', $('i_' + id).classList.toggle('on', on));
        b.onclick = () => b.set();
        $('todas').before(b);
        if (acesas.includes(id)) b.set(true);
        return b;
      });
    };
    botoes();
    $('todas').onclick = () => { const on = lightBtns.some(b => b.getAttribute('aria-pressed') === 'false'); lightBtns.forEach(b => b.set(on)); };
    $('luz').onclick = () => { const on = root.classList.toggle('lit'); document.body.classList.toggle('lit', on); $('luz').setAttribute('aria-pressed', on); };

    const rot = (id, a) => { if ($(id)) $(id).style.transform = `rotate(${a}deg)`; };
    const upd = () => {
      rot('nRpm', rpmAngle(+$('rpm').value)); rot('nVel', velAngle(+$('vel').value));
      rot('nComb', combAngle($('comb').value / TANQUE)); rot('nTemp', tempAngle(+$('temp').value));
      rot('nVolt', voltAngle(+$('volt').value)); rot('nOleo', oleoAngle(+$('pOleo').value));
      $('pump').classList.toggle('low', +$('comb').value <= RESERVA);
      $('rpmO').textContent = $('rpm').value + ' rpm'; $('velO').textContent = $('vel').value + ' km/h';
      $('combO').textContent = $('comb').value + ' L'; $('tempO').textContent = $('temp').value + ' °C';
      $('voltO').textContent = (+$('volt').value).toFixed(1) + ' V'; $('pOleoO').textContent = (+$('pOleo').value).toFixed(1) + ' bar';
      $('ctl').classList.toggle('completa', versao === 'completa');
    };
    for (const id of ['vel', 'comb', 'temp', 'volt', 'pOleo']) $(id).oninput = upd;
    // dirigindo (teclado ou controle), o voltímetro e a pressão do óleo seguem o motor: funcionando, 14,2 V e pressão subindo com o
    // giro; só com a ignição (luz de carga acesa), 12,4 V e pressão zero; desligado, os dois no batente de baixo
    $('rpm').oninput = e => {
      if (!e.isTrusted) {
        const giro = +$('rpm').value, roda = giro > 300, contato = roda || ($('i_bat') && $('i_bat').classList.contains('on'));
        $('volt').value = roda ? 14.2 : contato ? 12.4 : 0; $('pOleo').value = roda ? Math.min(4.5, .8 + giro / 1500) : 0;
      }
      upd();
    };
    $('semLimite').onchange = () => { $('vel').max = $('semLimite').checked ? 500 : 220; upd(); }; // ao desmarcar, o navegador traz a velocidade de volta ao limite
    $('versao').onchange = () => {
      versao = $('versao').value; try { localStorage.kadettVersao = versao; } catch (e) { }
      const odoAntes = odo, tripAntes = trip; desenha(); botoes(); ligaKnob(); odo = odoAntes; trip = tripAntes; upd();
    };
    upd();

    let odo = 0, trip = 0, last = performance.now();
    const resetTrip = () => trip = 0;
    const ligaKnob = () => { $('knob').onclick = resetTrip; $('knob').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') resetTrip(); }; };
    $('reset').onclick = resetTrip; ligaKnob();
    (function frame(now) {
      const dt = Math.min(now - last, 250) / 1000; last = now; // limite: aba em segundo plano não dá salto
      const d = $('vel').value * dt / 3600 * $('mult').value;
      odo = (odo + d) % 1e6; trip = (trip + d) % 1000;
      setDrum('odo', odo * 10); setDrum('trip', trip * 10); // os dois com o décimo no tambor claro
      requestAnimationFrame(frame);
    })(last);
    if (typeof Controle !== 'undefined') Controle.ligar(VEICULO); // teclado e controle, se o controle.js estiver junto
  }

  return { build, ORIGEM };
})();
