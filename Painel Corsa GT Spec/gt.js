// Corsa GT Spec: controles e simulação do painel desenhado pelo pro.js (que já deixou na página rpmA, velA, turA, f e br).
// Os sliders são a "verdade" do painel: dirigindo, o controle.js escreve neles (rpm, velocidade, combustível, turbo, TPS) e este
// arquivo redesenha ponteiros, telinhas, barras e luzes. As leituras que o simulador não tem (pressões, temperaturas, sonda,
// bateria, avanço) saem do giro, do turbo e do acelerador com contas simples, só para o painel se mexer como num carro preparado.
// A regulagem do turbo é o botão KOUKI no canto dos controles, como um regulador manual de pressão.
(() => {
  const $ = id => document.getElementById(id);
  const TANQUE = 46, RESERVA = .15;                     // litros; a reserva (bomba vermelha) acende com 15% do tanque
  const lim = (x, a, b) => Math.min(b, Math.max(a, x));

  // Corsa 1.6 8V da ficha (como no painel do Corsa) com um turbo regulado de fábrica em 1,3 bar, que começa a encher a 2.500 rpm e
  // está cheio a 4.000; corte de giro a 6.800 rpm. Com 1,3 bar o torque passa do dobro (o controle.js multiplica pelo turbo)
  const VEICULO = { cv: 92, rpmCv: 5600, kgfm: 13, rpmKgfm: 2600, rpmMax: 6800, lenta: 850, marchas: [3.73, 1.96, 1.32, .95, .76], re: 3.31, final: 3.94,
    pneu: [185, 55, 14], kg: 1000, cxA: .66, inercia: .13, tanque: TANQUE,
    entreEixos: 2.443, frente: .61, hcg: .5, tracao: 'D', freioDiant: .85, esterco: .6,
    turbo: { pressao: 1.3, inicio: 2500, cheio: 4000 },
    chave: { ateLigar: ['bat', 'oleo', 'inj'], teste: [] } };

  // ---- controles (mesmo jeito dos outros painéis) ----
  const LUZES = { alto: 'Farol alto', nebl: 'Neblina', seta: 'Setas', freio: 'Freio de mão', bat: 'Bateria', inj: 'Injeção', oleo: 'Óleo', cinto: 'Cinto', eletr: 'Eletrônica' };
  $('ctl').innerHTML = `<div>
    <label>RPM <input id="rpm" type="range" min="0" max="7000" step="50" value="0"><output id="rpmO"></output></label>
    <label>Velocidade <input id="vel" type="range" min="0" max="260" step="1" value="0"><output id="velO"></output></label>
    <label>Combustível <input id="comb" type="range" min="0" max="${TANQUE}" value="0"><output id="combO"></output></label>
    <label>Temperatura <input id="temp" type="range" min="50" max="130" value="95"><output id="tempO"></output></label>
    <label>Turbo <input id="turbo" type="range" min="-1" max="2" step=".01" value="0"><output id="turboO"></output></label>
    <input id="tps" type="range" min="0" max="100" value="0" hidden>
    <label>Tempo <select id="mult"><option value="1" selected>1× (real)</option><option value="20">20×</option><option value="200">200×</option></select></label>
    <button id="reset">Zerar parcial</button>
  </div>
  <div id="luzes"><button id="luz" aria-pressed="false">💡 Iluminação</button><button id="todas">Todas as luzes</button></div>
  <svg id="kouki" viewBox="-60 -60 120 120" role="slider" tabindex="0" aria-label="Regulagem do turbo" aria-valuemin="0.3" aria-valuemax="2" aria-valuenow="1.3">
    <defs>
      <radialGradient id="kAlu" cx=".4" cy=".32" r=".75"><stop offset="0" stop-color="#f4f5f6"/><stop offset=".55" stop-color="#cfd2d5"/><stop offset="1" stop-color="#9a9ea2"/></radialGradient>
      <linearGradient id="kAro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ebed"/><stop offset="1" stop-color="#7d8186"/></linearGradient>
      <path id="kTopo" d="M-33,-6A33,33 0 0 1 33,-6"/>
      <marker id="kSeta" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0L6,3L0,6z" fill="#4a4e53"/></marker>
    </defs>
    <!-- corpo de alumínio usinado (como o da referência): aro, quatro parafusos, BOOST em arco, a seta de − a +, a porca no meio e a marca -->
    <circle r="57" fill="url(#kAro)" stroke="#5d6166" stroke-width="1.5"/><circle r="51" fill="url(#kAlu)"/>
    ${[45, 135, 225, 315].map(a => { const r = 47.5, x = r * Math.sin(a * Math.PI / 180), y = -r * Math.cos(a * Math.PI / 180);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="#1d1f22"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#55595e"/>`; }).join('')}
    <text class="kT"><textPath href="#kTopo" startOffset="50%" text-anchor="middle">BOOST</textPath></text>
    <path d="M-17,-20A26,26 0 0 1 17,-20" fill="none" stroke="#4a4e53" stroke-width="1.8" marker-start="url(#kSeta)" marker-end="url(#kSeta)"/>
    <text x="-29" y="-7" class="kS">−</text><text x="29" y="-7" class="kS">+</text>
    <g id="kNo"><polygon points="0,-13 11.3,-6.5 11.3,6.5 0,13 -11.3,6.5 -11.3,-6.5" fill="#c3c6ca" stroke="#5a5e63" stroke-width="1.2"/>
      <circle r="6.5" fill="#6d7176"/><circle r="4" fill="#1d1f22"/><rect x="-1.2" y="-12.5" width="2.4" height="6" rx="1.2" fill="#e0352b"/></g>
    <text x="0" y="29" class="kM">KOUKI</text>
  </svg>
  <output id="kV" for="kouki">1,3 bar</output>
  <input id="boostReg" type="range" min="0.3" max="2" step="0.1" value="1.3" hidden>`;

  const lightBtns = Object.entries(LUZES).filter(([id]) => $('i_' + id) || (id === 'seta' && $('i_setaE'))).map(([id, rotulo]) => {
    const alvos = id === 'seta' ? [$('i_setaE'), $('i_setaD')] : [$('i_' + id)];
    const b = document.createElement('button'); b.textContent = rotulo; b.dataset.luz = id; b.setAttribute('aria-pressed', false);
    b.set = on => { alvos.forEach(a => a.classList.toggle('on', on)); b.setAttribute('aria-pressed', alvos[0].classList.contains('on')); };
    b.onclick = () => b.set(!alvos[0].classList.contains('on'));
    $('todas').before(b); return b;
  });
  $('todas').onclick = () => { const on = lightBtns.some(b => b.getAttribute('aria-pressed') === 'false'); lightBtns.forEach(b => b.set(on)); };
  $('luz').onclick = () => { const on = $('p').classList.toggle('lit'); $('luz').setAttribute('aria-pressed', on); };

  // ---- botão KOUKI: arrastar em volta, rodinha do mouse ou setas; de 0,3 a 2 bar, em 270° de curso ----
  const kouki = $('kouki'), reg = $('boostReg');
  const poeReg = b => { b = Math.round(lim(b, .3, 2) * 10) / 10; reg.value = b;
    $('kNo').setAttribute('transform', `rotate(${f(-135 + (b - .3) / 1.7 * 270)})`); $('kV').textContent = br(b) + ' bar'; kouki.setAttribute('aria-valuenow', b); };
  const angulo = e => { const r = kouki.getBoundingClientRect(); return Math.atan2(e.clientX - r.left - r.width / 2, r.top + r.height / 2 - e.clientY) * 180 / Math.PI; };
  kouki.onpointerdown = e => { kouki.setPointerCapture(e.pointerId); kouki.onpointermove = m => poeReg(.3 + (lim(angulo(m), -135, 135) + 135) / 270 * 1.7); kouki.onpointermove(e); };
  kouki.onpointerup = kouki.onpointercancel = () => { kouki.onpointermove = null; };
  kouki.onwheel = e => { e.preventDefault(); poeReg(+reg.value - Math.sign(e.deltaY) * .1); };
  kouki.onkeydown = e => { const d = { ArrowUp: .1, ArrowRight: .1, ArrowDown: -.1, ArrowLeft: -.1 }[e.key]; if (d) { e.preventDefault(); poeReg(+reg.value + d); } };
  poeReg(VEICULO.turbo.pressao);

  // ---- painel: ponteiros, telinhas, barras e luzes a partir dos sliders ----
  const rot = (id, a) => $(id).setAttribute('transform', `rotate(${f(a)})`);
  const escreve = (k, t) => { const e = $('v_' + k); if (e && e.textContent !== t) e.textContent = t; };
  const barra = (k, frac) => document.querySelectorAll(`[data-barra="${k}"]`).forEach((r, i, a) => r.setAttribute('opacity', (i + .5) / a.length <= frac ? .9 : .1));
  const luz = (id, on) => $('i_' + id) && $('i_' + id).classList.toggle('on', on);
  // abre zerado (hodômetros e tanque), com o motor e o óleo já quentes (95 °C)
  let tOleo = 95, odo = 0, trip = 0, ultimo = performance.now();
  const desenha = () => {
    const rpm = +$('rpm').value, vel = +$('vel').value, litros = +$('comb').value, temp = +$('temp').value, p = +$('turbo').value, tps = +$('tps').value;
    const ligado = rpm > 300, pp = Math.max(0, p);
    rot('nRpm', rpmA(rpm)); rot('nVel', Math.max(-136.5, velA(vel))); rot('nTur', turA(lim(p, -1, 2)));
    escreve('rpm', String(Math.round(rpm / 10) * 10)); escreve('vel', String(Math.round(vel))); escreve('turbo', br(p));
    const marcha = ($('marcha') || {}).textContent; escreve('marcha', marcha && marcha !== 'N' ? marcha : 'N');
    // leituras do motor: óleo sobe com o giro; sonda rica com pressão, pobre no freio-motor; ar mais quente com pressão
    const oleo = ligado ? lim(1 + rpm / 1400, 0, 6.5) : 0, comb_p = ligado ? 3 + pp : 0;
    const sonda = !ligado ? 0 : tps < 3 && rpm > 1500 ? 1.25 : pp > .2 ? .82 - .05 * pp : 1.0;
    escreve('P.ÓLEO', br(oleo)); barra('P.ÓLEO', oleo / 8);
    escreve('P.COMB', br(comb_p)); barra('P.COMB', comb_p / 6);
    escreve('SONDA', br(sonda, 2)); escreve('T.AR', br(ligado ? 32 + 18 * pp : 0)); escreve('T.ÓLEO', String(Math.round(tOleo)));
    escreve('TPS', String(Math.round(tps))); escreve('BATERIA', br(ligado ? 14.1 : 0));
    escreve('AVANÇO', String(ligado ? Math.round(lim(10 + rpm / 300 - 8 * pp, 0, 36)) : 0));
    const pct = litros / TANQUE; escreve('COMBUSTÍVEL', String(Math.round(pct * 100))); barra('COMBUSTÍVEL', pct);
    escreve('T.MOTOR', br(temp)); barra('T.MOTOR', (temp - 50) / 80);
    luz('shift', rpm >= 6000); luz('reserva', pct <= RESERVA); luz('quente', temp >= 110);
    for (const [id, o] of [['rpm', rpm + ' rpm'], ['vel', vel + ' km/h'], ['comb', litros + ' L'], ['temp', temp + ' °C'], ['turbo', br(p) + ' bar']]) $(id + 'O').textContent = o;
  };
  for (const id of ['rpm', 'vel', 'comb', 'temp', 'turbo', 'tps']) $(id).addEventListener('input', desenha);
  $('reset').onclick = () => { trip = 0; };
  (function quadro(agora) { // hodômetro e temperatura do óleo andam com o tempo
    const dt = Math.min(agora - ultimo, 250) / 1000; ultimo = agora;
    const d = $('vel').value * dt / 3600 * $('mult').value; odo = (odo + d) % 1e6; trip = (trip + d) % 1e4;
    tOleo += ((+$('rpm').value > 300 ? 98 : 95) - tOleo) * Math.min(1, dt / 60); // parado, o óleo fica na temperatura de partida
    escreve('total', String(odo.toFixed(1)).replace('.', ',')); escreve('parcial', String(trip.toFixed(1)).replace('.', ','));
    desenha(); requestAnimationFrame(quadro);
  })(ultimo);
  if (typeof Controle !== 'undefined') Controle.ligar(VEICULO);
})();
