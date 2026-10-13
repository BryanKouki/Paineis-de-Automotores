// Teclado, controle de videogame e volante: simulam o veículo andando (ignição, partida, motor, embreagem, marchas, direção, pneus,
// arrasto, freios e combustível) e movem o painel pelos mesmos sliders. A marcha engatada fica no canto da janela, com um botão
// discreto que mostra os comandos e deixa ligar cada um a qualquer botão ou eixo de qualquer controle, volante ou pedaleira.
// No canto dos controles ficam o miolo da ignição (carros) ou o botão e o pedal de partida (motos).
//
// Sem nada configurado, um controle de layout padrão segue o mapeamento do Gran Turismo 7: analógico esquerdo na direção, R2 acelera,
// L2 freia, ✕ sobe marcha, □ desce, ○ freio de mão, △ ré, L3 faróis. Diferenças: as setas ficam no direcional (esquerda/direita)
// em vez do touchpad; direcional para cima liga o farol alto; Options gira a ignição.
const Controle = (() => {
  // comandos: [nome, tecla, botão no layout padrão da Gamepad API, ligação padrão]. Uma ligação é um botão (b) ou um eixo (e), este
  // com a leitura em repouso (r) e no fim do curso (x)
  const FUNCOES = {
    dir: ['Direção', '← →', 'Analógico esquerdo', { e: 0, r: 0, x: -1 }],
    acel: ['Acelerar', 'W', 'R2', { b: 7 }], freio: ['Frear', 'S', 'L2', { b: 6 }],
    sobe: ['Subir marcha', 'E', '✕', { b: 0 }], desce: ['Descer marcha', 'Q', '□', { b: 2 }],
    embr: ['Embreagem', 'Shift', 'L1', { b: 4 }], mao: ['Freio de mão', 'Espaço', '○', { b: 1 }], re: ['Ré (parado)', 'R', '△', { b: 3 }],
    ignicao: ['Ignição e partida', 'I', 'Options', { b: 9 }],
    setaE: ['Seta esquerda', 'A', 'Direcional ←', { b: 14 }], setaD: ['Seta direita', 'D', 'Direcional →', { b: 15 }],
    alto: ['Farol alto', 'F', 'Direcional ↑', { b: 12 }], farol: ['Faróis (iluminação)', 'L', 'L3', { b: 10 }],
  };
  // teclas, pela posição no teclado (e.code): as de um toque e as de segurar
  const TOQUES = { KeyE: 'sobe', KeyQ: 'desce', KeyR: 're', KeyI: 'ignicao', KeyL: 'farol', KeyF: 'alto', KeyA: 'setaE', KeyD: 'setaD' };
  const SEGURAR = { acel: 'KeyW', freio: 'KeyS', embr: 'ShiftLeft', mao: 'Space', esq: 'ArrowLeft', dirt: 'ArrowRight' };
  const G = 9.81, AR = 1.2, CONDUTOR = 75, RENDIMENTO = .9;
  // pneus em asfalto seco: aderência e rigidez (por unidade de carga) ao escorregar no sentido da roda e de lado. De lado, a
  // dianteira cede mais que a traseira (a direção e a suspensão também cedem) e tem um pouco menos de aderência (a suspensão
  // é acertada assim), para o veículo sair de frente no limite em vez de rodar. Os pares são [dianteira, traseira]
  const ADER = 1, RIG_LONGO = 22, RIG_LADO = [11, 17], ADER_LADO = [.93, 1.07];
  // força do pneu conforme o escorregamento (fórmula de Pacejka reduzida): cresce reta, chega ao pico (1) em PICO e cai para 85%
  // quando o pneu desliza de vez. Com as rigidezes acima o pico fica em 10% de escorregamento no sentido da roda e, de lado,
  // perto de 11° de deriva na dianteira e 8° na traseira
  const PICO = 2.25, pneu = s => Math.sin(1.35 * Math.atan(2 * s / 1.35 - Math.atan(s / 1.35)));
  console.assert(Math.abs(pneu(PICO) - 1) < 1e-3 && Math.abs(pneu(1e-3) / 1e-3 - 1) < 1e-3 && Math.abs(pneu(1e6) - .853) < 1e-3, 'pneu');

  // ligações gravadas no navegador: comando -> { id do aparelho, b } ou { id, e, r, x }. volante = a direção manda direto no esterço
  let ligas = {};
  try { ligas = JSON.parse(localStorage.controle) || {}; } catch (e) { }
  const grava = () => { try { localStorage.controle = JSON.stringify(ligas); } catch (e) { } };
  const mexeu = {};
  // quanto o comando está acionado no controle: 0 em repouso, 1 no fim do curso (a direção vai de -1 a 1, positiva para a esquerda)
  const le = (pads, f) => {
    let l = ligas[f], p = l && pads.find(p => p.id === l.id);
    if (!p) { l = FUNCOES[f][3]; p = pads.find(p => p.mapping === 'standard'); } // sem ligação (ou sem o aparelho dela) vale o layout padrão
    if (!p) return 0;
    if ('b' in l) return p.buttons[l.b] ? p.buttons[l.b].value : 0;
    const x = p.axes[l.e], ch = p.index + '.' + l.e;
    // alguns volantes informam 0 nos pedais até o primeiro toque: até o eixo dar outra leitura, vale como solto
    if (x === undefined || (!mexeu[ch] && x === 0 && Math.abs(l.r) > .5)) return 0;
    mexeu[ch] = true;
    // direcional em "chapéu": o eixo dá uma leitura para cada posição, e a de repouso fica fora da faixa de -1 a 1
    if (Math.abs(l.r) > 1.05) return Math.abs(x - l.x) < .14 ? 1 : 0;
    return (x - l.r) / (l.x - l.r);
  };

  const VISOR = `<style>#teclas{background:none;border:0;padding:4px;color:inherit;opacity:.3;line-height:0;cursor:pointer}
#teclas:hover,#teclas:focus-visible,#teclas[aria-expanded=true]{opacity:1}
#somBtn{background:none;border:0;padding:4px;color:inherit;opacity:.3;line-height:0;cursor:pointer}#somBtn:hover,#somBtn:focus-visible{opacity:1}#somBtn[aria-pressed=false] .ondas{display:none}
#somVol{width:70px;margin:0}
#teclasLista{position:fixed;top:66px;right:10px;z-index:3;max-height:calc(100vh - 80px);overflow:auto;background:#15181bf5;border:1px solid #3a4350;border-radius:8px;padding:8px 12px;font:12px system-ui,sans-serif;color:#dde}
#teclasLista table{border-collapse:collapse}#teclasLista th,#teclasLista td{text-align:left;padding:2px 14px 2px 0}#teclasLista th{color:#8b949e;font-weight:400}
#teclasLista button{padding:1px 8px;font:inherit}#teclasLista button.ouve{color:#ffc56e;border-color:#ffc56e}
#teclasLista p{margin:8px 0 6px;max-width:32em;color:#8b949e}#teclasLista label{margin-right:12px}</style>
<div style="position:fixed;top:24px;right:10px;z-index:3;display:flex;align-items:center;gap:6px;color:#e6e9ee;font:700 30px system-ui,sans-serif">
  <span id="aviso" style="font:600 12px system-ui,sans-serif;color:#ff7b6b"></span>
  <input id="somVol" type="range" min="0" max="1" step="0.05" aria-label="Volume do som do motor" title="Volume do som do motor" hidden>
  <button id="somBtn" aria-label="Som do motor" aria-pressed="false" title="Som do motor" hidden><svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true"><path d="M1 5.5h3.5L9 1.5v13L4.5 10.5H1z" fill="currentColor"/><path class="ondas" d="M12 5q2 3 0 6M14.5 3q3.5 5 0 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
  <button id="teclas" aria-label="Teclas e botões para dirigir" aria-expanded="false" title="Teclas e botões para dirigir"><svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true"><rect x=".75" y=".75" width="20.5" height="14.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 5h2M8 5h2M12 5h2M16 5h2M4 8h2M8 8h2M12 8h2M16 8h2M6 11.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
  <span id="marcha" title="Marcha">N</span>
</div>
<div id="teclasLista" hidden></div>`;
  // miolo da ignição dos carros: posições B (bloqueado), I (acessórios), II (ignição ligada) e III (partida, que volta sozinha para II).
  // Ângulos das marcas medidos na foto do miolo; a fenda aponta para a marca da posição atual
  const FASES = [['B', -105], ['I', -18], ['II', 24], ['III', 52]];
  const MIOLO = `<style>#ctl{position:relative;padding-left:136px;padding-right:136px}
#chaveCarro{position:absolute;right:36px;bottom:6px;width:92px;height:92px;cursor:pointer;user-select:none;touch-action:none}
#chaveCarro:focus-visible{outline:2px solid #4a7fb5;outline-offset:2px;border-radius:50%}
#chaveCarro text{font:700 9.5px Arial,Helvetica,sans-serif;fill:#f4f4f2;text-anchor:middle;dominant-baseline:central;opacity:.5}
#chaveCarro .atual text{opacity:1}
#tambor{transition:transform .15s}</style>
<svg id="chaveCarro" viewBox="-50 -50 100 100" role="button" tabindex="0" aria-label="Ignição: posição B">
  <defs><linearGradient id="chaveMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9acb0"/><stop offset=".5" stop-color="#8b8e93"/><stop offset="1" stop-color="#6f7277"/></linearGradient></defs>
  <circle r="48.5" fill="#0b0b0c" stroke="#2c2d31" stroke-width="1.5"/>
  ${FASES.map(([nome, a], i) => `<g data-fase="${i}"${i ? '' : ' class="atual"'} transform="rotate(${a})"><rect x="-10" y="-49" width="20" height="19" fill="transparent"/><text y="-39.5">${nome}</text></g>`).join('')}
  <circle r="29.5" fill="url(#chaveMetal)" stroke="#050506" stroke-width="1.5"/><rect id="tambor" x="-3.3" y="-18" width="6.6" height="36" rx="1" fill="#26282c" stroke="#55585d" stroke-width=".6" transform="rotate(${FASES[0][1]})"/>
</svg>`;
  // partida da moto, no mesmo canto: botão de partida elétrica em cima (segurando), pedal de partida embaixo (um chute) e, à esquerda,
  // a luz de motor funcionando. Símbolo e tecla desenhados pelas medidas da foto do punho; o pedal.png fica junto deste arquivo.
  // overflow:clip na barra: o pedal, ao girar no chute, passa da borda e sem isso a página ganha barra de rolagem
  const PARTIDA = `<style>#ctl{position:relative;padding-left:136px;padding-right:136px;min-height:98px;overflow:clip}
#ctl #partidaMoto{position:absolute;right:36px;bottom:6px;margin:0;display:flex;flex-wrap:nowrap;align-items:center;gap:14px;user-select:none}
#partidaMoto button{display:block;margin:0 auto;padding:0;border:0;border-radius:6px;background:none;line-height:0;touch-action:none}
#partidaMoto button:focus-visible{outline:2px solid #4a7fb5;outline-offset:2px}
#motorLigado{width:14px;height:14px;border-radius:50%;background:#20252b;border:1.5px solid #3a4350}
#motorLigado.on{background:#3ddc6a;border-color:#9af3b4;box-shadow:0 0 10px #3ddc6a}
#partidaEletrica:active .tecla{transform:translateY(5px);filter:brightness(.8)}
#partidaMoto #pedal{margin-top:6px}
#pedal img{height:42px;transform-origin:22% 89%;transition:transform .1s}
#pedal:active img{transform:rotate(20deg)}</style>
<div id="partidaMoto">
  <span id="motorLigado" role="img" title="Motor desligado"></span>
  <div>
    <button id="partidaEletrica" aria-label="Partida elétrica (segure)" title="Partida elétrica (segure)"><svg width="42" height="59" viewBox="-2 0 136 190" aria-hidden="true">
      <defs><linearGradient id="teclaVermelha" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ea5247"/><stop offset="1" stop-color="#d9403c"/></linearGradient></defs>
      <g transform="translate(66 38)" fill="#c9cdd4"><path d="M-15.5 26.9A31 31 0 1 1 28.1 13.1" fill="none" stroke="#c9cdd4" stroke-width="6"/><path d="M20.4 8.2 37.1 15 14 29z"/>
        <polygon points="-2,-24 5,-24 0,-11 11,-10 6,1 4,2 14,4 8,15 6,16 -7,32 -4,16 -12,14 -7,3 -6,2 -16,-1 -10,-12"/></g>
      <g transform="translate(0 88)"><path class="tecla" d="M9 0H123a9 9 0 0 1 9 9V68a32 32 0 0 1-32 32H32A32 32 0 0 1 0 68V9a9 9 0 0 1 9-9z" fill="url(#teclaVermelha)"/></g>
    </svg></button>
    <button id="pedal" aria-label="Pedal de partida" title="Pedal de partida"><img src="../pedal.png" alt=""></button>
  </div>
</div>`;

  /**
   * v = dados do veículo: cv e rpmCv (potência máxima), kgfm e rpmKgfm (torque máximo), rpmMax, lenta,
   * marchas (relações), re (0 = não tem), final (diferencial; na moto, primária x coroa/pinhão),
   * pneu [largura mm, perfil %, aro pol], kg, cxA (Cx x área frontal, m²), inercia (do motor, kg·m²) e tanque (litros);
   * entreEixos (m), frente (fração do peso, com condutor, no eixo dianteiro), hcg (altura do centro de gravidade, m),
   * tracao ('D' dianteira ou 'T' traseira), freioDiant (fração da força de freio na dianteira) e esterco (esterço máximo das rodas, rad).
   * partida (giro a que o motor sobe ao pegar; sem ele, 25% acima da lenta) e semCorte (motor sem corte de giro).
   * chave (só nos carros) = luzes que o miolo comanda: ateLigar (acendem em II e apagam quando o motor pega) e teste (acendem 3 s)
   */
  function ligar(v) {
    const $ = id => document.getElementById(id), luz = id => document.querySelector(`[data-luz="${id}"]`);
    const raio = (v.pneu[2] * 25.4 + 2 * v.pneu[0] * v.pneu[1] / 100) / 2000; // raio da roda, m
    const massa = v.kg + CONDUTOR, tMax = v.kgfm * G, tPot = v.cv * 735.5 / (v.rpmCv * Math.PI / 30);
    // torque a plena carga (N·m): parábola que passa pelo torque máximo e pelo torque na rotação de potência máxima
    const torque = rpm => Math.max(.4 * tMax, tMax - (tMax - tPot) * ((rpm - v.rpmKgfm) / (v.rpmCv - v.rpmKgfm)) ** 2);
    const atrito = rpm => tMax * (.1 + .04 * rpm / 1000);                     // freio-motor (atrito e bombeamento com o acelerador solto), N·m
    const rel = m => (m > 0 ? v.marchas[m - 1] : v.re) * v.final;             // relação total da marcha m (-1 = ré)
    const giro = (vel, m) => vel / raio * rel(m) * 30 / Math.PI;              // rpm que as rodas impõem ao motor engatado
    const L = v.entreEixos, cgF = L * (1 - v.frente), cgT = L * v.frente;     // do centro de gravidade ao eixo dianteiro e ao traseiro, m
    const guinada = massa * cgF * cgT;                                        // inércia de guinada, kg·m² (aproximação usual)
    const motriz = v.tracao === 'T' ? 1 : 0;                                  // eixo que traciona: 0 dianteiro, 1 traseiro
    console.assert(torque(v.rpmKgfm) === tMax && Math.abs(torque(v.rpmCv) - tPot) < 1e-9 && tPot <= tMax, 'torque');

    document.body.insertAdjacentHTML('beforeend', VISOR);

    // lista de comandos: clicar no botão de um comando põe a lista à escuta do controle (aprendendo) até ele ser acionado
    let aprendendo = null, recem = false;
    const desenha = () => {
      const rotulo = f => { const l = ligas[f]; return !l ? FUNCOES[f][2] : 'b' in l ? 'Botão ' + (l.b + 1) : 'Eixo ' + (l.e + 1); };
      const pede = f => f === 'dir' ? (aprendendo.eixo ? 'agora centralize…' : 'vire para a esquerda e segure…') : aprendendo.eixo ? 'agora solte…' : 'acione e segure…';
      $('teclasLista').innerHTML = `<table><tr><th>Função</th><th>Teclado</th><th>Controle ou volante</th></tr>${Object.keys(FUNCOES).map(f =>
        `<tr><td>${FUNCOES[f][0]}</td><td>${FUNCOES[f][1]}</td><td><button data-f="${f}"${aprendendo && aprendendo.f === f ? ` class="ouve">${pede(f)}` : `>${rotulo(f)}`}</button></td></tr>`).join('')}</table>
<p>Para trocar um comando, clique nele e acione o botão, o pedal ou o volante. Vale qualquer controle, volante, pedaleira ou câmbio ligado ao computador.</p>
<label><input type="checkbox" id="volante"${ligas.volante ? ' checked' : ''}> Volante (direção direta)</label><button id="padrao">Restaurar padrão</button>`;
    };
    const lista = abre => { $('teclasLista').hidden = !abre; $('teclas').setAttribute('aria-expanded', abre); aprendendo = null; desenha(); };
    $('teclas').onclick = () => lista($('teclasLista').hidden);

    // som do motor (som.js do painel, se houver): todos os laços tocam sem parar, mudos; a cada quadro ganham volume os dois
    // vizinhos do giro atual, com a velocidade de reprodução acertando o tom. O volume e o brilho acompanham o acelerador
    const som = typeof SOM_MOTOR !== 'undefined' && SOM_MOTOR;
    // o som abre sempre desligado; o botão de alto-falante liga e mostra o slider de volume. Só o volume fica gravado no navegador
    let audio = null, lacos = [], geral, filtro, mudo = true, nivel = .7;
    try { nivel = +(localStorage.somVolume ?? .7); localStorage.removeItem('somMotor'); } catch (e) { } // somMotor: ligado/desligado que versões de teste gravavam
    const ligaSom = () => { // só pode nascer num gesto do usuário (tecla ou clique)
      if (!som) return;
      if (audio) { audio.resume(); return; }
      audio = new AudioContext(); filtro = audio.createBiquadFilter(); geral = audio.createGain(); geral.gain.value = 0;
      filtro.connect(geral).connect(audio.destination);
      lacos = som.lacos.map(([giro, b64]) => {
        const bin = atob(b64), buf = audio.createBuffer(1, bin.length / 2, som.taxa), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = ((bin.charCodeAt(2 * i) | bin.charCodeAt(2 * i + 1) << 8) << 16 >> 16) / 32768;
        const fonte = audio.createBufferSource(), g = audio.createGain();
        fonte.buffer = buf; fonte.loop = true; g.gain.value = 0; fonte.connect(g).connect(filtro); fonte.start();
        return { giro, fonte, g };
      });
    };
    const tocaSom = (giro, carga, volume) => {
      if (!audio) return;
      const t = audio.currentTime, vai = (p, v) => p.setTargetAtTime(v, t, .03);
      const acima = lacos.findIndex(l => l.giro > giro), i = Math.max(0, (acima < 0 ? lacos.length - 1 : acima) - 1); // laço logo abaixo do giro
      const m = Math.max(0, Math.min(1, (giro - lacos[i].giro) / (lacos[i + 1].giro - lacos[i].giro)));
      lacos.forEach((l, k) => {
        vai(l.g.gain, k === i ? Math.cos(m * Math.PI / 2) : k === i + 1 ? Math.sin(m * Math.PI / 2) : 0); // mistura de potência constante
        if (k === i || k === i + 1) vai(l.fonte.playbackRate, Math.max(.05, giro / l.giro));
      });
      vai(filtro.frequency, 900 + 9000 * carga);                          // acelerador solto: som mais abafado
      vai(geral.gain, mudo ? 0 : nivel * volume * (.3 + .7 * carga));
    };
    if (som) {
      const mostraSom = () => { $('somBtn').setAttribute('aria-pressed', !mudo); $('somVol').hidden = mudo; };
      $('somBtn').hidden = false; $('somVol').value = nivel; mostraSom();
      $('somBtn').onclick = () => { mudo = !mudo; mostraSom(); ligaSom(); };
      $('somVol').oninput = () => { nivel = +$('somVol').value; try { localStorage.somVolume = nivel; } catch (e) { } };
      for (const ev of ['keydown', 'pointerdown']) addEventListener(ev, ligaSom);
    }
    $('teclasLista').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'padrao') { ligas = {}; aprendendo = null; grava(); }
      else aprendendo = aprendendo && aprendendo.f === b.dataset.f ? null : { f: b.dataset.f, mem: {} };
      desenha();
    };
    $('teclasLista').onchange = e => { ligas.volante = e.target.checked; grava(); };
    // um volante ou controle fora do layout padrão, ainda sem nenhum comando ligado, abre a lista para ser configurado
    addEventListener('gamepadconnected', e => { if (e.gamepad.mapping !== 'standard' && !Object.values(ligas).some(l => l.id === e.gamepad.id)) lista(true); });
    const liga = (l, p) => {
      ligas[aprendendo.f] = l;
      if (aprendendo.f === 'dir') ligas.volante = p.mapping !== 'standard'; // direção fora do layout padrão: é um volante
      aprendendo = null; grava(); desenha();
    };
    // 1º passo: um botão apertado, ou um eixo levado ao fim do curso e seguro ali; 2º passo (eixo): solto, ele mostra o repouso
    const aprende = (pads, agora) => {
      const A = aprendendo;
      for (const p of pads) {
        const m = A.mem[p.index] = A.mem[p.index] || { b: p.buttons.map(x => x.value > .5), ini: [...p.axes], ult: [...p.axes], desde: agora };
        if (p.axes.some((x, e) => Math.abs(x - m.ult[e]) > .02)) { m.ult = [...p.axes]; m.desde = agora; }
        const firme = agora - m.desde > 250; // eixos parados há um quarto de segundo
        if (!A.eixo) {
          const i = p.buttons.findIndex((x, i) => x.value > .5 && !m.b[i]);
          p.buttons.forEach((x, i) => { if (x.value < .3) m.b[i] = false; });
          if (i >= 0 && A.f !== 'dir') return liga({ id: p.id, b: i }, p);
          const e = p.axes.reduce((maior, x, e) => Math.abs(x - m.ini[e]) > Math.abs(p.axes[maior] - m.ini[maior]) ? e : maior, 0);
          if (firme && p.axes.length && Math.abs(p.axes[e] - m.ini[e]) > (A.f === 'dir' ? .3 : .5)) { A.eixo = { pad: p.index, e, x: p.axes[e] }; desenha(); }
        } else if (A.eixo.pad === p.index) {
          const { e, x } = A.eixo, r = p.axes[e];
          // na direção só interessa o lado: o fim do curso é uma unidade além do centro
          if (firme && Math.abs(r - x) > .3) return liga({ id: p.id, e, r, x: A.f === 'dir' ? r + Math.sign(x - r) : x }, p);
        }
      }
    };

    // simulando = o teclado, o controle ou o miolo estão dirigindo; mexer num slider com o mouse devolve o comando aos sliders
    let simulando = false, marcha = 0, rpm = 0, acelT = 0, freioT = 0, esterco = 0, antes = {}, ultimo = performance.now(); // marcha: -1 ré, 0 neutro, 1…
    // vx e vy = velocidade do veículo para a frente e de lado (m/s); wz = giro em torno do eixo vertical (rad/s);
    // u = velocidade da banda dos pneus de cada eixo [dianteiro, traseiro]; ax = aceleração, para a transferência de peso
    let vx = 0, vy = 0, wz = 0, u = [0, 0], ax = 0;
    let maoAntes = false, chaveAntes = ''; // último estado do freio de mão e de ignição+marcha que a simulação passou para as luzes
    let cortando = false;                  // corte de giro em ação
    let perdaTexto = '', perdaAte = 0;     // aviso de perda de aderência, que fica uns instantes na tela
    // combustível: a simulação gasta o que o slider mostra. Com o tanque praticamente vazio (meio por cento) o motor engasga por
    // alguns segundos e morre
    const porUnidade = v.tanque / +$('comb').max, SECO = .005 * v.tanque; // o slider da moto é em %, o dos carros em litros
    let litros = 0, secoDesde = null, morto = false;
    $('comb').addEventListener('input', e => { if (e.isTrusted) litros = +e.target.value * porUnidade; });
    // ignição dos carros: fase = posição do miolo (0 B, 1 I, 2 II, 3 III); rodando = motor funcionando
    let fase = 0, rodando = false, giraDesde = null, soltarEm = 0, pegouEm = -1e9, estadoAntes = 0, testeAte = 0;
    let apertado = false, chute = false; // moto: botão de partida seguro e chute no pedal ainda por atender
    // dirigindo, os ponteiros respondem mais rápido (dá para ver a partida, o corte de giro e a queda do giro na troca de marcha)
    const ponteiros = () => { for (const id of ['nRpm', 'nVel']) if ($(id)) $(id).style.transitionDuration = simulando ? '80ms' : ''; };
    const ativa = () => { // assume de onde os sliders estão
      if (simulando) return;
      simulando = true; vx = (+$('vel').value || 0) / 3.6; u = [vx, vx]; vy = wz = ax = 0;
      litros = +$('comb').value * porUnidade; morto = litros <= SECO; ponteiros();
    };
    const seguras = new Set(), toques = new Set();
    for (const id of ['vel', 'rpm']) if ($(id)) $(id).addEventListener('input', e => { if (e.isTrusted) { simulando = false; ponteiros(); } });
    addEventListener('keydown', e => {
      if (e.code === 'Escape' && aprendendo) { aprendendo = null; desenha(); }
      if (e.ctrlKey || e.altKey || e.metaKey || e.target.matches('select')) return;
      if (TOQUES[e.code]) { if (!e.repeat) toques.add(TOQUES[e.code]); return; }
      if (!Object.values(SEGURAR).includes(e.code)) return;
      // o espaço ainda aciona o botão em foco e as setas ainda mexem no slider em foco; fora disso, não rolam a página
      if (e.code === 'Space' ? e.target.matches('button, input, [role=button]') : e.code.startsWith('Arrow') && e.target.matches('input[type=range]')) return;
      if (e.code !== SEGURAR.acel && e.code !== SEGURAR.freio) e.preventDefault();
      seguras.add(e.code);
    });
    addEventListener('keyup', e => seguras.delete(e.code));
    addEventListener('blur', () => seguras.clear());

    if (v.chave) { // miolo no canto dos controles: um clique leva à I, outro à II; em II, segurar dá a partida e um clique só volta para a I
      $('ctl').insertAdjacentHTML('beforeend', MIOLO);
      const m = $('chaveCarro');
      let segurando = 0; // temporizador que separa o clique do segurar
      m.onpointerdown = e => {
        const marca = e.target.closest('[data-fase]'); // clicar numa marca gira direto até ela
        ativa(); soltarEm = 0;
        try { m.setPointerCapture(e.pointerId); } catch (x) { } // segurando, a partida continua mesmo se o mouse sair de cima
        if (marca) fase = +marca.dataset.fase;
        else if (fase < 2) fase++;
        else if (fase === 2) segurando = setTimeout(() => { segurando = 0; fase = 3; }, 250);
      };
      m.onpointerup = m.onpointercancel = e => {
        if (segurando) { clearTimeout(segurando); segurando = 0; if (e.type === 'pointerup') fase = 1; }
        else if (fase === 3) fase = 2; // a partida volta sozinha para II
      };
      m.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toques.add('ignicao'); } };
    } else { // moto: botão de partida elétrica (segurando) e pedal de partida (um chute) no mesmo canto
      $('ctl').insertAdjacentHTML('beforeend', PARTIDA);
      const b = $('partidaEletrica');
      b.onpointerdown = e => { ativa(); apertado = true; try { b.setPointerCapture(e.pointerId); } catch (x) { } };
      b.onpointerup = b.onpointercancel = () => { apertado = false; };
      b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { ativa(); soltarEm = performance.now() + 900; } }; // pelo teclado, segura por 0,9 s
      $('pedal').onclick = () => { ativa(); chute = true; };
    }

    const mostra = (id, valor, passo) => { // escreve no slider e avisa o painel, só quando o número muda
      const e = $(id); if (!e) return;
      e.step = passo;
      const s = Math.min(+e.max, Math.max(0, valor)).toFixed(passo < 1 ? 1 : 0);
      if (e.value !== s) { e.value = s; e.dispatchEvent(new Event('input')); }
    };

    (function quadro(agora) {
      requestAnimationFrame(quadro);
      let pads = [];
      try { pads = [...navigator.getGamepads()].filter(Boolean); } catch (e) { } // dentro de um quadro sem permissão o navegador recusa
      const dt = Math.min(agora - ultimo, 100) / 1000; ultimo = agora;
      if (aprendendo) { aprende(pads, agora); recem = true; return; } // enquanto um comando é ligado, a simulação espera
      // comandos de um toque no controle: valem na subida (num eixo, ao passar da metade do curso)
      const on = {};
      for (const f of Object.values(TOQUES)) { on[f] = le(pads, f) > .5; if (on[f] && !antes[f] && !recem) toques.add(f); }
      antes = on; recem = false;
      // no teclado o pedal é tudo ou nada; aqui ele desce e sobe aos poucos, como um pé. O freio vai a 78%, o máximo antes de as
      // rodas travarem em linha reta; com um pedal ou gatilho de verdade dá para passar disso e travar
      const pedal = (atual, tecla, fundo) => atual + ((seguras.has(tecla) ? fundo : 0) - atual) * Math.min(1, dt * (seguras.has(tecla) ? 3 : 8));
      acelT = pedal(acelT, SEGURAR.acel, 1); freioT = pedal(freioT, SEGURAR.freio, .78);
      const curso = x => Math.max(0, Math.min(1, x)), acelP = curso(le(pads, 'acel')), freioP = curso(le(pads, 'freio'));
      const acel = Math.max(acelP, acelT), freio = Math.max(freioP, freioT), mao = le(pads, 'mao') > .5 || seguras.has(SEGURAR.mao);
      // embreagem: pisada (além da metade do curso), solta o motor das rodas. Não é preciso pisar para trocar de marcha
      const embr = le(pads, 'embr') > .5 || seguras.has(SEGURAR.embr);
      if (toques.size || seguras.size || mao || embr || acelP > .1 || freioP > .1) ativa();
      if (!simulando) { tocaSom(0, 0, 0); return; }

      // marchas em sequência (ré, neutro, 1ª…). Como no jogo, não reduz se o giro passaria do limite nem engata a ré andando
      if (toques.has('sobe') && marcha < v.marchas.length) marcha++;
      if (toques.has('desce')) {
        const m = marcha - 1;
        if (m > 0 ? giro(Math.abs(u[motriz]), m) < v.rpmMax + 300 : m === 0 || (v.re && Math.abs(vx) < 1)) marcha = m;
      }
      if (toques.has('re') && v.re && Math.abs(vx) < 1) marcha = -1;

      // luzes
      if ((toques.has('setaE') || toques.has('setaD')) && luz('seta')) luz('seta').click();
      if (toques.has('alto') && luz('alto')) luz('alto').click();
      if (toques.has('farol')) $('luz').click();
      // as luzes do freio de mão, do neutro e as do miolo acompanham a simulação só no instante em que ela muda (puxou o freio,
      // trocou de marcha, girou a chave); entre uma mudança e outra os botões dessas luzes continuam funcionando normalmente
      if (mao !== maoAntes) { maoAntes = mao; if (luz('freio')) luz('freio').set(mao); }

      // ignição e partida; girando = motor de partida acionado
      let contato, girando;
      if (v.chave) {
        // pela tecla ou pelo controle: desligado -> ignição (II) -> partida (segura a III por 0,9 s) -> com o motor funcionando, desliga
        if (toques.has('ignicao')) { if (fase < 2) fase = 2; else if (!rodando) { fase = 3; soltarEm = agora + 900; } else fase = 0; }
        if (fase === 3 && soltarEm && agora > soltarEm) { fase = 2; soltarEm = 0; }
        contato = fase >= 2; girando = fase === 3;
      } else { // moto: o contato é o miolo do próprio painel
        const ligada = () => !$('chaveBtn') || $('chaveBtn').getAttribute('aria-pressed') === 'true';
        // pela tecla ou pelo controle: liga o contato -> partida (0,9 s no botão) -> com o motor funcionando, desliga
        if (toques.has('ignicao')) { if (ligada() && !rodando) soltarEm = agora + 900; else if ($('chaveBtn')) $('chaveBtn').click(); }
        contato = ligada(); girando = contato && (apertado || agora < soltarEm);
      }
      if (!contato || morto) rodando = false; // sem ignição ou depois da pane seca, só pega de novo dando a partida
      // o motor de partida gira o motor a uns 230 rpm; depois de 0,6 s girando, pega (se tiver combustível); no pedal, pega no chute
      if (girando && !rodando) { giraDesde = giraDesde ?? agora; if (agora - giraDesde > 600 && litros > SECO) { rodando = true; pegouEm = agora; } }
      else giraDesde = null;
      if (chute && contato && !rodando && litros > SECO) { rodando = true; pegouEm = agora; }
      chute = false;
      if (v.chave) {
        const estado = contato ? (rodando ? 2 : 1) : 0; // 0 desligado, 1 ignição ligada com o motor parado, 2 motor funcionando
        if (estado !== estadoAntes) {
          for (const id of v.chave.ateLigar) if (luz(id)) luz(id).set(estado === 1);
          if (!estadoAntes && estado) testeAte = agora + 3000;
          if (!estadoAntes && estado || !estado) for (const id of v.chave.teste) if (luz(id)) luz(id).set(!!estado);
          estadoAntes = estado;
        }
        if (testeAte && agora > testeAte) { testeAte = 0; for (const id of v.chave.teste) if (luz(id)) luz(id).set(false); }
        $('tambor').style.transform = `rotate(${FASES[fase][1]}deg)`;
        $('chaveCarro').querySelectorAll('[data-fase]').forEach((g, i) => g.classList.toggle('atual', i === fase));
        $('chaveCarro').setAttribute('aria-label', `Ignição: posição ${FASES[fase][0]}${rodando ? ', motor funcionando' : ''}`);
      } else {
        $('motorLigado').classList.toggle('on', rodando);
        $('motorLigado').title = rodando ? 'Motor funcionando' : 'Motor desligado';
      }
      toques.clear();
      const chave = contato + '|' + marcha;
      if (chave !== chaveAntes) { chaveAntes = chave; if (luz('neutro') && contato) luz('neutro').set(!marcha); }

      // combustível: quase a zero o motor engasga por uns segundos e morre; abastece-se mexendo no slider
      if (litros > SECO) { secoDesde = null; morto = false; }
      else if (!morto) { secoDesde = secoDesde ?? agora; morto = agora - secoDesde > 8000; }
      if (morto) litros = 0;
      const funciona = rodando && !morto;
      // engasgos: em fatias de 140 ms, pouco mais da metade delas sem queimar
      const engasgo = funciona && secoDesde !== null && Math.abs(Math.sin(Math.floor(agora / 140) * 12.9898) * 43758.5453) % 1 < .55;

      // direção: esterço das rodas, positivo para a esquerda. No volante o eixo manda direto nele. No analógico e no teclado, como
      // nos jogos, o esterço máximo diminui com a velocidade (o fim do curso pede o esterço da curva no limite de aderência mais
      // 8° de deriva, um pouco além do que os pneus da frente aguentam), a resposta é quadrática, para dar precisão perto do centro,
      // e as rodas viram no máximo a 40° por segundo
      let dirP = Math.max(-1, Math.min(1, le(pads, 'dir')));
      if (!ligas.volante && Math.abs(dirP) < .08) dirP = 0; // folga do analógico
      const tecla = (seguras.has(SEGURAR.esq) ? 1 : 0) - (seguras.has(SEGURAR.dirt) ? 1 : 0);
      if (ligas.volante && !tecla) esterco = dirP * v.esterco;
      else esterco += Math.max(-.7 * dt, Math.min(.7 * dt, (tecla || dirP * Math.abs(dirP)) * Math.min(v.esterco, Math.atan(L * ADER * G / Math.max(vx * vx, 1)) + .14) - esterco));

      const r = marcha ? rel(marcha) : 0, sentido = marcha < 0 ? -1 : 1;
      // logo depois de pegar, o giro sobe até o pico da partida (v.partida; sem ele, 25% acima da lenta) e volta em poucos segundos
      const lenta = v.lenta + ((v.partida || v.lenta * 1.25) - v.lenta) * Math.exp(-(agora - pegouEm) / 900);
      // corte de giro: no limite a injeção corta e só volta depois que o giro cai um pouco, então o ponteiro fica batendo no limite
      // Motor sem corte (v.semCorte, como o varetado da CG): não corta nada; perto do giro máximo as válvulas flutuam e ele vai
      // perdendo força até não subir mais
      if (v.semCorte) cortando = false;
      else if (rpm >= v.rpmMax) cortando = true; else if (rpm < v.rpmMax - (marcha && !embr ? 150 : 400)) cortando = false;
      const folego = v.semCorte ? Math.max(0, Math.min(1, (v.rpmMax - rpm) / (.05 * v.rpmMax))) : 1;
      const gas = cortando || engasgo ? 0 : acel * folego;

      // o quadro é dividido em passos de até 4 ms: os pneus respondem depressa demais para um passo só
      const passos = Math.ceil(dt / .004) || 1, h = dt / passos;
      const esc = [[0, 0], [0, 0]]; // quanto cada eixo escorrega [no sentido da roda, de lado], na unidade em que o pico do pneu é PICO
      for (let i = 0; i < passos; i++) {
        // motor e embreagem. acoplado = giro que as rodas motrizes impõem; travada = embreagem solta, motor girando junto com elas
        const acoplado = marcha ? giro(sentido * u[motriz], marcha) : 0;
        let motor = 0, travada = false; // motor = torque que chega ao câmbio, N·m
        // motor parado: o giro zera (ou fica nos 230 rpm do motor de partida) e o veículo segue solto, perdendo velocidade
        if (!funciona) rpm += ((giraDesde !== null ? 230 : 0) - rpm) * Math.min(1, h * (giraDesde !== null ? 14 : 4));
        // em neutro ou com a embreagem pisada o motor gira livre: sobe pelo torque que sobra e cai pelo atrito; a marcha lenta segura o giro embaixo
        else if (!marcha || embr) rpm = Math.min(v.rpmMax + 150, Math.max(Math.min(engasgo ? lenta * .5 : lenta, rpm + 6000 * h), rpm + (gas * torque(rpm) - atrito(rpm)) / v.inercia * 30 / Math.PI * h));
        else if (acoplado >= lenta) { rpm = acoplado; motor = gas * torque(rpm) - (1 - gas) * atrito(rpm); travada = true; }
        else if (gas > .05) { rpm = lenta * (1 + 1.8 * gas); motor = gas * torque(rpm); } // saída: a embreagem patina
        else rpm += (lenta - rpm) * Math.min(1, h * 5);                                    // devagar demais sem acelerar: embreagem aberta

        // pneus, um eixo por vez (modelo de bicicleta). A aceleração joga peso para trás e a freada, para a frente
        const transf = massa * ax * v.hcg / L;
        let fx = 0, fy = 0, mz = 0; // forças e momento de guinada no veículo
        for (let e = 0; e < 2; e++) {
          const carga = Math.max(0, massa * G * (e ? 1 - v.frente : v.frente) + (e ? transf : -transf));
          const c = e ? 1 : Math.cos(esterco), s = e ? 0 : Math.sin(esterco), vyE = vy + (e ? -cgT : cgF) * wz;
          const longo = vx * c + vyE * s, lado = vyE * c - vx * s; // velocidade do eixo no sentido da roda e de lado
          const den = Math.max(Math.abs(longo), 3);                // abaixo de uns 10 km/h o escorregamento deixa de ser relativo
          const kx = RIG_LONGO * (u[e] - longo) / den / ADER, ky = -RIG_LADO[e] * lado / den / ADER_LADO[e], k = Math.hypot(kx, ky);
          const forca = carga * (k > 1e-6 ? pneu(k) / k : 1); // força por unidade de escorregamento e de aderência
          const rig = forca * RIG_LONGO / den;                // rigidez no sentido da roda, N por m/s
          // a roda tem inércia (2% da massa do veículo por eixo, vista na banda) e, com a embreagem solta, leva junto a do motor.
          // Ela é integrada de forma implícita, para o passo não precisar ser ainda menor
          const inercia = .02 * massa + (e === motriz && travada ? v.inercia * r * r / (raio * raio) : 0);
          const tracao = e === motriz ? sentido * motor * r * RENDIMENTO / raio : 0;
          const livre = (inercia * u[e] + h * (tracao + rig * longo)) / (inercia + h * rig);
          // freios: no fundo pedem 1,15 g, mais do que os pneus dão, e sem ABS a roda trava; o freio de mão age atrás
          const freada = h * (freio * massa * G * 1.15 * (e ? 1 - v.freioDiant : v.freioDiant) + (e && mao ? massa * 4 : 0)) / (inercia + h * rig);
          u[e] = Math.abs(livre) <= freada ? 0 : livre - Math.sign(livre) * freada;
          const fLongo = rig * (u[e] - longo), fLado = ADER_LADO[e] * forca * ky;
          const lateral = fLongo * s + fLado * c;
          fx += fLongo * c - fLado * s; fy += lateral; mz += (e ? -cgT : cgF) * lateral;
          esc[e] = [RIG_LONGO * (u[e] - longo) / den / ADER, ky];
        }
        // arrasto do ar e resistência à rolagem (esta some suave perto de parar)
        const f = fx - .5 * AR * v.cxA * Math.abs(vx) * vx - .013 * massa * G * Math.max(-1, Math.min(1, vx / .5));
        ax += (f / massa - ax) * Math.min(1, h * 20);
        const vxNovo = vx + (f / massa + wz * vy) * h;
        vy += (fy / massa - wz * vx) * h; wz += mz / guinada * h; vx = vxNovo;
      }

      // perda de aderência: roda travada pelo freio com o veículo andando, ou pneu escorregando além do pico
      const anda = Math.hypot(vx, vy) > 1.5;
      const perda = anda && u.some((x, e) => !x && (freio > .05 || (e && mao))) ? 'Rodas travadas'
        : !anda && Math.abs(u[motriz]) < 1.5 ? ''
        : esc[motriz][0] * sentido > 1.15 * PICO ? 'Patinando'
        : Math.abs(esc[1][1]) > 1.15 * PICO ? 'Saindo de traseira' : Math.abs(esc[0][1]) > 1.15 * PICO ? 'Saindo de frente' : '';
      if (perda) { perdaTexto = perda; perdaAte = agora + 400; }
      $('aviso').textContent = morto ? 'Sem combustível' : secoDesde !== null ? 'Combustível acabando' : !rodando ? (contato ? 'Motor parado' : 'Ignição desligada') : agora < perdaAte ? perdaTexto : '';

      // consumo: proporcional à potência que o motor entrega mais a que ele gasta para girar (rendimento de 33%, gasolina);
      // engatado e com o acelerador solto a injeção corta. O seletor "Tempo" acelera o consumo junto com o hodômetro
      if (funciona && !(gas < .02 && marcha && rpm > v.lenta * 1.6))
        litros = Math.max(0, litros - (gas * torque(rpm) + .6 * atrito(rpm)) * rpm * Math.PI / 30 / (.33 * 43e6 * .745) * dt * $('mult').value);

      // o velocímetro lê a roda dianteira (nos carros, a saída do câmbio; na moto, o cubo): patinando ou travada, é ela que ele mostra
      // som: motor funcionando no volume cheio; só o motor de partida girando, mais baixo; parado, mudo
      tocaSom(rpm, cortando || engasgo ? 0 : acel, rpm < 60 ? 0 : funciona ? 1 : .5); // sem corte, o som não cai no giro máximo
      mostra('comb', litros / porUnidade, .1); mostra('rpm', rpm, 10); mostra('vel', Math.abs(u[0]) * 3.6, .1);
      $('marcha').textContent = marcha > 0 ? marcha : marcha ? 'R' : 'N';
    })(ultimo);
  }

  return { ligar };
})();
