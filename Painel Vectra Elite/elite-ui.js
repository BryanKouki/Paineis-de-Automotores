// Vectra Elite: controles e simulação do painel desenhado pelo elite.js (que deixou na página gira(), f e as luzes .luz).
// Os sliders são a "verdade" do painel: dirigindo, o controle.js escreve neles e este arquivo gira os ponteiros, acende as luzes
// e escreve o parcial e o total no visor (em cima e embaixo, como no painel).
(() => {
  const $ = id => document.getElementById(id);
  const TANQUE = 60;

  // Vectra Elite 2.4 16V FlexPower (o do emblema): potência, torque, peso, pneus e tanque da ficha técnica; as relações do câmbio e
  // do diferencial não achei em fonte confiável e são estimadas. Na ignição: bateria, óleo e injeção até o motor pegar
  const VEICULO = { cv: 146, rpmCv: 5800, kgfm: 23.2, rpmKgfm: 4200, rpmMax: 6500, lenta: 800, marchas: [3.58, 2.02, 1.35, 1.03, .81], re: 3.31, final: 3.63,
    pneu: [215, 50, 17], kg: 1430, cxA: .62, inercia: .18, tanque: TANQUE,
    entreEixos: 2.70, frente: .61, hcg: .54, tracao: 'D', freioDiant: .78, esterco: .58,
    chave: { ateLigar: ['bat', 'oleo', 'inj'], teste: [] } };

  const LUZES = { alto: 'Farol alto', neblinaD: 'Farol de neblina', neblinaT: 'Neblina traseira', seta: 'Setas', porta: 'Porta aberta',
    bat: 'Bateria', inj: 'Injeção', oleo: 'Óleo', freio: 'Freio' };
  $('ctl').innerHTML = `<div>
    <label>RPM <input id="rpm" type="range" min="0" max="7000" step="50" value="0"><output id="rpmO"></output></label>
    <label>Velocidade <input id="vel" type="range" min="0" max="220" step="1" value="0"><output id="velO"></output></label>
    <label>Combustível <input id="comb" type="range" min="0" max="${TANQUE}" value="0"><output id="combO"></output></label>
    <label>Temperatura <input id="temp" type="range" min="50" max="130" value="50"><output id="tempO"></output></label>
    <label>Tempo <select id="mult"><option value="1" selected>1× (real)</option><option value="20">20×</option><option value="200">200×</option></select></label>
    <button id="reset">Zerar parcial</button>
  </div>
  <div id="luzes"><button id="luz" aria-pressed="false">💡 Iluminação</button><button id="todas">Todas as luzes</button></div>`;
  // as setas piscam
  document.head.insertAdjacentHTML('beforeend', '<style>.luz.on.pisca path{animation:piscaSeta .7s steps(1) infinite}@keyframes piscaSeta{50%{opacity:0;filter:none}}</style>');

  const lightBtns = Object.entries(LUZES).map(([id, rotulo]) => {
    const alvos = id === 'seta' ? [$('l_esq'), $('l_dir')] : [$('l_' + id)];
    if (!alvos[0]) return null;
    if (id === 'seta') alvos.forEach(a => a.classList.add('pisca'));
    const b = document.createElement('button'); b.textContent = rotulo; b.dataset.luz = id; b.setAttribute('aria-pressed', false);
    b.set = on => { alvos.forEach(a => a.classList.toggle('on', on)); b.setAttribute('aria-pressed', alvos[0].classList.contains('on')); };
    b.onclick = () => b.set(!alvos[0].classList.contains('on'));
    $('todas').before(b); return b;
  }).filter(Boolean);
  $('todas').onclick = () => { const on = lightBtns.some(b => b.getAttribute('aria-pressed') === 'false'); lightBtns.forEach(b => b.set(on)); };
  $('luz').onclick = () => { const on = $('p').classList.toggle('lit'); $('luz').setAttribute('aria-pressed', on); };

  // visor: parcial em cima (com uma casa) e total embaixo, alinhados à direita, em âmbar como nas fotos de noite
  const lcd = document.querySelector('#p .lcd'), x = +lcd.getAttribute('x'), y = +lcd.getAttribute('y'), w = +lcd.getAttribute('width'), h = +lcd.getAttribute('height');
  lcd.insertAdjacentHTML('afterend', `<g class="visor" font-family="Digital,Consolas,monospace" font-weight="700" fill="#f7a43a" text-anchor="end">` +
    `<text id="visorParcial" x="${f(x + w * .93)}" y="${f(y + h * .45)}" font-size="${f(h * .36)}">0.0</text>` +
    `<text id="visorTotal" x="${f(x + w * .93)}" y="${f(y + h * .88)}" font-size="${f(h * .36)}">0</text></g>`);

  const desenha = () => {
    const rpm = +$('rpm').value, vel = +$('vel').value, litros = +$('comb').value, temp = +$('temp').value;
    gira('nRpm', rpm); gira('nVel', vel); gira('nTemp', temp); gira('nComb', litros / TANQUE * 100);
    for (const [id, o] of [['rpm', rpm + ' rpm'], ['vel', vel + ' km/h'], ['comb', litros + ' L'], ['temp', temp + ' °C']]) $(id + 'O').textContent = o;
  };
  for (const id of ['rpm', 'vel', 'comb', 'temp']) $(id).addEventListener('input', desenha);
  let odo = 0, trip = 0, ultimo = performance.now();
  $('reset').onclick = () => { trip = 0; };
  (function quadro(agora) {
    const dt = Math.min(agora - ultimo, 250) / 1000; ultimo = agora;
    const d = $('vel').value * dt / 3600 * $('mult').value; odo = (odo + d) % 1e6; trip = (trip + d) % 1e4;
    const p = trip.toFixed(1), t = String(Math.floor(odo));
    if ($('visorParcial').textContent !== p) $('visorParcial').textContent = p;
    if ($('visorTotal').textContent !== t) $('visorTotal').textContent = t;
    requestAnimationFrame(quadro);
  })(ultimo);
  desenha();
  if (typeof Controle !== 'undefined') Controle.ligar(VEICULO);
})();
